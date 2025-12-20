import { Transaction, User } from '../types/types';

/**
 * CONFIGURASI SERVER UTAMA
 * Pastikan ini mengarah ke IP VPS Anda
 */
const API_BASE_URL = 'http://103.185.52.16:3000';

export const dataService = {
  // 1. Authenticate (Login)
  authenticate: async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Auth Error:", error);
      return null;
    }
  },

  // 2. Get Transactions (Fetch & Map)
  getTransactions: async (filters: { uid?: string; date?: string; month?: string; year?: string; all?: boolean }): Promise<Transaction[]> => {
    try {
      // Construct Query Params
      const params = new URLSearchParams();
      if (filters.uid) params.append('uid', filters.uid);
      if (filters.date) params.append('date', filters.date);
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.all) params.append('all', 'true');

      const response = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const rawData = await response.json();

      // MAPPING DATA: MySQL -> React App
      return rawData.map((item: any) => ({
        id: item.id.toString(),
        uid: item.uid || 'unknown',
        // Map kolom DB 'name' ke Frontend prop 'nama_user'
        nama_user: item.name || item.nama_user || 'Unknown', 
        type: item.type,
        // Pastikan nominal adalah Angka (bukan string)
        nominal: Number(item.nominal), 
        kategori: item.kategori,
        keterangan: item.keterangan,
        notaUrl: item.notaUrl || '',
        // PENTING: Konversi string timestamp MySQL ke Number (Milliseconds)
        timestamp: new Date(item.timestamp).getTime(),
        isSynced: true
      }));

    } catch (error) {
      console.error("Fetch Data Error:", error);
      return [];
    }
  },

  // 3. Add Transaction
  addTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<boolean> => {
    try {
      // Map Frontend object -> MySQL Payload
      const payload = {
        name: transaction.nama_user, // Field DB adalah 'name'
        type: transaction.type,
        nominal: transaction.nominal,
        kategori: transaction.kategori,
        keterangan: transaction.keterangan,
        notaUrl: transaction.notaUrl || '',
        // Format date ke string yang aman untuk MySQL
        timestamp: new Date(transaction.timestamp).toISOString().slice(0, 19).replace('T', ' ')
      };

      const response = await fetch(`${API_BASE_URL}/transactions`, {
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

  // 4. Delete Transaction
  deleteExpense: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error("Delete Error:", error);
      return false;
    }
  },

  // 5. Get Master Stats
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