import React, { useState } from 'react';
import { PlusCircle, Wallet, Tag, FileText, ArrowUpCircle, ArrowDownCircle, Calendar, Link } from 'lucide-react';
import { User, TransactionType } from '../types/types';
import { dataService } from '../services/dataService';

interface ExpenseFormProps {
  user: User;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = ['BBM', 'Makan', 'Parkir', 'Tol', 'Servis', 'Lainnya'];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ user, onSuccess }) => {
  const now = new Date();
  
  // Data untuk dropdown
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];
  const years = ['2023', '2024', '2025', '2026'];

  // State untuk masing-masing bagian tanggal
  const [type, setType] = useState<TransactionType>('expense');
  const [kategori, setKategori] = useState(EXPENSE_CATEGORIES[0]);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [notaUrl, setNotaUrl] = useState('');
  
  const [selDay, setSelDay] = useState(now.getDate().toString());
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(now.getFullYear().toString());
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || isNaN(Number(nominal))) return;

    // Konstruksi tanggal dari dropdown
    const selectedDate = new Date(
      parseInt(selYear), 
      parseInt(selMonth) - 1, 
      parseInt(selDay)
    );
    const today = new Date();
    
    // Validasi: Tidak boleh lebih dari hari ini
    const compareSelected = new Date(selectedDate);
    compareSelected.setHours(0,0,0,0);
    const compareToday = new Date(today);
    compareToday.setHours(0,0,0,0);

    if (compareSelected > compareToday) {
      alert("Maaf, tidak bisa menginput untuk tanggal di masa depan (besok/lusa).");
      return;
    }

    setIsSubmitting(true);
    
    // Kategori otomatis untuk pemasukan
    const finalKategori = type === 'income' ? 'Kas Masuk' : kategori;

    // Tambahkan waktu saat ini ke tanggal terpilih agar jam input tetap akurat di database
    selectedDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds());

    setTimeout(() => {
      dataService.addTransaction({
        uid: user.id,
        nama_user: user.name,
        kategori: finalKategori,
        nominal: Number(nominal),
        keterangan,
        notaUrl, // Kirim URL nota
        type: type,
        timestamp: selectedDate.getTime()
      });
      
      setNominal('');
      setKeterangan('');
      setNotaUrl('');
      // Reset tanggal ke hari ini setelah sukses
      setSelDay(today.getDate().toString());
      setSelMonth((today.getMonth() + 1).toString());
      setSelYear(today.getFullYear().toString());
      
      setIsSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-blue-600">
          <PlusCircle size={20} />
          <h2 className="font-bold text-lg">Input Kas</h2>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { setType('expense'); setKategori(EXPENSE_CATEGORIES[0]); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              type === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <ArrowDownCircle size={12} /> Keluar
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              type === 'income' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            <ArrowUpCircle size={12} /> Masuk
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* TANGGAL TRANSAKSI */}
        <div>
          <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            <Calendar size={14} className="text-blue-500" /> Tanggal Transaksi
          </label>
          <div className="flex gap-2">
            <select 
              value={selDay} 
              onChange={(e) => setSelDay(e.target.value)} 
              className="flex-[0.6] p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-center transition-all"
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
              value={selMonth} 
              onChange={(e) => setSelMonth(e.target.value)} 
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-center transition-all"
            >
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select 
              value={selYear} 
              onChange={(e) => setSelYear(e.target.value)} 
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-center transition-all"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* KATEGORI */}
        {type === 'expense' && (
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Kategori</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all text-sm font-bold"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* NOMINAL */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Nominal (Rp)</label>
          <div className="relative group">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="number"
              placeholder="0"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold"
              required
            />
          </div>
        </div>

        {/* NOTA URL (OPSIONAL) */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Link Foto Nota (Opsional)</label>
          <div className="relative group">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="https://..."
              value={notaUrl}
              onChange={(e) => setNotaUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold"
            />
          </div>
        </div>

        {/* KETERANGAN */}
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Keterangan</label>
          <div className="relative group">
            <FileText className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <textarea
              placeholder={type === 'income' ? "Sumber pemasukan..." : "Contoh: Beli bensin di SPBU..."}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24 resize-none text-sm font-bold"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 px-4 rounded-[1.5rem] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
          isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 
          type === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
        }`}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <PlusCircle size={18} />
            Simpan {type === 'income' ? 'Masuk' : 'Keluar'}
          </>
        )}
      </button>
    </form>
  );
};

export default ExpenseForm;