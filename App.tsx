import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from './types';
import { dataService } from './services/dataService';
import Layout from './components/Layout';
import ExpenseForm from './components/ExpenseForm';
import AdminDashboard from './components/AdminDashboard';
import { LogIn, Key, User as UserIcon, ShieldAlert, History, Trash2, Calendar, RefreshCcw, Cloud, WifiOff, CheckCircle2, Wallet } from 'lucide-react';

const App: React.FC = () => {
  // Inisialisasi state user dari localStorage jika ada
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kas_mazkafh_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [workerBalance, setWorkerBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setIsLoading(true);
    setIsSyncing(true);
    
    try {
      if (user.role === 'admin') {
        const data = await dataService.getTransactions(adminFilters);
        setExpenses(data);
      } else {
        // Untuk Worker:
        // 1. Ambil data harian untuk list
        const formattedDate = `${workYear}-${workMonth.padStart(2, '0')}-${workDay.padStart(2, '0')}`;
        const dailyData = await dataService.getTransactions({ uid: user.id, date: formattedDate });
        setExpenses(dailyData);

        // 2. Ambil seluruh data user untuk hitung sisa saldo (Worker Balance)
        const allUserData = await dataService.getTransactions({ uid: user.id, all: true });
        const balance = allUserData.reduce((sum, e) => sum + (e.type === 'income' ? e.nominal : -e.nominal), 0);
        setWorkerBalance(balance);
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Gagal refresh data", e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [user, workDay, workMonth, workYear, adminFilters]);

  useEffect(() => {
    if (user) {
      refreshData();
      if (isOnline) {
        const interval = setInterval(() => refreshData(false), 30000);
        return () => clearInterval(interval);
      }
    }
  }, [user, workDay, workMonth, workYear, adminFilters, refreshData, isOnline]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      // Login is now Client-Side, no fetch involved here
      const authenticatedUser = await dataService.authenticate(username, password);
      if (authenticatedUser) {
        // Simpan ke state dan localStorage
        setUser(authenticatedUser);
        localStorage.setItem('kas_mazkafh_user', JSON.stringify(authenticatedUser));
      } else {
        setLoginError('ID atau Password salah.');
      }
    } catch (err) {
      // Should not happen with local login, but safe to handle
      setLoginError('Terjadi kesalahan pada aplikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kas_mazkafh_user');
    setUsername('');
    setPassword('');
    setExpenses([]);
    setWorkerBalance(0);
  };

  const handleDeleteTransaction = async (id: string, timestamp: number) => {
    if (user?.role === 'worker') {
      const expDate = new Date(timestamp);
      if (expDate.toDateString() !== new Date().toDateString()) {
        alert('Keamanan: Hanya bisa menghapus input hari ini.');
        return;
      }
    }
    
    if (window.confirm('Hapus permanen dari Database MySQL?')) {
      await dataService.deleteExpense(id);
      await refreshData(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
          <div className="bg-blue-600 p-12 text-white text-center rounded-b-[4rem] shadow-lg">
            <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20">
              <ShieldAlert size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-1">Kas MySQL</h1>
            <p className="text-blue-100 text-[9px] font-black uppercase tracking-[0.4em] opacity-80">Connected to Central DB</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {!isOnline && (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-amber-100 flex items-center gap-3">
                <WifiOff size={16} /> Mode Offline Aktif
              </div>
            )}
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm"
                  required
                />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm"
                  required
                />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-gray-400"
            >
              {isLoading ? 'Menghubungkan...' : 'Login Sistem'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      isOnline={isOnline}
      title={user.role === 'admin' ? 'Master Admin' : 'Input Kas'}
    >
      {/* Toast Sync Status */}
      <div className="fixed top-24 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {isSyncing && (
          <div className="bg-white/90 backdrop-blur-md border border-blue-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <RefreshCcw size={12} className="text-blue-500 animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">MySQL Syncing...</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-100 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Requesting MySQL...</p>
        </div>
      ) : user.role === 'worker' ? (
        <div className="space-y-8 pb-12">
          {/* Worker Balance Card */}
          <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl transition-all duration-500 relative overflow-hidden ${workerBalance < 0 ? 'bg-gradient-to-br from-red-600 to-rose-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet size={100} />
            </div>
            <div className="relative z-10">
              <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Sisa Saldo Anda</span>
              <div className="text-4xl font-black tracking-tighter mt-1 mb-2">{formatCurrency(workerBalance)}</div>
              <div className="text-[9px] font-black uppercase tracking-widest bg-white/20 inline-block px-3 py-1 rounded-full border border-white/10">
                Terhubung ke Database ✓
              </div>
            </div>
          </div>

          <ExpenseForm user={user} onSuccess={() => refreshData(false)} />
          
          <div className="space-y-6">
             <div className="flex flex-col gap-5 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-widest border-b border-gray-50 pb-4">
                  <History size={16} className="text-blue-600" /> Histori MySQL
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <select value={workDay} onChange={(e) => setWorkDay(e.target.value)} className="p-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black outline-none focus:bg-white focus:border-blue-100 text-center">
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} className="p-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black outline-none focus:bg-white focus:border-blue-100 text-center">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('id', {month: 'short'})}</option>)}
                  </select>
                  <select value={workYear} onChange={(e) => setWorkYear(e.target.value)} className="p-3 bg-gray-50 border border-transparent rounded-xl text-xs font-black outline-none focus:bg-white focus:border-blue-100 text-center">
                    {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">Tidak ada transaksi di tanggal ini</p>
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm flex justify-between items-center group transition-all hover:shadow-md active:scale-98">
                      <div className="space-y-2 flex-1">
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                          exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {exp.kategori}
                        </span>
                        <div className="text-sm font-black text-gray-900 leading-tight pr-4">
                          {exp.keterangan || 'No Note'}
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className={`font-black text-base tracking-tighter ${exp.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                        </div>
                        <button 
                          onClick={() => handleDeleteTransaction(exp.id, exp.timestamp)}
                          className="p-3 text-gray-200 hover:text-red-500 bg-gray-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>
        </div>
      ) : (
        <AdminDashboard 
          expenses={expenses} 
          onFilterChange={(f) => setAdminFilters(f)} 
          onDelete={async (id) => {
             await dataService.deleteExpense(id);
             await refreshData(false);
          }}
        />
      )}
    </Layout>
  );
};

export default App;