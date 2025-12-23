const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi ke XAMPP
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '', // Kosongkan kalau pakai XAMPP standar
  database: 'db_kas_rasi' // Pastikan nama database ini sama dengan di phpMyAdmin
});

db.connect(err => {
  if (err) {
    console.error('Gagal konek MySQL:', err);
    return;
  }
  console.log('✅ Berhasil Terhubung ke MySQL Lokal (XAMPP)');
});

// 1. Endpoint Ambil Data (Sesuai dataService.ts lo)
app.get('/list-kas', (req, res) => {
  db.query('SELECT * FROM transaksi ORDER BY tanggal DESC', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 2. Endpoint Tambah Data
app.post('/tambah-kas', (req, res) => {
  const { uid, nama_user, nominal, kategori, keterangan, type, nota_url, tanggal } = req.body;
  const sql = 'INSERT INTO transaksi (uid, nama, nominal, kategori, keterangan, type, nota_url, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [uid, nama_user, nominal, kategori, keterangan, type, nota_url, tanggal], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Data berhasil disimpan', id: result.insertId });
  });
});

// 3. Endpoint Hapus Data
app.delete('/hapus-kas/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM transaksi WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Data berhasil dihapus' });
  });
});

app.listen(3000, () => {
  console.log('🚀 Server Backend jalan di http://localhost:3000');
});