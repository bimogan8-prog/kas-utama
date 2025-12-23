# RENCANA PERBAIKAN BUG VALIDATION - "please match the requested format"

## MASALAH YANG DIIDENTIFIKASI

### Akar Masalah:
- Input nominal menggunakan `pattern="[0-9]*"` untuk HTML5 validation
- User mengetik "5.000" yang mengandung titik (.) untuk pemisah ribuan
- Browser HTML5 validation gagal karena pattern hanya menerima angka 0-9
- Muncul error "please match the requested format"

### Kode Bermasalah:
```tsx
<input 
  ref={nominalInputRef}
  type="text" 
  inputMode="numeric"
  pattern="[0-9]*"           // ← MASALAH: pattern hanya angka tanpa titik
  placeholder="0" 
  value={displayNominal}     // ← displayNominal berisi format "5.000" dengan titik
  onChange={handleNominalChange} 
  required 
/>
```

## SOLUSI YANG AKAN DIIMPLEMENTASIKAN

### Opsi 1: Hapus Pattern Validation (Recommended)
- Hapus atribut `pattern="[0-9]*"` 
- Tetap gunakan validasi JavaScript custom yang sudah ada
- Lebih fleksibel dan user-friendly

### Opsi 2: Pisahkan Input dan Display
- Input field untuk angka saja (tanpa format)
- Display formatted number secara terpisah
- Lebih kompleks tapi sangat robust

### Opsi 3: Ubah Input Type
- Gunakan `type="number"` dengan step="1"
- Tapi ini bisa menyebabkan masalah dengan format ribuan Indonesia

## RENCANA IMPLEMENTASI

### Langkah 1: Perbaiki ExpenseForm.tsx
- [ ] Hapus `pattern="[0-9]*"` dari input nominal
- [ ] Pastikan validasi JavaScript tetap bekerja
- [ ] Test dengan nominal "5.000"

### Langkah 2: Test Validasi
- [ ] Test input nominal 5000 (tanpa titik)
- [ ] Test input nominal 5.000 (dengan titik)
- [ ] Test boundary cases (min 500, max 1M)

### Langkah 3: Verifikasi
- [ ] Pastikan tidak ada regression pada validasi lain
- [ ] Pastikan UX tetap smooth untuk user Android/iOS

## KODE YANG AKAN DIPERBAIKI

**SEBELUM (bermasalah):**
```tsx
<input 
  type="text" 
  inputMode="numeric"
  pattern="[0-9]*"     // ← HAPUS INI
  value={displayNominal}
  // ...
/>
```

**SESUDAH (fixed):**
```tsx
<input 
  type="text" 
  inputMode="numeric"
  value={displayNominal}  // ← Pattern dihapus, tetap gunakan validasi JS
  // ...
/>
