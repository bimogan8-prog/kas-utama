import React, { useState, useEffect } from 'react';
import { User, Transaction } from './types';
import { dataService } from './services/dataService';
import Layout from './components/Layout';
import ExpenseForm from './components/ExpenseForm';
import AdminDashboard from './components/AdminDashboard';
import { 
  ShieldAlert, History, 
  Trash2, RefreshCcw, Cloud
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kas_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const now = new Date();
  const [workDay, setWorkDay] = useState(now.getDate().toString());
  const [workMonth, setWorkMonth] = useState((now.getMonth() + 1).toString());
  const [workYear, setWorkYear] = useState("2025");

  // LISTENER REAL-TIME (PENGGANTI REFRESH DATA MANUAL)
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    // Menggunakan subscribeTransactions agar data update otomatis tanpa refresh
    const unsubscribe = dataService.subscribeTransactions((data) => {
      let filtered = [...data];

      // Filter untuk Worker (Hanya lihat data sendiri & per hari)
      if (user.role === 'worker') {
        const formattedDate = `${workYear}-${workMonth.padStart(2, '0')}-${workDay.padStart(2, '0')}`;
        filtered = data.filter(item => 
          item.uid === user.id && item.tanggal === formattedDate
        );
      }
      
      setExpenses(filtered);
      setIsLoading(false);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user, workDay, workMonth, workYear]);

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

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(val);

  // VIEW: LOGIN
  if (!user) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gray-900 p-10 text-white text-center rounded-b-[3rem]">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Kas RASI</h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Cloud System 2025</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-4">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-6 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-6 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500" required />
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{loginError}</p>}
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Layout user={user} onLogout={handleLogout} title={user.role === 'admin' ? 'Cloud Control' : 'Laporan Kas'}>
        
        <div className="flex items-center justify-between px-2 mb-4 mt-6">
          <div className="flex items-center gap-2">
             <Cloud size={14} className={isSyncing ? "text-blue-500 animate-pulse" : "text-green-500"} />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
               {isSyncing ? "Syncing..." : "Cloud Connected"}
             </span>
          </div>
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <RefreshCcw size={14} className={`text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Loading Data...</span>
          </div>
        ) : user.role === 'worker' ? (
          <div className="space-y-6 px-1">
            <ExpenseForm user={user} onSuccess={() => {}} />
            
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase px-1 tracking-widest">
                <History size={14} className="text-blue-600" /> Histori Transaksi
              </h3>
              
              <div className="flex gap-2">
                <select value={workDay} onChange={(e) => setWorkDay(e.target.value)} className="flex-[0.5] p-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black outline-none shadow-sm">
                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={workMonth} onChange={(e) => setWorkMonth(e.target.value)} className="flex-1 p-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black outline-none shadow-sm">
                  {[
                    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
                    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
                    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
                    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
                  ].map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-10 bg-gray-100 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Belum ada data di tanggal ini</p>
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div key={exp.id} className="bg-white rounded-[1.8rem] p-5 border border-gray-50 shadow-sm flex justify-between items-center animate-in fade-in duration-300">
                      <div className="flex-1">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {exp.kategori}
                        </span>
                        <div className="text-[12px] font-bold text-gray-800 leading-tight mt-1 uppercase">{exp.keterangan || 'Tanpa Keterangan'}</div>
                      </div>

                      <div className="flex items-center gap-4 ml-4">
                        <div className={`font-black text-sm ${exp.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                        </div>
                        <button 
                          onClick={async () => { 
                            if(window.confirm('Hapus transaksi ini?')) {
                              await dataService.deleteTransaction(exp.id);
                            }
                          }}
                          className="p-2 text-gray-200 hover:text-red-500 transition-colors"
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
            onFilterChange={() => {}} // Filter ditangani internal di Dashboard via useMemo
            onDelete={async (id) => { 
              if(window.confirm('Hapus data selamanya?')) await dataService.deleteTransaction(id); 
            }}
          />
        )}
      </Layout>
    </div>
  );
};

export default App;