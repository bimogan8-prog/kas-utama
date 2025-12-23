import { db } from '../firebaseConfig';
import { 
  ref, 
  push, 
  set, 
  remove, 
  onValue, 
  query, 
  orderByChild,
  off 
} from 'firebase/database';
import { User, Transaction } from "../types";
import { Unsubscribe } from 'firebase/database';

const dbPath = "transaksi";

export const dataService = {
  /**
   * 1. SISTEM AUTHENTICATION (LOKAL)
   * Memvalidasi user berdasarkan daftar kredensial yang ditentukan.
   */
  authenticate: (username: string, password: string): User | null => {
    const users = [
      { id: '1', name: 'Wirdan', username: 'wirdan', password: 'rasau@40', role: 'worker' as const },
      { id: '2', name: 'Zulfan', username: 'zulfan', password: 'sorek@50', role: 'worker' as const },
      { id: 'admin', name: 'Admin Mazkafh', username: 'mazkafh', password: 'Azkanibang', role: 'admin' as const }
    ];
    
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (found) {
      // Mengembalikan data user tanpa menyertakan password demi keamanan
      const { password: _, ...userWithoutPassword } = found;
      return userWithoutPassword as User;
    }
    return null;
  },

  /**
   * 2. REAL-TIME DATA LISTENER
   * Berlangganan ke database untuk mendapatkan pembaruan setiap kali ada perubahan data.
   */
  subscribeTransactions: (callback: (data: Transaction[]) => void): Unsubscribe => {
    const transactionsRef = query(ref(db, dbPath), orderByChild('timestamp'));
    
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      const data: Transaction[] = [];
      
      if (snapshot.exists()) {
        const snapData = snapshot.val();
        Object.keys(snapData).forEach((key) => {
          const val = snapData[key];
          
          data.push({
            id: key,
            uid: val.uid || "",
            nama: val.nama || "",
            type: val.type || "expense",
            nominal: Number(val.nominal) || 0,
            kategori: val.kategori || "",
            keterangan: val.keterangan || "",
            tanggal: val.tanggal || "",
            timestamp: val.timestamp || Date.now()
          });
        });
      }
      
      callback(data.reverse());
    });
    
    return unsubscribe;
  },

  /**
   * 3. TAMBAH TRANSAKSI BARU
   * Menyimpan data input kas ke Realtime Database.
   */
  addTransaction: async (data: Omit<Transaction, 'id'>) => {
    try {
      const newListRef = push(ref(db, dbPath));
      return await set(newListRef, {
        uid: data.uid,
        nama: data.nama,
        type: data.type,
        nominal: Number(data.nominal),
        kategori: data.kategori,
        keterangan: data.keterangan,
        tanggal: data.tanggal,
        timestamp: data.timestamp
      });
    } catch (err) {
      console.error("Gagal menambahkan transaksi ke RTDB:", err);
      throw err;
    }
  },

  /**
   * 4. HAPUS TRANSAKSI
   * Menghapus data spesifik berdasarkan ID unik.
   */
  deleteTransaction: async (id: string) => {
    try {
      const targetRef = ref(db, `${dbPath}/${id}`);
      return await remove(targetRef);
    } catch (err) {
      console.error("Gagal menghapus transaksi dari RTDB:", err);
      throw err;
    }
  }
};