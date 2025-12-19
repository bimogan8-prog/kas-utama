import React, { useState, useRef } from 'react';
import { Camera, X, PlusCircle, Wallet, Tag, FileText, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { User, TransactionType } from '../types';
import { dataService } from '../services/dataService';

interface ExpenseFormProps {
  user: User;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = ['BBM', 'Makan', 'Parkir', 'Tol', 'Servis', 'Lainnya'];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ user, onSuccess }) => {
  const now = new Date();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State Form
  const [type, setType] = useState<TransactionType>('expense');
  const [kategori, setKategori] = useState(EXPENSE_CATEGORIES[0]);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  
  // State Tanggal
  const [selDay, setSelDay] = useState(now.getDate().toString());
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(now.getFullYear().toString());

  // State Gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Dropdown
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { val: '1', label: 'Januari' }, { val: '2', label: 'Februari' }, { val: '3', label: 'Maret' },
    { val: '4', label: 'April' }, { val: '5', label: 'Mei' }, { val: '6', label: 'Juni' },
    { val: '7', label: 'Juli' }, { val: '8', label: 'Agustus' }, { val: '9', label: 'September' },
    { val: '10', label: 'Oktober' }, { val: '11', label: 'November' }, { val: '12', label: 'Desember' }
  ];
  const years = ['2024', '2025', '2026'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = "";
      if (imageFile) {
        uploadedImageUrl = await dataService.uploadImage(imageFile);
      }

      const selectedDate = new Date(parseInt(selYear), parseInt(selMonth) - 1, parseInt(selDay));
      const today = new Date();
      selectedDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds());

      await dataService.addTransaction({
        uid: user.id,
        name: user.name,
        kategori: type === 'income' ? 'Kas Masuk' : kategori,
        nominal: Number(nominal),
        keterangan,
        type,
        timestamp: selectedDate.getTime(),
        notaUrl: uploadedImageUrl 
      });

      // Reset
      setNominal('');
      setKeterangan('');
      setImageFile(null);
      setPreviewUrl(null);
      onSuccess();
      alert("Berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
      {/* HEADER & TOGGLE TYPE */}
      <div className="flex items-center justify-between">
        <h2 className="font-black text-gray-800 uppercase tracking-tight text-lg">Input Kas</h2>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button type="button" onClick={() => setType('expense')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'expense' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>
            <ArrowDownCircle size={14} /> Keluar
          </button>
          <button type="button" onClick={() => setType('income')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}>
            <ArrowUpCircle size={14} /> Masuk
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* TANGGAL */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            <Calendar size={14} className="text-blue-500" /> Tanggal
          </label>
          <div className="flex gap-2">
            <select value={selDay} onChange={(e) => setSelDay(e.target.value)} className="flex-[0.7] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none">
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={selMonth} onChange={(e) => setSelMonth(e.target.value)} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none">
              {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select value={selYear} onChange={(e) => setSelYear(e.target.value)} className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* KATEGORI */}
        {type === 'expense' && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold appearance-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* NOMINAL */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nominal (IDR)</label>
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input type="number" placeholder="0" value={nominal} onChange={(e) => setNominal(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black" required />
          </div>
        </div>

        {/* KETERANGAN */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Keterangan</label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-gray-300" size={18} />
            <textarea placeholder="Catatan transaksi..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-sm font-bold" />
          </div>
        </div>

        {/* UPLOAD GAMBAR (FITUR TAMBAHAN) */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lampiran Nota (Opsional)</label>
          {!previewUrl ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-all">
              <Camera size={28} className="mb-2 text-blue-500" />
              <span className="text-[10px] font-bold uppercase">Tambah Foto Nota</span>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-inner">
              <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
              <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <X size={14} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
        </div>
      </div>

      {/* SUBMIT */}
      <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isSubmitting ? 'bg-gray-300' : type === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><PlusCircle size={20} /> Simpan Transaksi</>}
      </button>
    </form>
  );
};

export default ExpenseForm;