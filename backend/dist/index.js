"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./services/db");
const auth_1 = require("./routes/auth");
const complaints_1 = require("./routes/complaints");
const analytics_1 = require("./routes/analytics");
const qr_1 = require("./routes/qr");
const notifications_1 = require("./routes/notifications");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Generous body limit for direct photo uploads (base64)
app.use(express_1.default.json({ limit: '25mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '25mb' }));
// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'online',
        app: 'FixMyCampus – AI-Powered Campus Problem Solver',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// Mount Routes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/complaints', complaints_1.complaintsRouter);
app.use('/api/analytics', analytics_1.analyticsRouter);
app.use('/api/qr', qr_1.qrRouter);
app.use('/api/notifications', notifications_1.notificationsRouter);
// Start Server
async function startServer() {
    await (0, db_1.initDatabase)();
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 FixMyCampus API Backend is running!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
        console.log(`=======================================================`);
    });
}
startServer().catch(err => {
    console.error('Failed to start FixMyCampus server:', err);
});
