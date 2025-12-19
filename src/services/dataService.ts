import { db } from "../db";
import { ref, get, child, push, remove, set } from "firebase/database";
import { User, Transaction } from "../types";

export const dataService = {
  // 1. SYSTEM LOGIN
  authenticate: (username: string, password: string): User | null => {
    const users = [
      { id: '1', name: 'Wirdan', username: 'wirdan', password: 'rasau@40', role: 'worker' },
      { id: '2', name: 'Zulfan', username: 'zulfan', password: 'sorek@50', role: 'worker' },
      { id: 'admin', name: 'Admin Mazkafh', username: 'mazkafh', password: 'Azkanibang', role: 'admin' }
    ];
    
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (found) {
      const { password: _, ...userWithoutPassword } = found;
      return userWithoutPassword as User;
    }
    return null;
  },

  // 2. UPLOAD GAMBAR KE CLOUDINARY
  uploadImage: async (file: File) => {
    const cloudName = 'dzppwl4q5'; 
    const uploadPreset = 'kas_upload'; 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset); 

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url;
    } catch (err) {
      console.error("Gagal koneksi ke Cloudinary:", err);
      throw err;
    }
  },

  // 3. SIMPAN TRANSAKSI KE FIREBASE
addTransaction: async (data: Omit<Transaction, 'id'>) => {
  // Menunjuk ke lokasi 'transactions' di Database lo
  const transactionsRef = ref(db, 'transactions'); 
  
  // push() membuat "ID Unik" otomatis agar data tidak saling tumpang tindih
  const newRef = push(transactionsRef); 
  
  // set() memasukkan data ke dalam ID Unik tersebut
  return set(newRef, {
    ...data,
    name: data.name || 'Anonymous' 
  });
},

  // 4. AMBIL DATA DARI FIREBASE (FIXED: Tombol Cari Sekarang Jalan)
  getTransactions: async (filters: any) => {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'transactions'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      let list = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        name: data[key].name || data[key].nama_user || 'User'
      }));

      // A. Jika filter "Semua" di klik
      if (filters.all) return list.sort((a, b) => b.timestamp - a.timestamp);

      // B. Filter berdasarkan User ID (untuk worker)
      if (filters.uid && filters.uid !== 'admin') {
        list = list.filter(item => item.uid === filters.uid);
      }
      
      // C. Filter berdasarkan Hari (YYYY-MM-DD)
      if (filters.date) {
        list = list.filter(item => {
           const d = new Date(item.timestamp);
           const formatted = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
           return formatted === filters.date;
        });
      }

      // D. FILTER BULAN & TAHUN (Ini yang bikin tombol Cari Admin Jalan!)
      if (filters.month && filters.year) {
        list = list.filter(item => {
          const d = new Date(item.timestamp);
          const m = (d.getMonth() + 1).toString();
          const y = d.getFullYear().toString();
          return m === filters.month && y === filters.year;
        });
      }

      // E. Filter Tahun saja
      if (filters.year && !filters.month) {
        list = list.filter(item => {
          const d = new Date(item.timestamp);
          return d.getFullYear().toString() === filters.year;
        });
      }
      
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  },

  // 5. HAPUS DATA PERMANEN (FIXED: Pastikan penulisan rapi dalam object)
  deleteExpense: async (id: string) => {
    const itemRef = ref(db, `transactions/${id}`);
    return remove(itemRef);
  }
};