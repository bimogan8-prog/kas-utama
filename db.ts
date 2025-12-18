
import { Transaction, User } from './types';

export const USERS_DB = [
  { id: 'w1', username: 'wirdan', name: 'Wirdan', role: 'worker', password: 'rasau@40' },
  { id: 'w2', username: 'zulfan', name: 'Zulfan', role: 'worker', password: 'Sorek@50' },
  { id: 'a1', username: 'Mazkafh', name: 'Admin Mazkafh', role: 'admin', password: 'Azkanibang' }
] as const;

const DB_STORAGE_KEY = 'expense_tracker_pro_v1';

// MOCK CLOUD CONFIG (Ganti URL ini dengan API nyata jika sudah punya)
const CLOUD_API_URL = ''; 

export const dbStore = {
  get: async (): Promise<Transaction[]> => {
    // 1. Ambil dari lokal dulu (agar cepat)
    const localData = localStorage.getItem(DB_STORAGE_KEY);
    let transactions: Transaction[] = [];
    
    if (localData) {
      try {
        transactions = JSON.parse(localData);
      } catch (e) {
        console.error("Gagal parse data lokal", e);
      }
    }

    // 2. Jika ada API URL, coba ambil data terbaru dari internet
    if (CLOUD_API_URL) {
      try {
        const response = await fetch(CLOUD_API_URL);
        const cloudData = await response.json();
        if (Array.isArray(cloudData)) {
          // Merge data (Logika sederhana: data cloud lebih dipercaya)
          transactions = cloudData;
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(transactions));
        }
      } catch (e) {
        console.warn("Mode Offline: Gagal mengambil data dari cloud.");
      }
    }
    
    return transactions;
  },
  
  save: async (data: Transaction[]) => {
    // Simpan lokal dulu
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
    
    // Kirim ke Cloud jika ada API
    if (CLOUD_API_URL) {
      try {
        await fetch(CLOUD_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        console.log("Data berhasil disinkronkan ke Cloud.");
      } catch (e) {
        console.error("Gagal sinkron cloud, data tersimpan secara lokal.");
      }
    }
  },

  exportBackup: () => {
    const data = localStorage.getItem(DB_STORAGE_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_kas_full_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        await dbStore.save(parsed);
        return true;
      }
    } catch (e) {}
    return false;
  }
};
