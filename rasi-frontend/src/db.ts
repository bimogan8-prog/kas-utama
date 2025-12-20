import { Transaction, User } from './types/types';

/**
 * CONFIGURASI BACKEND MYSQL
 * Mengarah ke localhost untuk dev lokal.
 * Pastikan backend sudah dijalankan dengan `node server.js`
 */
const API_BASE_URL = 'http://localhost:3000'; 

// USER DATA LOKAL
const LOCAL_USERS = [
  { id: 'w1', username: 'wirdan', name: 'Wirdan', role: 'worker', password: 'rasau@40' },
  { id: 'w2', username: 'zulfan', name: 'Zulfan', role: 'worker', password: 'sorek@50' },
  { id: 'a1', username: 'mazkafh', name: 'Admin Mazkafh', role: 'admin', password: 'admin' }
];

export const dbStore = {
  // Mengambil data dari MySQL
  get: async (params?: Record<string, string | undefined>): Promise<Transaction[]> => {
    try {
      const queryString = params 
        ? '?' + new URLSearchParams(params as Record<string, string>).toString() 
        : '';
      
      // ENDPOINT BARU: /list-kas
      const response = await fetch(`${API_BASE_URL}/list-kas${queryString}`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
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
      console.error("MySQL Connection Error:", error);
      return [];
    }
  },
  
  // Simpan Data
  saveOne: async (transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    try {
      const payload = {
        name: transaction.nama_user, 
        type: transaction.type,
        nominal: transaction.nominal,
        kategori: transaction.kategori,
        keterangan: transaction.keterangan,
        notaUrl: transaction.notaUrl || '',
        timestamp: new Date(transaction.timestamp).toISOString().slice(0, 19).replace('T', ' ')
      };

      // ENDPOINT BARU: /tambah-kas
      const response = await fetch(`${API_BASE_URL}/tambah-kas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("MySQL Insert Error:", error);
      return false;
    }
  },

  // Hapus Data
  remove: async (id: string): Promise<boolean> => {
    try {
      // ENDPOINT BARU: /hapus-kas/:id
      const response = await fetch(`${API_BASE_URL}/hapus-kas/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error("MySQL Delete Error:", error);
      return false;
    }
  },

  // Ambil Statistik
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) return { count: 0, income: 0, expense: 0 };
      return await response.json();
    } catch (error) {
      return { count: 0, income: 0, expense: 0 };
    }
  },

  // Login (CLIENT SIDE)
  login: async (username: string, password: string) => {
    // Tidak menggunakan Fetch ke Server
    const user = LOCAL_USERS.find(u => u.username === username && u.password === password);
    if (user) {
        const { password: _, ...userData } = user;
        return userData;
    }
    return null;
  }
};

export const USERS_DB = []; // Fallback kosong