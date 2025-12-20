import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Filter, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Wallet, Database, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types/types';
import { dataService } from '../services/dataService';

interface AdminDashboardProps {
  expenses: Transaction[];
  onDelete: (id: string) => void;
  onFilterChange: (filters: { date?: string; month?: string; year?: string; all?: boolean }) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ expenses, onDelete, onFilterChange }) => {
  const now = new Date();
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'all' | 'wirdan' | 'zulfan'>('all');
  const [masterStats, setMasterStats] = useState<{ count: number; income: number; expense: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await dataService.getMasterStats();
      setMasterStats(stats);
    };
    loadStats();
  }, [expenses]);
  
  const [selDay, setSelDay] = useState(now.getDate().toString());
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(now.getFullYear().toString());

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];
  const years = ['2023', '2024', '2025', '2026'];

  const handleApplyFilter = (typeOverride?: any) => {
    const type = typeOverride || filterType;
    if (type === 'all') {
      onFilterChange({ all: true });
    } else if (type === 'day') {
      const formattedDate = `${selYear}-${selMonth.padStart(2, '0')}-${selDay.padStart(2, '0')}`;
      onFilterChange({ date: formattedDate });
    } else if (type === 'month') {
      onFilterChange({ month: selMonth, year: selYear });
    } else {
      onFilterChange({ year: selYear });
    }
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama User,Tipe,Kategori,Keterangan,Masuk,Keluar,Nota URL\n";

    const sortedForExport = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);

    sortedForExport.forEach(row => {
      const dateStr = new Date(row.timestamp).toLocaleDateString('id-ID');
      const timeStr = new Date(row.timestamp).toLocaleTimeString('id-ID');
      const cleanKet = (row.keterangan || '').replace(/,/g, " ");
      const masuk = row.type === 'income' ? row.nominal : 0;
      const keluar = row.type === 'expense' ? row.nominal : 0;
      
      csvContent += `${dateStr} ${timeStr},${row.nama_user},${row.type},${row.kategori},${cleanKet},${masuk},${keluar},${row.notaUrl || '-'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_kas_${filterType}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PROTEKSI PIN ADMIN (SECURITY)
  const handleDeleteProtected = (id: string) => {
    const pin = prompt("🔒 KEAMANAN SISTEM\nMasukkan PIN Admin untuk menghapus data:");
    if (pin === "2952") {
      onDelete(id);
    } else if (pin !== null) {
      alert("⛔ PIN SALAH! Akses ditolak.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // LOGIKA FILTER CASE-INSENSITIVE
  const filteredData = useMemo(() => {
    if (activeTab === 'all') return expenses;
    
    // Normalisasi input tab dan data user ke lowercase agar cocok
    // Contoh: 'Wirdan' akan match dengan 'wirdan', 'WIRDAN', 'Wirdan'
    // DataService sudah menjamin 'nama_user' terisi dari DB 'name'
    return expenses.filter(e => {
        const userName = e.nama_user ? e.nama_user.toLowerCase() : '';
        return userName.includes(activeTab.toLowerCase());
    });
  }, [expenses, activeTab]);

  const currentTotalIncome = filteredData.filter(e => e.type === 'income').reduce((sum, e) => sum + e.nominal, 0);
  const currentTotalExpense = filteredData.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0);
  const netBalance = currentTotalIncome - currentTotalExpense;

  return (
    <div className="space-y-6 pb-20">
      {/* MASTER DATABASE INFO CARDS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-[2rem] p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
           <Database size={16} className="text-amber-600 mb-1" />
           <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest">Database MySQL</span>
           <span className="text-sm font-black text-amber-900">{masterStats?.count || 0} Transaksi</span>
        </div>
        <div className="bg-indigo-50 rounded-[2rem] p-4 border border-indigo-100 flex flex-col items-center justify-center text-center">
           <ShieldCheck size={16} className="text-indigo-600 mb-1" />
           <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest">Sistem Status</span>
           <span className="text-sm font-black text-indigo-900 uppercase tracking-tighter">Live & Secure</span>
        </div>
      </div>

      {/* Summary Header */}
      <div className="space-y-4">
        <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl transition-all duration-500 relative overflow-hidden ${netBalance < 0 ? 'bg-gradient-to-br from-red-600 to-rose-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">
                Saldo {activeTab === 'all' ? 'Gabungan' : activeTab.toUpperCase()}
              </span>
              <Wallet size={20} className="text-white/40" />
            </div>
            <div className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(netBalance)}</div>
            <div className="flex items-center justify-between">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                {filterType === 'all' ? 'Database Full' : 'Filter Aktif'} ✓
              </div>
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1 bg-green-500/80 hover:bg-green-500 rounded-full text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg"
              >
                <FileSpreadsheet size={10} /> Excel
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-green-600">
              <ArrowUpCircle size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Masuk</span>
            </div>
            <div className="text-xl font-black text-gray-900">{formatCurrency(currentTotalIncome)}</div>
          </div>
          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <ArrowDownCircle size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Keluar</span>
            </div>
            <div className="text-xl font-black text-gray-900">{formatCurrency(currentTotalExpense)}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Filter size={14} className="text-blue-500" /> Pengaturan Filter
          </h3>
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {(['day', 'month', 'year', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); if(t === 'all') onFilterChange({all: true}); }}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all whitespace-nowrap ${
                  filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
                }`}
              >
                {t === 'day' ? 'Harian' : t === 'month' ? 'Bulanan' : t === 'year' ? 'Tahunan' : 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {filterType !== 'all' && (
          <div className="flex gap-2">
            {filterType === 'day' && (
              <select value={selDay} onChange={(e) => setSelDay(e.target.value)} className="flex-[0.6] p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {(filterType === 'day' || filterType === 'month') && (
              <select value={selMonth} onChange={(e) => setSelMonth(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center">
                {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            )}
            <select value={selYear} onChange={(e) => setSelYear(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-center">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => handleApplyFilter()}
              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 active:scale-90 transition-all"
            >
              <Search size={18} />
            </button>
          </div>
        )}

        {/* Tab User Selection */}
        <div className="flex bg-gray-50 p-1 rounded-[1.5rem] border border-gray-100">
          {(['all', 'wirdan', 'zulfan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all flex items-center justify-center gap-2 ${
                activeTab === tab 
                  ? 'bg-white text-blue-600 shadow-md scale-[1.02] border border-blue-50' 
                  : 'text-gray-400'
              }`}
            >
              {tab === 'all' ? 'Gabungan' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Histori Transaksi
          </h3>
          <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg shadow-sm">{filteredData.length}</span>
        </div>
        
        <div className="space-y-3 px-1">
          {filteredData.length === 0 ? (
            <div className="text-center py-20 text-gray-400 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Belum Ada Data</p>
            </div>
          ) : (
            filteredData.map((exp) => (
              <div key={exp.id} className="bg-white rounded-[1.5rem] p-5 border border-gray-50 shadow-sm flex justify-between items-center transition-all hover:border-blue-200">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                      exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {exp.kategori}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold">{new Date(exp.timestamp).toLocaleDateString('id-ID')}</span>
                    {exp.notaUrl && (
                      <a href={exp.notaUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md hover:bg-blue-200">
                        Nota ↗
                      </a>
                    )}
                  </div>
                  <div className="font-bold text-gray-900 text-sm leading-tight">
                    <span className="text-blue-500 font-black">{exp.nama_user}:</span> {exp.keterangan || 'Tanpa keterangan'}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className={`font-black text-sm tracking-tighter ${exp.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                      {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProtected(exp.id)} className="p-2.5 text-gray-200 hover:text-red-500 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;