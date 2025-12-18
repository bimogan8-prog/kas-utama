
import React, { useState, useEffect, useCallback } from 'react';
import { User, Transaction } from './types';
import { dataService } from './services/dataService';
import Layout from './components/Layout';
import ExpenseForm from './components/ExpenseForm';
import AdminDashboard from './components/AdminDashboard';
import { LogIn, Key, User as UserIcon, ShieldAlert, History, Trash2, Calendar, RefreshCcw, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
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

  // Auto-sync setiap 30 detik jika aplikasi terbuka
  useEffect(() => {
    if (user) {
      refreshData();
      const interval = setInterval(() => refreshData(false), 30000);
      return () => clearInterval(interval);
    }
  }, [user, workDay, workMonth, workYear, adminFilters, refreshData]);

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
      const isToday = expDate.getFullYear() === today.getFullYear() &&
                      expDate.getMonth() === today.getMonth() &&
                      expDate.getDate() === today.getDate();
      
      if (!isToday) {
        alert('Keamanan: Data lama tidak bisa dihapus oleh Worker.');
        return;
      }
    }
    
    if (window.confirm('Hapus permanen dari database cloud?')) {
      await dataService.deleteExpense(id);
      await refreshData();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-10 text-white text-center rounded-b-[3rem]">
            <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-lg border border-white/10">
              <ShieldAlert size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase">Kas Online</h1>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-80">Cloud Synchronized System</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-3">
                <ShieldAlert size={16} />
                {loginError}
              </div>
            )}
            <div className="space-y-4">
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-blue-500" size={20} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  required
                />
              </div>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-blue-500" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Masuk Sistem Online
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
      title={user.role === 'admin' ? 'Cloud Control' : 'Laporan Kas'}
    >
      {/* Sync Status Indicator */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
           <Cloud size={14} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"} />
           <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
             {isSyncing ? "Sinkronisasi..." : "Data Terkini"}
           </span>
        </div>
        <button 
          onClick={() => refreshData(true)} 
          className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 active:rotate-180 transition-all duration-500"
        >
          <RefreshCcw size={14} className="text-blue-600" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Menghubungkan ke Database...</p>
        </div>
      ) : user.role === 'worker' ? (
        <div className="space-y-8 pb-10">
          <ExpenseForm user={user} onSuccess={() => refreshData(false)} />
          
          <div className="space-y-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-gray-800 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <History size={16} className="text-blue-600" /> Histori {user.name}
                </h3>
              </div>
              
              <div className="flex gap-2">
                <select value={workDay} onChange={(e) => setWorkDay(e.target.value)} className="flex-[0.6] p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none shadow-sm text-center">
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} className="flex-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none shadow-sm text-center">
                  {[
                    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
                    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
                    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
                    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
                  ].map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
                <select value={workYear} onChange={(e) => setWorkYear(e.target.value)} className="flex-1 p-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none shadow-sm text-center">
                  {['2023', '2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                  <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest">Data Kosong</p>
                </div>
              ) : (
                expenses.map((exp) => {
                  const canDelete = new Date(exp.timestamp).toDateString() === new Date().toDateString();

                  return (
                    <div key={exp.id} className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm flex justify-between items-center group transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                            exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {exp.kategori}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 leading-tight">
                          {exp.keterangan || 'Tanpa keterangan'}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase">
                           {new Date(exp.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <div className={`font-black text-sm tracking-tight ${exp.type === 'income' ? 'text-green-600' : 'text-blue-600'}`}>
                            {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                          </div>
                        </div>
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteTransaction(exp.id, exp.timestamp)}
                            className="p-2.5 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {expenses.length > 0 && (
              <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-lg shadow-blue-50/50 flex flex-col gap-1">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Sisa Kas (Net)</span>
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-blue-700">
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.type === 'income' ? e.nominal : -e.nominal), 0))}
                  </span>
                  <div className="text-[8px] font-bold text-gray-400 uppercase">Synced ✓</div>
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
