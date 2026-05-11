import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import { z } from "zod";

// Initialize Firebase Admin
// In AI Studio Cloud Run, it should pick up the project ID automatically or we use the config
import firebaseConfig from "./firebase-applet-config.json";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();

const app = express();
app.use(express.json());

const PORT = 3000;

// Middleware to verify Firebase ID Token
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const idToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- WALLET API ---

// 1. Reward Distribution (51% Withdrawable, 49% Investment)
app.post("/api/wallet/reward", authenticate, async (req: any, res: any) => {
  const schema = z.object({ amount: z.number().positive() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { amount } = result.data;
  
  // Dynamic Economy: Adjust reward split based on user count
  const totalUsers = (await db.collection("users").count().get()).data().count;
  const withdrawableRate = totalUsers > 100 ? 0.45 : 0.51; // Less liquidity as system grows
  const investmentRate = 1 - withdrawableRate;

  const withdrawable = amount * withdrawableRate;
  const investment = amount * investmentRate;

  const userRef = db.collection("users").doc(req.user.uid);

  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");
      const userData = userDoc.data();

      t.update(userRef, {
        withdrawableBalance: admin.firestore.FieldValue.increment(withdrawable),
        investmentBalance: admin.firestore.FieldValue.increment(investment),
        totalEarned: admin.firestore.FieldValue.increment(amount),
      });

      const txRef = db.collection("transactions").doc();
      t.set(txRef, {
        senderId: "SYSTEM",
        receiverId: req.user.uid,
        amount,
        type: "REWARD",
        status: "COMPLETED",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { withdrawable, investment },
      });
      
      t.update(userRef, {
        trustScore: admin.firestore.FieldValue.increment(0.2), // Earning rewards slightly improves trust
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true, withdrawable, investment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Transfer (Max 49% of withdrawable, 7% fee, 3 ops/phase)
app.post("/api/wallet/transfer", authenticate, async (req: any, res: any) => {
  const schema = z.object({
    receiverEmail: z.string().email(),
    amount: z.number().positive(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { receiverEmail, amount } = result.data;
  const senderRef = db.collection("users").doc(req.user.uid);

  try {
    const receiverQuery = await db.collection("users").where("email", "==", receiverEmail).limit(1).get();
    if (receiverQuery.empty) throw new Error("Receiver not found");
    const receiverRef = receiverQuery.docs[0].ref;
    const receiverId = receiverQuery.docs[0].id;

    if (receiverId === req.user.uid) throw new Error("Cannot transfer to yourself");

    await db.runTransaction(async (t) => {
      const senderDoc = await t.get(senderRef);
      if (!senderDoc.exists) throw new Error("Sender not found");
      const senderData = senderDoc.data()!;

      // Checks
      if (senderData.currentPhaseTransfers >= 3) throw new Error("Max 3 transfers per phase");
      const maxTransfer = senderData.withdrawableBalance * 0.49;
      if (amount > maxTransfer) throw new Error("Transfer exceeds 49% limit");

      const fee = amount * 0.07;
      const totalDebit = amount + fee;

      if (senderData.withdrawableBalance < totalDebit) throw new Error("Insufficient balance");

      // Advanced Protection: Fraud Scoring
      const senderTrust = senderData.trustScore || 50;
      if (senderTrust < 30 && amount > 100) {
        throw new Error("Transaction flagged. Your trust score is too low for high-value transfers (Minimum 30 required).");
      }

      t.update(senderRef, {
        withdrawableBalance: admin.firestore.FieldValue.increment(-totalDebit),
        currentPhaseTransfers: admin.firestore.FieldValue.increment(1),
        trustScore: admin.firestore.FieldValue.increment(-1), // Direct transfers slightly reduce trust (peer-to-peer risk)
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });

      t.update(receiverRef, {
        withdrawableBalance: admin.firestore.FieldValue.increment(amount),
      });

      const txRef = db.collection("transactions").doc();
      t.set(txRef, {
        senderId: req.user.uid,
        receiverId,
        amount,
        fee,
        type: "TRANSFER",
        sourceWallet: "WITHDRAWABLE",
        destWallet: "WITHDRAWABLE",
        status: "COMPLETED",
        senderTrust,
        deviceFingerprint: req.headers["user-agent"],
        ipMetadata: req.ip,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Investment Wallet Usage (20% fee, 3 ops/phase, non-withdrawable)
app.post("/api/wallet/investment/use", authenticate, async (req: any, res: any) => {
  const schema = z.object({
    amount: z.number().positive(),
    action: z.enum(["AD_CONVERSION", "MARKETPLACE", "RAFFLE"]),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { amount, action } = result.data;
  const userRef = db.collection("users").doc(req.user.uid);

  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data()!;

      if (userData.currentPhaseOperations >= 3) throw new Error("Max 3 operations per phase");
      
      const fee = amount * 0.20;
      const totalDebit = amount + fee;

      if (userData.investmentBalance < totalDebit) throw new Error("Insufficient investment balance");

      t.update(userRef, {
        investmentBalance: admin.firestore.FieldValue.increment(-totalDebit),
        currentPhaseOperations: admin.firestore.FieldValue.increment(1),
        trustScore: admin.firestore.FieldValue.increment(1.5), // Using internal economy increases trust
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (action === "AD_CONVERSION") {
        t.update(userRef, {
          purchasedAdBalance: admin.firestore.FieldValue.increment(amount),
        });
      }

      const txRef = db.collection("transactions").doc();
      t.set(txRef, {
        senderId: req.user.uid,
        amount,
        fee,
        type: "CONVERSION",
        sourceWallet: "INVESTMENT",
        status: "COMPLETED",
        action,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Boost Profile (Using Ad Wallet)
app.post("/api/wallet/boost", authenticate, async (req: any, res: any) => {
  const schema = z.object({
    amount: z.number().positive(),
    target: z.enum(["POST", "FOLLOWER_CAMPAIGN", "INFLUENCER"]),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json(result.error);

  const { amount, target } = result.data;
  const userRef = db.collection("users").doc(req.user.uid);

  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data()!;

      if (userData.purchasedAdBalance < amount) throw new Error("Insufficient Advertising Balance");

      t.update(userRef, {
        purchasedAdBalance: admin.firestore.FieldValue.increment(-amount),
        trustScore: admin.firestore.FieldValue.increment(3), // High-value engagement boosting
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      });

      const txRef = db.collection("transactions").doc();
      t.set(txRef, {
        senderId: req.user.uid,
        amount,
        type: "BOOST",
        sourceWallet: "PURCHASED_AD",
        status: "COMPLETED",
        target,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true, aiAnalysis: "Engagement quality predicted: High. Audience targeting optimized by NokTek AI." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Stats
app.get("/api/admin/stats", authenticate, async (req: any, res: any) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const totalUsers = (await db.collection("users").count().get()).data().count;
    const users = await db.collection("users").get();
    
    let circulatingSupply = 0;
    let lockedSupply = 0;
    let adSupply = 0;

    users.forEach(u => {
      circulatingSupply += u.data().withdrawableBalance || 0;
      lockedSupply += u.data().investmentBalance || 0;
      adSupply += u.data().purchasedAdBalance || 0;
    });

    res.json({
      totalUsers,
      circulatingSupply,
      lockedSupply,
      adSupply,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Data for AI Fraud Detection
app.get("/api/admin/audit-data", authenticate, async (req: any, res: any) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    // Fetch last 100 transfers for analysis
    const transfers = await db.collection("transactions")
      .where("type", "==", "TRANSFER")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const data = transfers.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Fetch some user metadata for context (trust scores, etc)
    const userSnap = await db.collection("users").limit(50).get();
    const users = userSnap.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      trustScore: doc.data().trustScore || 50,
      createdAt: doc.data().createdAt,
    }));

    res.json({ transactions: data, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Phase Reset
app.post("/api/admin/phase/reset", authenticate, async (req: any, res: any) => {
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      if (!userDoc.data()?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  
      const users = await db.collection("users").get();
      const batch = db.batch();
      users.forEach(u => {
        batch.update(u.ref, {
          currentPhaseTransfers: 0,
          currentPhaseOperations: 0
        });
      });
      await batch.commit();
  
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

// --- VITE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
