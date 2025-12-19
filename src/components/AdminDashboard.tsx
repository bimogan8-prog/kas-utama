import React, { useState, useMemo } from 'react';
import { Clock, Trash2, Search, ArrowUpCircle, ArrowDownCircle, Database, ShieldCheck, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  expenses: Transaction[];
  onDelete: (id: string) => void;
  onFilterChange: (filters: { date?: string; month?: string; year?: string; all?: boolean }) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ expenses, onDelete, onFilterChange }) => {
  const now = new Date();
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'all' | 'wirdan' | 'zulfan'>('all');
  
  // State ini yang menjaga agar dropdown tidak reset saat pindah tab
  const [selDay, setSelDay] = useState(now.getDate().toString());
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(now.getFullYear().toString());

  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];

  const exportToExcel = () => {
    // 1. Urutkan data dari tanggal TERKECIL ke TERBESAR untuk laporan yang benar
    const sortedData = [...filteredData].sort((a, b) => a.timestamp - b.timestamp);

    const grouped = sortedData.reduce((acc: any, curr) => {
      const dateStr = new Date(curr.timestamp).toLocaleDateString('id-ID');
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(curr);
      return acc;
    }, {});

    const finalRows: any[] = [];

    Object.keys(grouped).forEach((date) => {
      const dayTransactions = grouped[date];
      const incomes = dayTransactions.filter((t: any) => t.type === 'income');
      const outgoes = dayTransactions.filter((t: any) => t.type === 'expense');
      
      let dayRunningTotal = 0;

      // Baris pertama tiap hari
      const firstIncome = incomes[0];
      const row1 = {
        'Tgl': date,
        'Keterangan / Jenis Pengeluaran': firstIncome ? 'Kas Masuk' : (outgoes[0]?.keterangan || outgoes[0]?.kategori || '-'),
        'Masuk': firstIncome ? firstIncome.nominal : 0,
        'Keluar': firstIncome ? 0 : (outgoes[0]?.nominal || 0),
        'Saldo Harian': 0, 
        'User': dayTransactions[0].name,
        'Nota': dayTransactions[0].notaUrl || ''
      };
      
      finalRows.push(row1);
      dayRunningTotal += (row1.Masuk - row1.Keluar);

      // Baris sisa hari tersebut
      const remaining = [...incomes.slice(1), ...outgoes.slice(firstIncome ? 0 : 1)];
      remaining.forEach((t) => {
        const amtIn = t.type === 'income' ? t.nominal : 0;
        const amtOut = t.type === 'expense' ? t.nominal : 0;
        dayRunningTotal += (amtIn - amtOut);
        
        finalRows.push({
          'Tgl': '', 
          'Keterangan / Jenis Pengeluaran': t.keterangan || t.kategori,
          'Masuk': amtIn,
          'Keluar': amtOut,
          'Saldo Harian': '',
          'User': t.name,
          'Nota': t.notaUrl || ''
        });
      });

      finalRows[finalRows.length - 1]['Saldo Harian'] = dayRunningTotal;
    });

    const ws = XLSX.utils.json_to_sheet(finalRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_${activeTab}_${selMonth}_${selYear}.xlsx`);
  };

  const handleApplyFilter = (e?: React.MouseEvent | React.FormEvent) => {
  if (e) {
    if ('preventDefault' in e) e.preventDefault();
  }

  // Reset filter lain saat memilih salah satu tipe
  if (filterType === 'all') {
    onFilterChange({ all: true, month: undefined, year: undefined, date: undefined });
  } else if (filterType === 'month') {
    onFilterChange({ month: selMonth, year: selYear, all: false, date: undefined });
  } else if (filterType === 'year') {
    onFilterChange({ year: selYear, all: false, month: undefined, date: undefined });
  } else if (filterType === 'day') {
    const formattedDate = `${selYear}-${selMonth.padStart(2, '0')}-${selDay.padStart(2, '0')}`;
    onFilterChange({ date: formattedDate, all: false, month: undefined, year: undefined });
  }
};

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const filteredData = useMemo(() => {
    let data = activeTab === 'all' ? expenses : expenses.filter(e => e.name?.toLowerCase() === activeTab.toLowerCase());
    // Di layar admin tetap tampilkan yang terbaru di atas (Sort DESC)
    return [...data].sort((a, b) => b.timestamp - a.timestamp); 
  }, [expenses, activeTab]);

  const currentTotalIncome = filteredData.filter(e => e.type === 'income').reduce((sum, e) => sum + e.nominal, 0);
  const currentTotalExpense = filteredData.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.nominal, 0);
  const netBalance = currentTotalIncome - currentTotalExpense;

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-[2rem] p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
           <Database size={16} className="text-amber-600 mb-1" />
           <span className="text-[8px] font-black text-amber-800 uppercase tracking-widest">Cloud Database</span>
           <span className="text-sm font-black text-amber-900">{expenses.length} Transaksi</span>
        </div>
        <div className="bg-indigo-50 rounded-[2rem] p-4 border border-indigo-100 flex flex-col items-center justify-center text-center">
           <ShieldCheck size={16} className="text-indigo-600 mb-1" />
           <span className="text-[8px] font-black text-indigo-800 uppercase tracking-widest">Sistem</span>
           <span className="text-sm font-black text-indigo-900 uppercase">Terlindungi</span>
        </div>
      </div>

      <div className={`rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${netBalance < 0 ? 'bg-gradient-to-br from-red-600 to-rose-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Sisa Saldo {activeTab}</span>
            <div className="text-4xl font-black tracking-tighter mb-1">{formatCurrency(netBalance)}</div>
            <div className="text-[9px] font-bold bg-black/20 w-fit px-2 py-1 rounded-lg">LIVE SYNC ACTIVE</div>
          </div>
          <button onClick={exportToExcel} className="bg-white/20 hover:bg-white/40 p-4 rounded-[1.5rem] border border-white/20 transition-all active:scale-90 flex flex-col items-center gap-1">
            <FileSpreadsheet size={24} />
            <span className="text-[8px] font-black uppercase">Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><ArrowUpCircle size={20}/></div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Masuk</p>
            <p className="text-sm font-black text-gray-900">{formatCurrency(currentTotalIncome)}</p>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><ArrowDownCircle size={20}/></div>
          <div>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Keluar</p>
            <p className="text-sm font-black text-gray-900">{formatCurrency(currentTotalExpense)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {(['all', 'wirdan', 'zulfan'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              {tab === 'all' ? 'Gabungan' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Periode Laporan</h3>
          <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
            {(['month', 'year', 'all'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${filterType === t ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {filterType === 'day' && (
             <select value={selDay} onChange={(e) => setSelDay(e.target.value)} className="flex-[0.6] p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
             </select>
          )}
          {filterType === 'month' && (
            <select value={selMonth} onChange={(e) => setSelMonth(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
          )}
          <select value={selYear} onChange={(e) => setSelYear(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">
            {['2024', '2025', '2026'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => handleApplyFilter()} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3 px-1">
        <h3 className="font-black text-gray-800 text-[10px] uppercase flex items-center gap-2 tracking-[0.2em] opacity-50">
          <Clock size={14} /> Histori Transaksi ({filteredData.length})
        </h3>
        {filteredData.map((exp) => (
          <div key={exp.id} className="bg-white rounded-[1.8rem] p-5 border border-gray-50 shadow-sm flex justify-between items-center transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${exp.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{exp.kategori}</span>
                <span className="text-[8px] text-gray-400 font-bold">{new Date(exp.timestamp).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="font-bold text-gray-900 text-sm leading-tight mb-2 uppercase"><span className="text-blue-600 font-black mr-1">{exp.name}:</span>{exp.keterangan || 'Tanpa Ket.'}</div>
              {exp.notaUrl && (
                <a href={exp.notaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors"><ImageIcon size={10} /> Struk</a>
              )}
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className={`font-black text-sm ${exp.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>{exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.nominal).replace('Rp', '').trim()}</div>
              <button onClick={() => { if(window.confirm('Hapus permanen?')) onDelete(exp.id) }} className="p-2 text-gray-200 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;