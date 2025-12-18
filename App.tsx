
import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from './types';
import { dataService } from './services/dataService';
import Layout from './components/Layout';
import ExpenseForm from './components/ExpenseForm';
import AdminDashboard from './components/AdminDashboard';
import { LogIn, Key, User as UserIcon, ShieldAlert, History, Trash2, Calendar, RefreshCcw, Cloud, WifiOff, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
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
      let data: Transaction[] = [];
      if (user.role === 'admin') {
        data = await dataService.getTransactions(adminFilters);
      } else {
        const formattedDate = `${workYear}-${workMonth.padStart(2, '0')}-${workDay.padStart(2, '0')}`;
        data = await dataService.getTransactions({ uid: user.id, date: formattedDate });
      }
      setExpenses(data);
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const authenticatedUser = dataService.authenticate(username, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
    } else {
      setLoginError('ID atau Password salah.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setExpenses([]);
  };

  const handleDeleteTransaction = async (id: string, timestamp: number) => {
    if (user?.role === 'worker') {
      const expDate = new Date(timestamp);
      const today = new Date();
      if (expDate.toDateString() !== today.toDateString()) {
        alert('Keamanan: Hanya bisa menghapus input hari ini.');
        return;
      }
    }
    
    if (window.confirm('Hapus dari Cloud Server?')) {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
          <div className="bg-blue-600 p-12 text-white text-center rounded-b-[4rem] shadow-lg">
            <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20">
              <ShieldAlert size={48} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-1">Kas Cloud</h1>
            <p className="text-blue-100 text-[9px] font-black uppercase tracking-[0.4em] opacity-80">Online Tracking System</p>
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
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all"
            >
              Login Sistem
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
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Syncing Cloud...</span>
          </div>
        )}
        {!isSyncing && lastSyncTime && isOnline && (
          <div className="bg-white/90 backdrop-blur-md border border-green-100 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-out fade-out fill-mode-forwards delay-1000">
            <CheckCircle2 size={12} className="text-green-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-green-600">Terhubung & Aman</span>
          </div>
        )}
      </div>

      {!isOnline && (
        <div className="mb-6 bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between border-b-4 border-amber-700 active:scale-95 transition-all">
          <div className="flex items-center gap-3">
            <WifiOff size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Koneksi Hilang!</span>
          </div>
          <span className="text-[8px] font-bold bg-white/20 px-2 py-1 rounded-lg">Simpan Lokal</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-100 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Menghubungkan Server...</p>
        </div>
      ) : user.role === 'worker' ? (
        <div className="space-y-8 pb-12">
          <ExpenseForm user={user} onSuccess={() => refreshData(false)} />
          
          <div className="space-y-6">
            <div className="flex flex-col gap-5 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-widest border-b border-gray-50 pb-4">
                <History size={16} className="text-blue-600" /> Laporan Histori
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
              {expenses.map((exp) => (
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
                    <div className="text-[9px] font-bold text-gray-300 uppercase">
                       {new Date(exp.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
              ))}
            </div>
            
            {expenses.length > 0 && (
              <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                   <History size={120} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Total Kas Terhitung</span>
                <div className="text-3xl font-black mt-2 tracking-tighter">
                  {formatCurrency(expenses.reduce((sum, e) => sum + (e.type === 'income' ? e.nominal : -e.nominal), 0))}
                </div>
              </div>
            )}
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
