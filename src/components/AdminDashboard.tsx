import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Database, ShieldCheck, Image as ImageIcon, FileSpreadsheet, X } from 'lucide-react';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface AdminDashboardProps {
  expenses: Transaction[];
  onDelete: (id: string) => void;
  onFilterChange: (filters: { date?: string; month?: string; year?: string; all?: boolean }) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ expenses, onDelete, onFilterChange }) => {
  const now = new Date();
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterType, setFilterType] = useState<'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'all' | 'wirdan' | 'zulfan'>('all');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState("2025");

  const ADMIN_PIN = "2952";

  // Android Keyboard Detection
  useEffect(() => {
    const handleAndroidResize = () => {
      const isKeyboard = window.innerHeight < document.documentElement.clientHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
    };

    window.addEventListener('resize', handleAndroidResize);
    window.addEventListener('orientationchange', handleAndroidResize);
    handleAndroidResize();

    return () => {
      window.removeEventListener('resize', handleAndroidResize);
      window.removeEventListener('orientationchange', handleAndroidResize);
    };
  }, []);

  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // LOGIKA FILTER (Client-side useMemo)
  const filteredData = useMemo(() => {
    let data = [...expenses];
    
    // 1. Filter Berdasarkan User (Tab)
    if (activeTab !== 'all') {
      data = data.filter(e => (e.nama || '').toLowerCase() === activeTab.toLowerCase());
    }
    
    // 2. Filter Berdasarkan Waktu
    if (filterType === 'month') {
      data = data.filter(e => {
        const d = new Date(e.tanggal);
        return (d.getMonth() + 1).toString() === selMonth && d.getFullYear().toString() === selYear;
      });
    } else if (filterType === 'year') {
      data = data.filter(e => new Date(e.tanggal).getFullYear().toString() === selYear);
    }

    // 3. Filter Berdasarkan Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      data = data.filter(e => 
        (e.keterangan || '').toLowerCase().includes(term) || 
        (e.kategori || '').toLowerCase().includes(term) ||
        (e.nama || '').toLowerCase().includes(term)
      );
    }

    return data.sort((a, b) => b.timestamp - a.timestamp); 
  }, [expenses, activeTab, searchTerm, filterType, selMonth, selYear]);

  // LOGIKA EXCEL EXPORT
  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export");
    try {
      const sortedData = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);
      const finalRows = sortedData.map(t => ({
        'Tanggal': new Date(t.tanggal).toLocaleDateString('id-ID'),
        'Nama': t.nama,
        'Tipe': t.type === 'income' ? 'Masuk' : 'Keluar',
        'Kategori': t.kategori,
        'Keterangan': t.keterangan,
        'Nominal': t.nominal,
        'Link Nota': t.notaUrl || 'Tidak Ada'
      }));

      const ws = XLSX.utils.json_to_sheet(finalRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(dataBlob, `Laporan_RASI_${activeTab}_${selMonth}_${selYear}.xlsx`);
    } catch (error) {
      alert("Gagal export file.");
    }
  };

  const currentTotalIncome = filteredData.filter(e => e.type === 'income').reduce((sum, e) => sum + e.nominal, 0);
  const currentTotalExpense = filteredData.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0);
  const netBalance = currentTotalIncome - currentTotalExpense;

  return (
    <div ref={containerRef} className={`space-y-6 transition-all duration-300 ${isKeyboardVisible ? 'pb-12' : 'pb-24'}`}>
      {/* STATS KECIL - Android Optimized */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-[2rem] p-4 border border-amber-100 flex flex-col items-center text-center min-h-[80px] touch-manipulation">
           <Database size={16} className="text-amber-600 mb-1" />
           <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest">Total Data</span>
           <span className="text-sm font-black text-amber-900">{filteredData.length} Baris</span>
        </div>
        <div className="bg-indigo-50 rounded-[2rem] p-4 border border-indigo-100 flex flex-col items-center text-center min-h-[80px] touch-manipulation">
           <ShieldCheck size={16} className="text-indigo-600 mb-1" />
           <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest">Firebase</span>
           <span className="text-sm font-black text-indigo-900 uppercase">Online</span>
        </div>
      </div>

      {/* SALDO UTAMA - Android Optimized */}
      <div className={`rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${
        isKeyboardVisible ? 'p-4 mx-2' : 'p-8'
      } ${
        netBalance < 0 ? 'bg-gradient-to-br from-red-600 to-rose-700' : 
        activeTab === 'zulfan' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
        activeTab === 'wirdan' ? 'bg-gradient-to-br from-purple-600 to-violet-700' :
        'bg-gradient-to-br from-blue-600 to-indigo-700'
      }`}>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <span className={`text-white/70 font-black uppercase tracking-[0.2em] ${isKeyboardVisible ? 'text-[8px]' : 'text-[10px]'}`}>
              Sisa Saldo {activeTab === 'all' ? 'Gabungan' : activeTab === 'zulfan' ? 'Zulfan' : activeTab === 'wirdan' ? 'Wirdan' : activeTab}
            </span>
            <div className={`font-black tracking-tighter mb-1 ${isKeyboardVisible ? 'text-2xl' : 'text-4xl'}`}>{formatCurrency(netBalance)}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`font-bold bg-black/20 w-fit px-2 py-1 rounded-lg ${isKeyboardVisible ? 'text-[7px]' : 'text-[9px]'}`}>CLOUD SYNCED</div>
              {activeTab !== 'all' && (
                <div className={`font-bold bg-white/20 w-fit px-2 py-1 rounded-lg ${isKeyboardVisible ? 'text-[7px]' : 'text-[9px]'}`}>
                  {activeTab === 'zulfan' ? '👤 ZULFAN' : activeTab === 'wirdan' ? '👤 WIRDAN' : '👥 SEMUA'}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={exportToExcel} 
            className="bg-white/20 hover:bg-white/40 p-4 rounded-[1.5rem] border border-white/20 active:scale-90 transition-all flex flex-col items-center gap-1 touch-manipulation min-w-[56px] min-h-[56px]"
          >
            <FileSpreadsheet size={24} />
            <span className="text-[8px] font-black uppercase">Excel</span>
          </button>
        </div>
      </div>

      {/* RINGKASAN MASUK KELUAR */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><ArrowUpCircle size={20}/></div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Masuk</p>
              <p className="text-sm font-black text-green-600">{formatCurrency(currentTotalIncome)}</p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ArrowDownCircle size={20}/></div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Keluar</p>
              <p className="text-sm font-black text-red-600">{formatCurrency(currentTotalExpense)}</p>
            </div>
          </div>
        </div>

        {/* KOMPONEN SALDO TERPISAH UNTUK ADMIN */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-5 border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xs font-black">Z</div>
                <div>
                  <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Saldo Zulfan</p>
                  <p className="text-xs font-black text-emerald-800">
                    {(() => {
                      const zulfanData = expenses.filter(e => (e.nama || '').toLowerCase() === 'zulfan');
                      const zulfanIncome = zulfanData.filter(e => e.type === 'income').reduce((sum, e) => sum + e.nominal, 0);
                      const zulfanExpense = zulfanData.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0);
                      return formatCurrency(zulfanIncome - zulfanExpense);
                    })()}
                  </p>
                </div>
              </div>
              <div className="text-[7px] text-emerald-600 font-bold">
                Masuk: {formatCurrency(expenses.filter(e => (e.nama || '').toLowerCase() === 'zulfan' && e.type === 'income').reduce((sum, e) => sum + e.nominal, 0))} | 
                Keluar: {formatCurrency(expenses.filter(e => (e.nama || '').toLowerCase() === 'zulfan' && e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-[2rem] p-5 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-xs font-black">W</div>
                <div>
                  <p className="text-[8px] font-black text-purple-700 uppercase tracking-widest">Saldo Wirdan</p>
                  <p className="text-xs font-black text-purple-800">
                    {(() => {
                      const wirdanData = expenses.filter(e => (e.nama || '').toLowerCase() === 'wirdan');
                      const wirdanIncome = wirdanData.filter(e => e.type === 'income').reduce((sum, e) => sum + e.nominal, 0);
                      const wirdanExpense = wirdanData.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0);
                      return formatCurrency(wirdanIncome - wirdanExpense);
                    })()}
                  </p>
                </div>
              </div>
              <div className="text-[7px] text-purple-600 font-bold">
                Masuk: {formatCurrency(expenses.filter(e => (e.nama || '').toLowerCase() === 'wirdan' && e.type === 'income').reduce((sum, e) => sum + e.nominal, 0))} | 
                Keluar: {formatCurrency(expenses.filter(e => (e.nama || '').toLowerCase() === 'wirdan' && e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABS USER & FILTER - Android Optimized */}
      <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-50 space-y-5 ${isKeyboardVisible ? 'p-4 mx-2' : 'p-6'}`}>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['all', 'wirdan', 'zulfan'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-4 text-[9px] font-black uppercase rounded-xl transition-all min-h-[44px] touch-manipulation ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
              }`}
            >
              {tab === 'all' ? 'Gabungan' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className={`font-black uppercase tracking-widest text-gray-400 ${isKeyboardVisible ? 'text-[9px]' : 'text-[10px]'}`}>Periode Laporan</h3>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            {(['month', 'year', 'all'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setFilterType(t)} 
                className={`px-3 py-2 text-[7px] font-black uppercase rounded-md transition-all min-h-[36px] touch-manipulation ${
                  filterType === t ? 'bg-blue-600 text-white' : 'text-gray-400'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'month' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {filterType === 'month' && (
            <select 
              value={selMonth} 
              onChange={(e) => setSelMonth(e.target.value)} 
              className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none min-h-[44px] touch-manipulation"
            >
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
          )}
          {filterType !== 'all' && (
            <select 
              value={selYear} 
              onChange={(e) => setSelYear(e.target.value)} 
              className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none min-h-[44px] touch-manipulation"
            >
              {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* DAFTAR TRANSAKSI - Android Optimized */}
      <div className={`space-y-3 ${isKeyboardVisible ? 'px-1' : 'px-1'}`}>
        <div className="flex items-center justify-between mb-2 px-2">
           <h3 className={`font-black text-gray-800 uppercase flex items-center gap-2 tracking-[0.2em] opacity-50 ${isKeyboardVisible ? 'text-[9px]' : 'text-[10px]'}`}>
            <Clock size={14} /> Riwayat Transaksi
          </h3>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Cari keterangan, kategori, atau nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300 min-h-[48px] touch-manipulation"
            style={{
              fontSize: '16px', // Prevent zoom on Android
              zoom: 1
            }}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 p-1 touch-manipulation min-w-[32px] min-h-[32px]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[10px] font-black uppercase tracking-widest">Tidak ada data ditemukan</div>
        ) : (
          filteredData.map((exp) => (
            <div key={exp.id} className="bg-white rounded-[1.8rem] p-5 border border-gray-50 shadow-sm flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{exp.kategori}</span>
                  <span className="text-[8px] text-gray-400 font-bold">{new Date(exp.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="font-bold text-gray-900 text-sm leading-tight mb-2 uppercase">
                  <span className="text-blue-600 font-black mr-1">{exp.nama}:</span>{exp.keterangan || 'Tanpa Keterangan'}
                </div>
                {exp.notaUrl && (
                  <a href={exp.notaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                    <ImageIcon size={10} /> Lihat Struk
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className={`font-black text-sm whitespace-nowrap ${exp.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                  {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}
                </div>
                
                <button 
                  onClick={() => { 
                    const pin = prompt("🔐 Keamanan Admin\nMasukkan PIN untuk menghapus data:");
                    if (pin === ADMIN_PIN) {
                      if(window.confirm('PIN Benar. Hapus data ini selamanya?')) onDelete(exp.id);
                    } else if (pin !== null) {
                      alert("❌ PIN Salah!");
                    }
                  }} 
                  className="p-3 text-gray-200 hover:text-red-500 transition-all active:scale-75 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;