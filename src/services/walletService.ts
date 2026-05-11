import { auth } from "../lib/firebase";

const API_BASE = "/api";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export const walletService = {
  async getStats() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/stats`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async transfer(receiverEmail: string, amount: number) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/wallet/transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({ receiverEmail, amount }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async convertInvestment(amount: number, action: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/wallet/investment/use`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, action }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async requestReward(amount: number) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/wallet/reward`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async boostProfile(amount: number, target: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/wallet/boost`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, target }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resetPhase() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/phase/reset`, {
      method: "POST",
      headers,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getAuditData() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/audit-data`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
