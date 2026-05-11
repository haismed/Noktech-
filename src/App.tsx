import { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { auth, db, signIn, signOut } from "./lib/firebase";
import { handleFirestoreError, OperationType, cn } from "./lib/utils";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Zap, 
  History,
  TrendingUp,
  CreditCard,
  Users,
  Settings,
  AlertCircle,
  ShieldCheck,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { walletService } from "./services/walletService";
import { format } from "date-fns";

// --- Types ---
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  withdrawableBalance: number;
  investmentBalance: number;
  purchasedAdBalance: number;
  totalEarned: number;
  currentPhaseTransfers: number;
  currentPhaseOperations: number;
  isAdmin?: boolean;
  trustScore?: number;
}

interface Transaction {
  id: string;
  senderId: string;
  receiverId?: string;
  amount: number;
  fee?: number;
  type: string;
  status: string;
  timestamp: any;
  sourceWallet?: string;
  destWallet?: string;
  action?: string;
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"wallet" | "admin">("wallet");

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        try {
          onSnapshot(userRef, (snap) => {
            if (!snap.exists()) {
              setDoc(userRef, {
                uid: u.uid,
                email: u.email,
                displayName: u.displayName || "User",
                withdrawableBalance: 0,
                investmentBalance: 0,
                purchasedAdBalance: 0,
                totalEarned: 0,
                currentPhaseTransfers: 0,
                currentPhaseOperations: 0,
                trustScore: 50,
                isAdmin: u.email === "zhaisouss@gmail.com",
                createdAt: serverTimestamp(),
              }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${u.uid}`));
            } else {
              setProfile(snap.data() as UserProfile);
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, `users/${u.uid}`));
        } catch (e) {
          console.error(e);
        }
      } else {
        setProfile(null);
      }
    });
  }, []);

  // Transactions Listener
  useEffect(() => {
    if (!user) return;
    const q1 = query(collection(db, "transactions"), where("senderId", "==", user.uid), orderBy("timestamp", "desc"), limit(20));
    const q2 = query(collection(db, "transactions"), where("receiverId", "==", user.uid), orderBy("timestamp", "desc"), limit(20));

    const unsub1 = onSnapshot(q1, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(prev => {
        const others = prev.filter(t => t.receiverId === user.uid);
        const combined = [...txs, ...others].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        return combined.slice(0, 30);
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, "transactions"));

    const unsub2 = onSnapshot(q2, (snap) => {
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(prev => {
        const others = prev.filter(t => t.senderId === user.uid);
        const combined = [...txs, ...others].sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        return combined.slice(0, 30);
      });
    }, (err) => handleFirestoreError(err, OperationType.GET, "transactions"));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
    if (profile?.isAdmin && activeTab === "admin") {
      walletService.getStats().then(setAdminStats).catch(console.error);
    }
  }, [profile, activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E4E3E0] font-sans overflow-hidden flex flex-col border border-[#1F2937]">
      {/* Technical Header */}
      <header className="h-16 border-b border-[#1F2937] bg-[#15181E] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white mr-3">NT</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight uppercase leading-none">NokTek <span className="text-blue-500">Economy Engine</span></h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">System Status: Optimal • Transactional Integrity: Verified</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:block text-right">
            <p className="text-[10px] text-gray-500 uppercase">Primary Node</p>
            <p className="text-blue-400 font-mono font-bold text-xs uppercase">{user.uid.slice(0, 8)}</p>
          </div>
          <div className="h-8 w-[1px] bg-[#1F2937]"></div>
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setActiveTab("wallet")}
              className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === "wallet" ? "text-blue-400" : "text-gray-500 hover:text-white")}
            >
              Wallet
            </button>
            {profile?.isAdmin && (
              <button 
                onClick={() => setActiveTab("admin")}
                className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === "admin" ? "text-blue-400" : "text-gray-500 hover:text-white")}
              >
                Dashboard
              </button>
            )}
            <button onClick={signOut} className="text-gray-500 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#1F2937] bg-[#111419] p-4 flex flex-col gap-6 shrink-0 overflow-y-auto">
          <section>
            <h2 className="text-[11px] font-bold text-gray-500 uppercase mb-3 tracking-widest italic font-serif">Internal Profile</h2>
            <div className="bg-[#1C2028] p-4 border border-[#1F2937] rounded relative overflow-hidden">
              <p className="text-xs font-bold leading-tight truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{profile?.email}</p>
              <div className="mt-3 pt-3 border-t border-[#1F2937] flex gap-4">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Xfer Cap</p>
                  <p className="text-xs font-mono">{profile?.currentPhaseTransfers}/3</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Ops</p>
                  <p className="text-xs font-mono">{profile?.currentPhaseOperations}/3</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-bold text-gray-500 uppercase mb-3 tracking-widest italic font-serif">System Health</h2>
            <div className="space-y-3">
              <div className={cn("bg-[#1C2028] p-3 rounded border-l-2", (profile?.trustScore || 50) > 70 ? "border-emerald-500" : (profile?.trustScore || 50) > 40 ? "border-blue-500" : "border-red-500")}>
                <p className="text-[9px] text-gray-400 uppercase">Personal Trust Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono tracking-tighter">{(profile?.trustScore || 50).toFixed(1)}%</p>
                  <ShieldCheck className={cn("w-3 h-3", (profile?.trustScore || 50) > 70 ? "text-emerald-500" : "text-gray-500")} />
                </div>
              </div>
              <div className="bg-[#1C2028] p-3 rounded border-l-2 border-blue-500">
                <p className="text-[9px] text-gray-400 uppercase">Phase Efficiency</p>
                <p className="text-lg font-mono tracking-tighter">{(100 - ((profile?.currentPhaseTransfers || 0) * 15)).toFixed(1)}%</p>
              </div>
            </div>
          </section>

          <section className="mt-auto">
            <div className="bg-red-900/10 border border-red-900/50 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-red-500 font-bold uppercase">Fraud Guard</p>
                <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
              </div>
              <p className="text-[10px] text-red-200/70 leading-tight">No active laundering patterns detected in current user environment.</p>
            </div>
          </section>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "wallet" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Balances Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#1F2937]">
                <BalanceBlock 
                  label="Withdrawable" 
                  value={profile?.withdrawableBalance || 0} 
                  sub="51% EARNING SPLIT" 
                  accent="blue" 
                  stats={[
                    { label: "MAX XFER", val: ((profile?.withdrawableBalance || 0) * 0.49).toFixed(2), unit: "PTS" },
                    { label: "FEE", val: "7", unit: "%" }
                  ]}
                />
                <BalanceBlock 
                  label="Investment" 
                  value={profile?.investmentBalance || 0} 
                  sub="49% EARNING SPLIT" 
                  accent="amber" 
                  stats={[
                    { label: "CONVERSION", val: "ALLOWED", unit: "" },
                    { label: "FEE", val: "20", unit: "%" }
                  ]}
                />
                <BalanceBlock 
                  label="Advertising" 
                  value={profile?.purchasedAdBalance || 0} 
                  sub="PURCHASED POOL" 
                  accent="emerald" 
                  stats={[
                    { label: "XFER", val: "BLOCKED", unit: "", color: "text-red-400" },
                    { label: "WITHDRAW", val: "BLOCKED", unit: "", color: "text-red-400" }
                  ]}
                />
              </div>

              {/* Transactions & Actions */}
              <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-end mb-4 shrink-0">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif">Recent Ledger Operations</h3>
                    <div className="text-[9px] text-blue-400 font-mono bg-blue-400/10 px-3 py-1 border border-blue-400/30 rounded uppercase tracking-wider">Live Transaction Feed</div>
                  </div>
                  
                  <div className="flex-1 border border-[#1F2937] rounded overflow-hidden flex flex-col bg-[#0F1115]">
                    <div className="grid grid-cols-5 text-[9px] text-gray-500 uppercase font-mono border-b border-[#1F2937] bg-[#15181E] p-3 px-4 shrink-0">
                      <div>Timestamp</div>
                      <div>Type</div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">Fee</div>
                      <div className="text-right">Status</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-5 p-3 px-4 border-b border-[#1F2937] font-mono text-[11px] hover:bg-white hover:text-black transition-colors group cursor-default">
                          <div className="text-gray-500 group-hover:text-black">{tx.timestamp ? format(tx.timestamp.toDate(), "HH:mm:ss") : "PENDING"}</div>
                          <div className="uppercase">{tx.type}</div>
                          <div className={cn("text-right font-bold", tx.senderId === user.uid && tx.type !== "REWARD" ? "text-red-400 group-hover:text-black" : "text-emerald-400 group-hover:text-black")}>
                            {tx.senderId === user.uid && tx.type !== "REWARD" ? "-" : "+"}{tx.amount.toLocaleString()}
                          </div>
                          <div className="text-right text-gray-500 group-hover:text-black">{tx.fee ? tx.fee.toFixed(2) : "0.00"}</div>
                          <div className="text-right uppercase text-[9px] font-bold tracking-widest">{tx.status}</div>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <div className="p-12 text-center text-gray-600 font-mono text-xs italic uppercase tracking-widest">No active transaction history found</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pr-1">
                  <ActionPanel profile={profile} />
                </div>
              </div>
            </div>
          ) : (
            <AdminPanel stats={adminStats} />
          )}

          {/* Footer Grid */}
          <footer className="h-12 border-t border-[#1F2937] bg-[#15181E] flex items-center px-6 text-[10px] justify-between shrink-0">
            <div className="flex gap-6 uppercase tracking-widest text-gray-500 font-bold">
              <span>Atomic Lock: <span className="text-emerald-500">Active</span></span>
              <span>Encrypted Ledger: <span className="text-emerald-500">Immutable</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-gray-300 font-mono">SECURE CONNECTION - NODE_{user.uid.slice(-4)}_HK</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function BalanceBlock({ label, value, sub, accent, stats }: any) {
  const accentColors = {
    blue: "text-blue-400 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10"
  };
  
  return (
    <div className="p-6 border-r border-[#1F2937] bg-[#15181E]/50">
      <div className="flex justify-between items-start mb-4">
        <h3 className={cn("text-[11px] font-bold uppercase tracking-widest", accentColors[accent as keyof typeof accentColors].split(" ")[0])}>{label}</h3>
        <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold uppercase", accentColors[accent as keyof typeof accentColors])}>{sub}</span>
      </div>
      <div className="mb-4">
        <p className="text-4xl font-mono tracking-tighter leading-none">{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-2">Current Points Available</p>
      </div>
      <div className="space-y-1.5">
        {stats.map((s: any) => (
          <div key={s.label} className="flex justify-between text-[10px] text-gray-400 font-mono">
           <span>{s.label}:</span>
           <span className={cn("font-bold", s.color || "text-gray-200")}>{s.val} {s.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPanel({ profile }: { profile: UserProfile | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTransfer = async (e: any) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      await walletService.transfer(e.target.email.value, Number(e.target.amount.value));
      setSuccess("LOG: Transfer operation verified and executed.");
      e.target.reset();
    } catch (e: any) { setError(`FATAL: ${e.message}`); }
    finally { setLoading(false); }
  };

  const handleAction = async (type: string, action: string) => {
    const amount = prompt(`Enter points for ${action.replace("_", " ")}:`);
    if (!amount || isNaN(Number(amount))) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      if (type === "INVESTMENT") {
        await walletService.convertInvestment(Number(amount), action);
        setSuccess("LOG: Investment conversion finalized.");
      } else {
        const res = await walletService.boostProfile(Number(amount), action);
        setSuccess(`AI: ${res.aiAnalysis}`);
      }
    } catch (e: any) { setError(`ERR: ${e.message}`); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif mb-3">Asset Transfer</h3>
        <form onSubmit={handleTransfer} className="space-y-3">
          <input name="email" required type="email" placeholder="TARGET_EMAIL" className="w-full bg-[#1C2028] border border-[#1F2937] px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors" />
          <input name="amount" required type="number" placeholder="UNIT_AMOUNT" className="w-full bg-[#1C2028] border border-[#1F2937] px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-colors" />
          <button disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50">Execute Transfer</button>
        </form>
      </section>

      <section>
         <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif mb-3">Investment Terminal</h3>
         <div className="grid grid-cols-1 gap-2">
           <ActionButton onClick={() => handleAction("INVESTMENT", "AD_CONVERSION")} label="Point Conversion" sub="20% FEE" />
           <ActionButton onClick={() => handleAction("INVESTMENT", "MARKETPLACE")} label="Market Asset" sub="20% FEE" />
           <ActionButton onClick={() => handleAction("INVESTMENT", "RAFFLE")} label="Raffle Core" sub="20% FEE" />
         </div>
      </section>

      <section>
         <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif mb-3">Advertising Fuel</h3>
         <div className="grid grid-cols-1 gap-2">
           <ActionButton onClick={() => handleAction("BOOST", "POST")} label="Post Overclock" />
           <ActionButton onClick={() => handleAction("BOOST", "FOLLOWER_CAMPAIGN")} label="Node Propagation" />
         </div>
      </section>
      
      <button onClick={() => walletService.requestReward(1000)} className="w-full py-4 border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-bold text-xs uppercase tracking-tighter hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2">
        <Zap className="w-4 h-4" /> Initialize Earnings (+1000)
      </button>

      <AnimatePresence>
        {(error || success) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn(
            "p-3 rounded text-[9px] font-mono leading-tight uppercase border",
            error ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          )}>
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ onClick, label, sub }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 bg-[#1C2028] border border-[#1F2937] hover:bg-white hover:text-black transition-all group">
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {sub && <span className="text-[9px] text-gray-500 font-mono group-hover:text-black">{sub}</span>}
    </button>
  );
}

function AdminPanel({ stats }: { stats: any }) {
  if (!stats) return <div className="p-20 text-center font-mono text-[10px] uppercase animate-pulse">Initializing Global Economy Feed...</div>;

  const chartData = [
    { name: "Withdrawable", value: stats.circulatingSupply, color: "#2563eb" },
    { name: "Investment", value: stats.lockedSupply, color: "#f59e0b" },
    { name: "Advertising", value: stats.adSupply, color: "#10b981" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Economy Control Panel</h2>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-mono mt-1">Live Aggregate Distribution Metrics</p>
        </div>
        <div className="flex gap-4">
           <AdminAIFraudAudit />
           <button onClick={() => walletService.resetPhase()} className="px-6 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20">
            Reset Dist. Phase
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 border border-[#1F2937] divide-x divide-[#1F2937]">
        <StatCell label="Node Count" val={stats.totalUsers} icon={<Users className="w-4 h-4" />} />
        <StatCell label="Circulating" val={stats.circulatingSupply} icon={<Zap className="w-4 h-4" />} />
        <StatCell label="Invested" val={stats.lockedSupply} icon={<Lock className="w-4 h-4" />} />
        <StatCell label="Ad Pool" val={stats.adSupply} icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-[#1F2937] bg-[#111419] p-8">
           <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif mb-8 text-center">Supply Balance Vectors</h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <XAxis dataKey="name" hide />
                 <YAxis hide />
                 <Tooltip contentStyle={{ background: "#0F1115", border: "1px solid #1F2937", borderRadius: 0, fontSize: "10px" }} />
                 <Bar dataKey="value" barSize={80}>
                   {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="border border-[#1F2937] bg-[#111419] p-8 flex flex-col items-center">
           <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic font-serif mb-8">Asset Allocation Ratio</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex gap-4 mt-4">
              {chartData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] font-mono uppercase text-gray-500">{d.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, val, icon }: any) {
  return (
    <div className="p-6 bg-[#15181E]/50 group">
      <div className="flex items-center gap-2 mb-2 text-gray-500 group-hover:text-blue-400 font-mono transition-colors">
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono tracking-tighter">{val.toLocaleString()}</span>
        <span className="text-[10px] text-gray-600 font-bold uppercase">UNIT</span>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-[#1F2937] bg-[#111419] p-12 max-w-sm w-full text-center space-y-8">
        <div className="w-16 h-16 bg-blue-600 mx-auto flex items-center justify-center font-black text-2xl text-white">NT</div>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tighter">NokTek Economy v2.5</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Attention Monetization & Liquidity Gateway</p>
        </div>
        <button onClick={signIn} className="w-full py-3 bg-[#E4E3E0] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-all transform active:scale-95">Access Terminal</button>
        <div className="pt-8 border-t border-[#1F2937] text-[9px] font-mono text-gray-600 uppercase tracking-wider leading-relaxed">
          Transactional Integrity Verified <br />
          Encrypted Node Distribution Active <br />
          Current Epoch: ALPHA_STABLE
        </div>
      </motion.div>
    </div>
  );
}

function AdminAIFraudAudit() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const runAudit = async () => {
    setLoading(true);
    setReport(null);
    try {
      const data = await walletService.getAuditData();
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the NokTek Economy Guardian, an advanced AI fraud investigator. 
          Analyze the provided transaction and user data. Look for:
          1. Multi-account abuse (users sharing device fingerprints or IPs - though not provided, infer from timing).
          2. Reward farming (low trust score users getting many system rewards and immediately transferring).
          3. Circular transfers (User A -> B -> C -> A).
          4. Money laundering (Large transfers from high-trust to low-trust accounts).
          
          Provide a technical, structured report in HTML. Highlight specific risky User IDs.
          Use 🚨 for high risk, ⚠️ for medium risk, and ✅ for healthy patterns.
          Style the HTML using Tailwind classes (e.g., text-red-500, font-mono, bg-slate-900).`,
        },
        contents: `Audit Data Segment: ${JSON.stringify({
          transactions: data.transactions.map((t: any) => ({
            from: t.senderId,
            to: t.receiverId,
            amt: t.amount,
            type: t.type,
            time: t.timestamp
          })).slice(0, 50),
          users: data.users
        })}`,
      });

      setReport(response.text || "No analysis generated.");
    } catch (e: any) {
      console.error(e);
      setReport(`<p class="text-red-500 font-mono">CRITICAL_SYSTEM_ERROR: ${e.message}</p>`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => { setShowModal(true); runAudit(); }}
        className="px-6 py-2 bg-blue-600/20 border border-blue-600/50 text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition-all flex items-center gap-2"
      >
        <BrainCircuit className="w-3 h-3" /> Run AI Fraud Audit
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1115] border border-[#1F2937] w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="h-12 border-b border-[#1F2937] bg-[#15181E] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest italic">AI Sentinel: Fraud Detection Report</span>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 font-mono text-sm leading-relaxed">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] animate-pulse">Scanning Ledger for Anomalies...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: report || "" }} />
                )}
              </div>

              <div className="h-10 border-t border-[#1F2937] bg-[#111419] flex items-center px-6 text-[9px] text-gray-600 uppercase tracking-widest justify-between">
                <span>Analysis by Gemini 3 Flash Preview</span>
                <span>Confidential NokTek Admin Data</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function Lock(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
