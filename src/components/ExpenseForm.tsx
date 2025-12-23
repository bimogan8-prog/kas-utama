import React, { useState, useEffect, useRef } from 'react';
import { 
  PlusCircle, 
  Wallet, 
  Tag, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  RefreshCcw 
} from 'lucide-react';
import { User, TransactionType } from '../types';
import { dataService } from '../services/dataService';

interface ExpenseFormProps {
  user: User;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = ['BBM', 'Makan', 'Parkir', 'Tol', 'Servis', 'Lainnya'];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ user, onSuccess }) => {
  const now = new Date();
  
  // Refs untuk Android keyboard handling
  const formRef = useRef<HTMLDivElement>(null);
  const nominalInputRef = useRef<HTMLInputElement>(null);
  const keteranganInputRef = useRef<HTMLTextAreaElement>(null);
  
  // State Utama
  const [type, setType] = useState<TransactionType>('expense');
  const [kategori, setKategori] = useState(EXPENSE_CATEGORIES[0]);
  const [displayNominal, setDisplayNominal] = useState(''); 
  const [nominal, setNominal] = useState(0); 
  const [keterangan, setKeterangan] = useState('');
  
  // State Monitoring Saldo
  const [currentSaldo, setCurrentSaldo] = useState<number>(0);
  const [isLoadingSaldo, setIsLoadingSaldo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Tanggal Dropdown
  const [selDay, setSelDay] = useState(now.getDate().toString());
  const [selMonth, setSelMonth] = useState((now.getMonth() + 1).toString());
  const [selYear, setSelYear] = useState("2025");

  // State untuk Android keyboard detection
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // State untuk validasi nominal
  const [nominalError, setNominalError] = useState('');

  // Ambil saldo secara Real-time dari RTDB - HANYA untuk user yang sedang login
  useEffect(() => {
    const unsubscribe = dataService.subscribeTransactions((data) => {
      // Filter data hanya untuk user yang sedang login
      const userData = data.filter(item => item.uid === user.id);
      
      const total = userData.reduce((acc, item) => 
        item.type === 'income' ? acc + Number(item.nominal) : acc - Number(item.nominal), 0
      );
      setCurrentSaldo(total);
      setIsLoadingSaldo(false);
    });
    return () => unsubscribe();
  }, [user.id]);

  // Android Keyboard Detection & Handling
  useEffect(() => {
    const handleAndroidKeyboard = () => {
      const isKeyboard = window.innerHeight < document.documentElement.clientHeight * 0.75;
      const keyboardHeight = isKeyboard ? document.documentElement.clientHeight - window.innerHeight : 0;
      
      setIsKeyboardVisible(isKeyboard);
      setKeyboardHeight(keyboardHeight);
    };

    const handleAndroidResize = () => {
      handleAndroidKeyboard();
      
      // Auto-scroll to focused input
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        setTimeout(() => {
          activeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      }
    };

    window.addEventListener('resize', handleAndroidResize);
    window.addEventListener('orientationchange', handleAndroidResize);
    handleAndroidResize();

    // Android keyboard event listeners
    if (window.AndroidInterface) {
      const handleKeyboardShow = (height: number) => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(height);
        
        // Scroll to current input
        const activeInput = document.activeElement as HTMLElement;
        if (activeInput) {
          setTimeout(() => {
            activeInput.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }, 150);
        }
      };

      const handleKeyboardHide = () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      };

      window.addEventListener('android:keyboard:show', (e: any) => handleKeyboardShow(e.detail));
      window.addEventListener('android:keyboard:hide', handleKeyboardHide);
    }

    return () => {
      window.removeEventListener('resize', handleAndroidResize);
      window.removeEventListener('orientationchange', handleAndroidResize);
    };
  }, []);

  // Focus handlers untuk auto-scroll
  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 200);
  };

  // Format Rupiah saat mengetik
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus semua karakter non-digit kecuali angka
    const rawValue = e.target.value.replace(/[^\d]/g, ""); 
    const numValue = Number(rawValue);
    
    // Validasi nominal dengan range 500 - 1.000.000.000
    let error = '';
    if (rawValue && numValue > 0) {
      if (numValue < 500) {
        error = 'Nominal minimal Rp 500';
      } else if (numValue > 1000000000) {
        error = 'Nominal maksimal Rp 1.000.000.000';
      }
    }
    
    // Update state
    setNominal(numValue);
    setNominalError(error);
    setDisplayNominal(rawValue ? new Intl.NumberFormat('id-ID').format(numValue) : "");
    
    // Debug: console.log untuk melihat parsing
    console.log('Raw value:', rawValue);
    console.log('Nominal value:', numValue);
    console.log('Validation error:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug: melihat nilai nominal saat submit
    console.log('Submitting with nominal:', nominal);
    console.log('Display nominal:', displayNominal);
    
    // Validasi nominal sebelum submit
    let error = '';
    if (nominal <= 0) {
      error = 'Nominal harus diisi';
    } else if (nominal < 500) {
      error = 'Nominal minimal Rp 500';
    } else if (nominal > 1000000000) {
      error = 'Nominal maksimal Rp 1.000.000.000';
    }
    
    if (error) {
      setNominalError(error);
      console.log('Validation failed:', error);
      return;
    }
    
    if (isSubmitting) {
      console.log('Validation failed: isSubmitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Susun tanggal dari pilihan dropdown
     const selectedDate = new Date(parseInt(selYear), parseInt(selMonth) - 1, parseInt(selDay));

const payload = {
  uid: user.id,
  nama: user.name, // Map user.name to transaction.nama
  type: type,
  nominal: Number(nominal),
  kategori: type === 'income' ? 'Pemasukan' : kategori,
  keterangan: keterangan,
  tanggal: `${selYear}-${selMonth.padStart(2, '0')}-${selDay.padStart(2, '0')}`,
  timestamp: selectedDate.getTime()
};

// Panggil service
await dataService.addTransaction(payload);
    
      // Reset form
      setNominal(0);
      setDisplayNominal("");
      setNominalError('');
      setKeterangan('');
      
      // Hide keyboard if visible
      if (window.AndroidInterface && window.AndroidInterface.hideKeyboard) {
        window.AndroidInterface.hideKeyboard();
      }
      
      alert("Data berhasil disimpan!");
      onSuccess(); 
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan ke database!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={formRef} className="space-y-4">
      {/* CARD SALDO */}
      <div className="bg-gray-900 rounded-[2rem] p-6 shadow-xl border border-gray-800">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sisa Saldo Kas</span>
          <RefreshCcw size={12} className={`text-gray-600 ${isLoadingSaldo ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-blue-500 font-black text-xl">Rp</span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {isLoadingSaldo ? "..." : currentSaldo.toLocaleString('id-ID')}
          </h1>
        </div>
      </div>

      {/* FORM INPUT - Android Optimized */}
      <form onSubmit={handleSubmit} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 transition-all duration-300 ${
        isKeyboardVisible ? 'p-4 mx-2' : 'p-8'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-black text-gray-800 uppercase tracking-tight ${isKeyboardVisible ? 'text-base' : 'text-lg'}`}>Catat Kas</h2>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button 
              type="button" 
              onClick={() => setType('expense')} 
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all min-h-[40px] touch-manipulation ${type === 'expense' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              <ArrowDownCircle size={14} /> Keluar
            </button>
            <button 
              type="button" 
              onClick={() => setType('income')} 
              className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all min-h-[40px] touch-manipulation ${type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
            >
              <ArrowUpCircle size={14} /> Masuk
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* TANGGAL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase ml-1">
              <Calendar size={14} className="text-blue-500" /> Pilih Tanggal
            </label>
            <div className="flex gap-2">
              <select 
                value={selDay} 
                onChange={(e) => setSelDay(e.target.value)} 
                className="flex-[0.7] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none min-h-[48px] touch-manipulation"
              >
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select 
                value={selMonth} 
                onChange={(e) => setSelMonth(e.target.value)} 
                className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none min-h-[48px] touch-manipulation"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <select 
                value={selYear} 
                onChange={(e) => setSelYear(e.target.value)} 
                className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none min-h-[48px] touch-manipulation"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          {/* NOMINAL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nominal (Rp)</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                ref={nominalInputRef}
                type="text" 
                inputMode="numeric"
                placeholder="0" 
                value={displayNominal} 
                onChange={handleNominalChange} 
                onFocus={() => handleInputFocus(nominalInputRef)}
                className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none text-sm font-black min-h-[48px] touch-manipulation ${
                  nominalError ? 'border-red-500 bg-red-50' : 'border-gray-100'
                }`}
                style={{
                  fontSize: '16px', // Prevent zoom on iOS/Android
                  zoom: 1
                }}
                required 
              />
              {/* Error message */}
              {nominalError && (
                <div className="absolute -bottom-6 left-0 right-0 text-[10px] font-bold text-red-600 bg-white px-2 py-1 rounded shadow-sm">
                  {nominalError}
                </div>
              )}
            </div>
          </div>

          {/* KATEGORI */}
          {type === 'expense' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Kategori</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  value={kategori} 
                  onChange={(e) => setKategori(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none appearance-none min-h-[48px] touch-manipulation"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* KETERANGAN */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Keterangan</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-gray-300" size={18} />
              <textarea 
                ref={keteranganInputRef}
                placeholder="Catatan transaksi..." 
                value={keterangan} 
                onChange={(e) => setKeterangan(e.target.value)} 
                onFocus={() => handleInputFocus(keteranganInputRef)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none h-24 resize-none text-sm font-bold min-h-[48px] touch-manipulation"
                style={{
                  fontSize: '16px', // Prevent zoom on iOS/Android
                  zoom: 1
                }}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON - Android Optimized */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`w-full rounded-[1.8rem] font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 min-h-[56px] touch-manipulation ${
            isSubmitting ? 'bg-gray-300' : type === 'income' ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'
          } ${isKeyboardVisible ? 'py-3 text-sm' : 'py-5 text-base'}`}
        >
          {isSubmitting ? "Memproses..." : <><PlusCircle size={20} /> Simpan Transaksi</>}
        </button>
      </form>

      {/* Android Keyboard Spacer */}
      {isKeyboardVisible && (
        <div 
          style={{ height: `${keyboardHeight}px` }}
          className="bg-transparent"
        />
      )}
    </div>
  );
};

// Android types are imported from src/types/android.d.ts

export default ExpenseForm;
