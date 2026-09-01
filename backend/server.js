require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// Database connection pool reading securely from environment variables
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'store_rating_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Nodemailer SMTP transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// In-memory OTP storage
const otpStore = {};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Role Authorization Middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: Unauthorized role' });
        }
        next();
    };
};

// ---------------- AUTH ROUTES ----------------

// Request Registration OTP
app.post('/api/auth/request-signup-otp', async (req, res) => {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password || !address) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        otpStore[email] = {
            name,
            email,
            password: hashedPassword,
            address,
            otp: generatedOtp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
        };

        console.log(`\n========================================\n[SIGNUP OTP for ${email}]: ${generatedOtp}\n========================================\n`);

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: `"Store Rating System" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Email Verification OTP - Store Rating Portal',
                    html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-bottom: 12px;">Account Verification</h2>
              <p style="color: #334155;">Hello <strong>${name}</strong>,</p>
              <p style="color: #475569;">Thank you for registering. Use the verification code below to activate your account:</p>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 14px 28px; font-size: 26px; font-weight: 800; letter-spacing: 6px; display: inline-block; border-radius: 8px; color: #1e1b4b; margin: 18px 0;">
                ${generatedOtp}
              </div>
              <p style="color: #64748b; font-size: 0.85rem;">This code will expire in 10 minutes. If you did not initiate this request, please disregard this email.</p>
            </div>
          `
                });
            } catch (mailErr) {
                console.error('SMTP Dispatch Warning:', mailErr.message);
            }
        }

        res.json({ message: 'OTP sent! Please check your email inbox (or terminal console).' });
    } catch (err) {
        console.error('Request Signup Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Verify Registration OTP
app.post('/api/auth/verify-signup-otp', async (req, res) => {
    const { email, otp } = req.body;
    const entry = otpStore[email];

    if (!entry || entry.otp !== otp || Date.now() > entry.expiresAt) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    try {
        await db.query(
            'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
            [entry.name, entry.email, entry.password, entry.address, 'NORMAL_USER']
        );
        delete otpStore[email];
        res.json({ message: 'Registration successful! You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        let validPass = (password === user.password);
        if (!validPass && user.password && user.password.startsWith('$2')) {
            validPass = await bcrypt.compare(password, user.password);
        }

        if (!validPass) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Password
app.put('/api/auth/update-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        let validPass = (oldPassword === user.password);
        if (!validPass && user.password && user.password.startsWith('$2')) {
            validPass = await bcrypt.compare(oldPassword, user.password);
        }

        if (!validPass) return res.status(400).json({ error: 'Incorrect current password' });

        const hashedNew = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, req.user.id]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------- ADMIN ROUTES ----------------

// Dashboard Statistics
app.get('/api/admin/dashboard', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    try {
        const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
        const [[{ total_stores }]] = await db.query('SELECT COUNT(*) AS total_stores FROM stores');
        const [[{ total_ratings }]] = await db.query('SELECT COUNT(*) AS total_ratings FROM ratings');
        res.json({ total_users, total_stores, total_ratings });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create User
app.post('/api/admin/users', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    const { name, email, password, address, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, address, role]
        );
        res.json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    const { id } = req.params;
    try {
        if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete own account' });
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Users with Owner Store Rating
app.get('/api/admin/users', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    try {
        const query = `
      SELECT 
        u.id, u.name, u.email, u.address, u.role,
        CASE 
          WHEN u.role = 'STORE_OWNER' THEN (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE s.owner_id = u.id
          )
          ELSE NULL
        END AS owner_store_rating
      FROM users u
    `;
        const [users] = await db.query(query);
        res.json(users);
    } catch (err) {
        console.error('Error fetching admin users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create Store
app.post('/api/admin/stores', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    const { name, email, address, owner_id } = req.body;
    try {
        await db.query(
            'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
            [name, email, address, owner_id || null]
        );
        res.json({ message: 'Store created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Stores for Admin
app.get('/api/admin/stores', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res) => {
    try {
        const query = `
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address, 
        s.owner_id,
        u.name AS owner_name,
        COALESCE(AVG(r.rating), 0) AS overall_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      GROUP BY s.id, s.name, s.email, s.address, s.owner_id, u.name
    `;
        const [stores] = await db.query(query);
        res.json(stores);
    } catch (err) {
        console.error('Error fetching admin stores:', err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------- USER STORE & RATING ROUTES ----------------

// List Stores for Normal User (Aliases both /api/stores and /api/user/stores)
const handleGetStores = async (req, res) => {
    try {
        const search = req.query.search ? `%${req.query.search}%` : '%';
        const userId = req.user.id;

        const query = `
      SELECT 
        s.id, 
        s.name, 
        s.address,
        COALESCE(AVG(r_all.rating), 0) AS overallRating,
        (SELECT rating FROM ratings WHERE store_id = s.id AND user_id = ?) AS myRating
      FROM stores s
      LEFT JOIN ratings r_all ON s.id = r_all.store_id
      WHERE s.name LIKE ? OR s.address LIKE ?
      GROUP BY s.id, s.name, s.address
    `;
        const [stores] = await db.query(query, [userId, search, search]);
        res.json(stores);
    } catch (err) {
        console.error('Error fetching user stores:', err);
        res.status(500).json({ error: err.message });
    }
};

app.get('/api/stores', authenticateToken, handleGetStores);
app.get('/api/user/stores', authenticateToken, handleGetStores);

// Submit or Modify Rating (Aliases both /api/ratings and /api/user/rate)
const handlePostRating = async (req, res) => {
    const { store_id, rating } = req.body;
    if (!store_id || !rating) {
        return res.status(400).json({ error: 'store_id and rating are required' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM ratings WHERE user_id = ? AND store_id = ?', [req.user.id, store_id]);
        if (existing.length > 0) {
            await db.query('UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?', [rating, req.user.id, store_id]);
        } else {
            await db.query('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [req.user.id, store_id, rating]);
        }
        res.json({ message: 'Rating saved successfully' });
    } catch (err) {
        console.error('Error saving rating:', err);
        res.status(500).json({ error: err.message });
    }
};

app.post('/api/ratings', authenticateToken, handlePostRating);
app.post('/api/user/rate', authenticateToken, handlePostRating);

// ---------------- STORE OWNER ROUTES ----------------

// Owner Dashboard Details
app.get('/api/owner/store', authenticateToken, authorizeRole(['STORE_OWNER']), async (req, res) => {
    try {
        const [stores] = await db.query('SELECT * FROM stores WHERE owner_id = ?', [req.user.id]);
        if (stores.length === 0) return res.status(404).json({ error: 'No store assigned to this owner' });

        const store = stores[0];
        const [[{ avg_rating }]] = await db.query('SELECT COALESCE(AVG(rating), 0) AS avg_rating FROM ratings WHERE store_id = ?', [store.id]);

        const [reviewers] = await db.query(`
      SELECT u.name, u.email, u.address, r.rating, r.created_at
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `, [store.id]);

        res.json({ store, avg_rating, reviewers });
    } catch (err) {
        console.error('Error fetching owner store:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Stores Forum backend running on port ${PORT}`));