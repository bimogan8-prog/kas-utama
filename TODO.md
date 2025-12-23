# Plan Perbaikan Validasi Nominal

## Informasi yang Dikumpulkan:
- ExpenseForm.tsx saat ini hanya memiliki validasi `nominal <= 0`
- Tidak ada batasan minimum dan maksimum untuk input nominal
- User mengalami masalah: input 89 berhasil, tapi 10.000 tidak bisa
- Requirement: Minimal 500, Maksimal 1.000.000.000

## Plan Update:
1. **Update handleNominalChange**: Menambahkan validasi real-time saat user mengetik
2. **Update handleSubmit**: Menambahkan validasi sebelum submit
3. **Tambahkan state untuk error messages**: Untuk menampilkan pesan validasi
4. **Tambahkan UI feedback**: Visual indicators untuk batasan nominal

## File yang Diedit:
- `/workspaces/kas-utama/src/components/ExpenseForm.tsx`

## Langkah-langkah:
✅ 1. Tambahkan state untuk error messages (`nominalError`)
✅ 2. Update handleNominalChange dengan validasi range 500-1.000.000.000
✅ 3. Update handleSubmit dengan validasi yang sama
✅ 4. Tambahkan UI untuk menampilkan error messages
✅ 5. Reset error message pada form submit

## Follow-up:
- Testing dengan input 89 (harus error)
- Testing dengan input 10.000 (harus berhasil)
- Testing dengan input 500 (minimal, harus berhasil)
- Testing dengan input 1.000.000.000 (maksimal, harus berhasil)
- Testing dengan input 1.000.000.001 (harus error)
