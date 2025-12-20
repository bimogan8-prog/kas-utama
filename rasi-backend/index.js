require('dotenv').config();
const express = require('express');
const mysql = require('mysql2'); // Menggunakan mysql2 callback style sesuai request
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// CONFIGURATION: Gunakan Pool agar koneksi stabil
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password_lo',
    database: process.env.DB_NAME || 'kas_rasi_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- API ROUTES ---

// 1. Ambil Data (List Kas) dengan Filter
app.get('/list-kas', (req, res) => {
    const { uid, date, month, year, all } = req.query;
    let query = "SELECT * FROM kas_rasi WHERE 1=1";
    const params = [];

    // Filter by User (Mapping UID -> Name)
    if (uid) {
        if (uid === 'w1') { query += " AND name = ?"; params.push('Wirdan'); }
        else if (uid === 'w2') { query += " AND name = ?"; params.push('Zulfan'); }
    }

    // Filter by Time
    if (!all) {
        if (date) {
            query += " AND DATE(timestamp) = ?";
            params.push(date);
        } else if (month && year) {
            query += " AND MONTH(timestamp) = ? AND YEAR(timestamp) = ?";
            params.push(month, year);
        } else if (year) {
            query += " AND YEAR(timestamp) = ?";
            params.push(year);
        }
    }

    query += " ORDER BY timestamp DESC";

    pool.query(query, params, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. Tambah Data
app.post('/tambah-kas', (req, res) => {
    const { name, type, nominal, kategori, keterangan, notaUrl, timestamp } = req.body;
    
    // Gunakan timestamp dari frontend jika ada (untuk backdate), atau waktu sekarang
    const ts = timestamp ? new Date(timestamp) : new Date();

    const query = 'INSERT INTO kas_rasi (name, type, nominal, kategori, keterangan, notaUrl, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    pool.query(query, [name, type, nominal, kategori, keterangan, notaUrl, ts], (err, result) => {
        if (err) {
            console.error("Insert Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// 3. Hapus Data
app.delete('/hapus-kas/:id', (req, res) => {
    const { id } = req.params;
    pool.query('DELETE FROM kas_rasi WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error("Delete Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// 4. Statistik (Penting untuk Dashboard Admin)
app.get('/stats', (req, res) => {
    pool.query(`
        SELECT 
            COUNT(*) as count, 
            SUM(CASE WHEN type = 'income' THEN nominal ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN nominal ELSE 0 END) as expense
        FROM kas_rasi
    `, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// 5. Login (Penting untuk Auth Frontend)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const USERS = [
        { id: 'w1', username: 'wirdan', name: 'Wirdan', role: 'worker', password: 'rasau@40' },
        { id: 'w2', username: 'zulfan', name: 'Zulfan', role: 'worker', password: 'sorek@50' },
        { id: 'a1', username: 'mazkafh', name: 'Admin Mazkafh', role: 'admin', password: 'admin' }
    ];

    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
        const { password, ...userData } = user;
        res.json(userData);
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server RASI Finance berjalan stabil di port ${PORT}`);
});