import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from './types';
import { dataService } from './services/dataService';
import { db } from './db'; 
import { ref, onValue } from 'firebase/database';
import Layout from './components/Layout';
import ExpenseForm from './components/ExpenseForm';
import AdminDashboard from './components/AdminDashboard';
import { 
  Key, User as UserIcon, ShieldAlert, History, 
  Trash2, RefreshCcw, Cloud 
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const now = new Date();
  const [workDay, setWorkDay] = useState(now.getDate().toString());
  const [workMonth, setWorkMonth] = useState((now.getMonth() + 1).toString());
  const [workYear, setWorkYear] = useState(now.getFullYear().toString());

  const [adminFilters, setAdminFilters] = useState<{ date?: string; month?: string; year?: string; all?: boolean }>({ 
    month: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString()
  });

  const refreshData = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    
    try {
      let data: Transaction[] = [];
      if (user.role === 'admin') {
        data = await dataService.getTransactions(adminFilters);
      } else {
        const formattedDate = `${workYear}-${workMonth.padStart(2, '0')}-${workDay.padStart(2, '0')}`;
        data = await dataService.getTransactions({ uid: user.id, date: formattedDate });
      }
      setExpenses(data);
    } catch (e) {
      console.error("Gagal refresh data", e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [user, workDay, workMonth, workYear, adminFilters]);

  // GANTI useEffect di App.tsx menjadi seperti ini:
useEffect(() => {
  if (!user) return;

  // Jalankan refresh setiap kali adminFilters berubah
  refreshData(false); 

  const transactionsRef = ref(db, 'transactions');
  const unsubscribe = onValue(transactionsRef, () => {
    refreshData(false); 
  });

  return () => unsubscribe();
}, [user, adminFilters, refreshData]); // <--- WAJIB ADA adminFilters DI SINI
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const authenticatedUser = dataService.authenticate(username, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      localStorage.setItem('kas_user', JSON.stringify(authenticatedUser));
    } else {
      setLoginError('ID atau Password salah.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kas_user');
  };

  const handleDeleteTransaction = async (id: string, timestamp: number) => {
    if (user?.role === 'worker') {
      const isToday = new Date(timestamp).toDateString() === new Date().toDateString();
      if (!isToday) {
        alert('Keamanan: Data lama tidak bisa dihapus oleh Worker.');
        return;
      }
    }
    if (window.confirm('Hapus permanen?')) {
      await dataService.deleteExpense(id);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(val);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-10 text-white text-center rounded-b-[3rem]">
            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-white/10">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-black italic uppercase">Kas Online</h1>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Cloud System</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-4">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-6 pr-4 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-6 pr-4 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-bold" required />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} title={user.role === 'admin' ? 'Cloud Control' : 'Laporan Kas'}>
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
           <Cloud size={14} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"} />
           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
             {isSyncing ? "Syncing..." : "Connected"}
           </span>
        </div>
        <button onClick={() => refreshData(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:rotate-180 transition-all duration-500">
          <RefreshCcw size={14} className="text-blue-600" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : user.role === 'worker' ? (
        <div className="space-y-8 pb-10">
          <ExpenseForm user={user} onSuccess={() => {}} />
          <div className="space-y-5">
            <h3 className="font-black text-gray-800 flex items-center gap-2 text-xs uppercase px-1">
              <History size={16} /> Histori {user.name}
            </h3>
            <div className="flex gap-2">
              <select value={workDay} onChange={(e) => setWorkDay(e.target.value)} className="flex-[0.6] p-3 bg-white border rounded-2xl text-xs font-bold">
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} className="flex-1 p-3 bg-white border rounded-2xl text-xs font-bold">
                {[{ val: '11', label: 'November' }, { val: '12', label: 'Desember' }].map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-white rounded-2xl p-5 border shadow-sm flex justify-between items-center transition-all">
                  <div className="flex-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{exp.kategori}</span>
                    <div className="text-sm font-bold text-gray-900 leading-tight mt-1">{exp.keterangan}</div>
                  </div>
                  <div className="font-black text-sm text-right">
                    {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <AdminDashboard 
          expenses={expenses} 
          onFilterChange={(f) => setAdminFilters(prev => ({...prev, ...f}))} 
          onDelete={async (id) => { await dataService.deleteExpense(id); }}
        />
      )}
    </Layout>
  );
};

export default App;