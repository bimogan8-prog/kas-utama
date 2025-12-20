import { Transaction, User } from '../types/types';

/**
 * CONFIGURASI SERVER UTAMA
 * Gunakan localhost untuk pengembangan lokal
 */
const API_BASE_URL = 'http://localhost:3000';

// USER DATA (Client-Side Logic - Tidak perlu DB)
const LOCAL_USERS = [
  { id: 'w1', username: 'wirdan', name: 'Wirdan', role: 'worker', password: 'rasau@40' },
  { id: 'w2', username: 'zulfan', name: 'Zulfan', role: 'worker', password: 'sorek@50' },
  { id: 'a1', username: 'mazkafh', name: 'Admin Mazkafh', role: 'admin', password: 'admin' }
];

export const dataService = {
  // 1. Authenticate (Login) - STRICTLY CLIENT SIDE (NO FETCH)
  authenticate: async (username: string, password: string): Promise<User | null> => {
    // Simulasi delay kecil agar terasa natural
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = LOCAL_USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Return user tanpa password
      const { password: _, ...userData } = user;
      return userData as User;
    }
    return null;
  },

  // 2. Get Transactions -> /list-kas (TETAP KE DB)
  getTransactions: async (filters: { uid?: string; date?: string; month?: string; year?: string; all?: boolean }): Promise<Transaction[]> => {
    try {
      // Construct Query Params
      const params = new URLSearchParams();
      if (filters.uid) params.append('uid', filters.uid);
      if (filters.date) params.append('date', filters.date);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.all) params.append('all', 'true');

      // UPDATE ENDPOINT: /transactions -> /list-kas
      const response = await fetch(`${API_BASE_URL}/list-kas?${params.toString()}`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const rawData = await response.json();

      return rawData.map((item: any) => ({
        id: item.id.toString(),
        uid: item.uid || 'unknown',
        nama_user: item.name || item.nama_user || 'Unknown', 
        type: item.type,
        nominal: Number(item.nominal), 
        kategori: item.kategori,
        keterangan: item.keterangan,
        notaUrl: item.notaUrl || '',
        timestamp: new Date(item.timestamp).getTime(),
        isSynced: true
      }));

    } catch (error) {
      console.error("Fetch Data Error:", error);
      // Return empty array on error so app doesn't crash
      return [];
    }
  },

  // 3. Add Transaction -> /tambah-kas (TETAP KE DB)
  addTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    try {
      const payload = {
        name: transaction.nama_user, 
        type: transaction.type,
        nominal: transaction.nominal,
        kategori: transaction.kategori,
        keterangan: transaction.keterangan,
        notaUrl: transaction.notaUrl || '',
        // Kirim timestamp agar tanggal pilihan user tersimpan
        timestamp: new Date(transaction.timestamp).toISOString().slice(0, 19).replace('T', ' ')
      };

      // UPDATE ENDPOINT: /transactions -> /tambah-kas
      const response = await fetch(`${API_BASE_URL}/tambah-kas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("Add Data Error:", error);
      return false;
    }
  },

  // 4. Delete Transaction -> /hapus-kas/:id (TETAP KE DB)
  deleteExpense: async (id: string) => {
    try {
      // UPDATE ENDPOINT: /transactions/:id -> /hapus-kas/:id
      const response = await fetch(`${API_BASE_URL}/hapus-kas/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error("Delete Error:", error);
      return false;
    }
  },

  // 5. Get Master Stats (TETAP KE DB)
  getMasterStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) return await response.json();
      return { count: 0, income: 0, expense: 0 };
    } catch (error) {
      console.error("Stats Error:", error);
      return { count: 0, income: 0, expense: 0 };
    }
  }
};