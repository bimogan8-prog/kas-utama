require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for VPS access
app.use(bodyParser.json());

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
pool.getConnection()
    .then(conn => {
        console.log("✅ MySQL Database Connected");
        conn.release();
    })
    .catch(err => {
        console.error("❌ MySQL Connection Failed:", err);
    });

// --- API ROUTES ---

// 1. GET List Data (With Filters)
app.get('/transactions', async (req, res) => {
    try {
        const { uid, date, month, year, all } = req.query;
        let query = "SELECT * FROM kas_rasi WHERE 1=1";
        const params = [];

        // Mapping UID to Name
        if (uid) {
            if (uid === 'w1') { query += " AND name = ?"; params.push('Wirdan'); }
            else if (uid === 'w2') { query += " AND name = ?"; params.push('Zulfan'); }
        }

        // Time Filters
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

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error("GET /transactions Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. POST Add Data
app.post('/transactions', async (req, res) => {
    try {
        const { name, type, nominal, kategori, keterangan, notaUrl, timestamp } = req.body;

        if (!name || !nominal || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Use provided timestamp or current time
        const timeVal = timestamp ? new Date(timestamp) : new Date();

        const query = `
            INSERT INTO kas_rasi (name, type, nominal, kategori, keterangan, notaUrl, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await pool.execute(query, [name, type, nominal, kategori, keterangan, notaUrl, timeVal]);
        res.status(201).json({ message: "Transaction saved successfully" });
    } catch (error) {
        console.error("POST /transactions Error:", error);
        res.status(500).json({ error: "Failed to save transaction" });
    }
});

// 3. DELETE Data
app.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute("DELETE FROM kas_rasi WHERE id = ?", [id]);
        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("DELETE /transactions Error:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

// 4. GET Statistics (Calculated by Database)
app.get('/stats', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as count, 
                SUM(CASE WHEN type = 'income' THEN nominal ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN nominal ELSE 0 END) as expense
            FROM kas_rasi
        `);
        res.json(rows[0]);
    } catch (error) {
        console.error("GET /stats Error:", error);
        res.status(500).json({ error: "Failed to calculate stats" });
    }
});

// 5. POST Login (Auth)
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

// Bind to 0.0.0.0 to allow external access (VPS)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});