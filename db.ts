
import { Transaction, User } from './types';

export const USERS_DB = [
  { id: 'w1', username: 'wirdan', name: 'Wirdan', role: 'worker', password: 'rasau@40' },
  { id: 'w2', username: 'zulfan', name: 'Zulfan', role: 'worker', password: 'Sorek@50' },
  { id: 'a1', username: 'Mazkafh', name: 'Admin Mazkafh', role: 'admin', password: 'Azkanibang' }
] as const;

const DB_STORAGE_KEY = 'kas_mazkafh_v2';

/** 
 * KONFIGURASI FIREBASE ONLINE
 * Ganti URL di bawah dengan URL Firebase Anda untuk mengaktifkan fitur Online penuh.
 */
const FIREBASE_DB_URL = 'https://YOUR_PROJECT_ID.firebasedatabase.app/kas_data.json'; 

export const dbStore = {
  get: async (): Promise<Transaction[]> => {
    // 1. Ambil data lokal dulu (Kecepatan)
    const local = localStorage.getItem(DB_STORAGE_KEY);
    let transactions: Transaction[] = local ? JSON.parse(local) : [];

    // 2. Jika online, tarik data terbaru dari cloud
    if (navigator.onLine && !FIREBASE_DB_URL.includes('YOUR_PROJECT_ID')) {
      try {
        const res = await fetch(FIREBASE_DB_URL);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && Array.isArray(cloudData)) {
            transactions = cloudData;
            // Update cache lokal
            localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(transactions));
          }
        }
      } catch (e) {
        console.warn("Cloud offline, using local data.");
      }
    }
    return transactions;
  },
  
  save: async (data: Transaction[]) => {
    // Selalu simpan di lokal (Keamanan Data)
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
    
    // Kirim ke Cloud jika ada internet
    if (navigator.onLine && !FIREBASE_DB_URL.includes('YOUR_PROJECT_ID')) {
      try {
        await fetch(FIREBASE_DB_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (e) {
        console.error("Gagal sinkron ke Cloud.");
      }
    }
  },

  exportBackup: () => {
    const data = localStorage.getItem(DB_STORAGE_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_kas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importBackup: async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        await dbStore.save(parsed);
        return true;
      }
    } catch (e) {
      console.error("Import Gagal", e);
    }
    return false;
  }
};
