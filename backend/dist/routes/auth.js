"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../services/db");
const uuidv4 = () => crypto_1.default.randomUUID();
exports.authRouter = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'fixmycampus-super-secure-jwt-token-key-2026';
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
    }
    next();
}
function generateToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}
// 1. Register
exports.authRouter.post('/register', async (req, res) => {
    try {
        const { name, email, password, role = 'student', department, phone } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        const existing = await (0, db_1.findUserByEmail)(email);
        if (existing) {
            return res.status(409).json({ error: 'An account with this campus email already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = {
            id: `user-${uuidv4()}`,
            name,
            email,
            password: hashedPassword,
            role: role,
            department: department || 'General Campus Community',
            phone: phone || '',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            createdAt: new Date().toISOString()
        };
        await (0, db_1.createUser)(newUser);
        const token = generateToken(newUser);
        const { password: _, ...userWithoutPass } = newUser;
        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user: userWithoutPass
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Server error during registration' });
    }
});
// 2. Login
exports.authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }
        const user = await (0, db_1.findUserByEmail)(email);
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid campus credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid campus credentials' });
        }
        const token = generateToken(user);
        const { password: _, ...userWithoutPass } = user;
        return res.json({
            message: 'Login successful',
            token,
            user: userWithoutPass
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Login error' });
    }
});
// 3. Demo Quick Login (One-click testing without typing)
exports.authRouter.post('/demo-login', async (req, res) => {
    try {
        const { role } = req.body; // 'student' | 'admin' | 'staff'
        const users = await (0, db_1.getUsers)();
        const targetUser = users.find(u => u.role === role);
        if (!targetUser) {
            return res.status(404).json({ error: `Demo account for role ${role} not found` });
        }
        const token = generateToken(targetUser);
        const { password: _, ...userWithoutPass } = targetUser;
        return res.json({
            message: `Signed in as Demo ${targetUser.role.toUpperCase()}`,
            token,
            user: userWithoutPass
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Demo login failed' });
    }
});
// 4. Me
exports.authRouter.get('/me', authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await (0, db_1.findUserById)(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password: _, ...userWithoutPass } = user;
        return res.json({ user: userWithoutPass });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch current user' });
    }
});
// 5. Technicians list for assignment dropdown
exports.authRouter.get('/staff', authMiddleware, async (req, res) => {
    try {
        const users = await (0, db_1.getUsers)();
        const staff = users
            .filter(u => u.role === 'staff' || u.role === 'admin')
            .map(({ password, ...u }) => u);
        return res.json({ staff });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});
