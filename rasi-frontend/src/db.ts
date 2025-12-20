import { Transaction } from './types/types';

/**
 * CONFIGURASI BACKEND MYSQL
 * Mengarah ke IP VPS. 
 * Pastikan backend sudah dijalankan dengan `node server.js`
 */
const API_BASE_URL = 'http://103.185.52.16:3000'; 

export const dbStore = {
  // Mengambil data dari MySQL
  get: async (params?: Record<string, string | undefined>): Promise<Transaction[]> => {
    try {
      const queryString = params 
        ? '?' + new URLSearchParams(params as Record<string, string>).toString() 
        : '';
        
      const response = await fetch(`${API_BASE_URL}/transactions${queryString}`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const rawData = await response.json();

      // MAPPING DATA PENTING:
      // 1. MySQL Timestamp (String ISO) -> Javascript Timestamp (Number ms) agar filter tanggal frontend bekerja.
      // 2. MySQL Column 'name' -> Frontend Prop 'nama_user'.
      return rawData.map((item: any) => ({
        id: item.id.toString(),
        uid: item.uid || 'unknown', // Opsional jika backend tidak kirim uid
        nama_user: item.name || item.nama_user || 'Unknown', 
        type: item.type,
        nominal: Number(item.nominal), // Pastikan jadi number/float
        kategori: item.kategori,
        keterangan: item.keterangan,
        notaUrl: item.notaUrl || '',
        timestamp: new Date(item.timestamp).getTime(), // KUNCI: Konversi ke miliseconds
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
      // Mapping Frontend -> Database Schema
      const payload = {
        name: transaction.nama_user, // Simpan ke kolom 'name'
        type: transaction.type,
        nominal: transaction.nominal,
        kategori: transaction.kategori,
        keterangan: transaction.keterangan,
        notaUrl: transaction.notaUrl || '',
        // Kirim format ISO String untuk MySQL DATETIME
        timestamp: new Date(transaction.timestamp).toISOString().slice(0, 19).replace('T', ' ')
      };

      const response = await fetch(`${API_BASE_URL}/transactions`, {
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
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
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

  // Login
  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) return await response.json();
      return null;
    } catch (error) {
      console.error("Login API Error:", error);
      return null;
    }
  }
};

export const USERS_DB = []; // Fallback kosong