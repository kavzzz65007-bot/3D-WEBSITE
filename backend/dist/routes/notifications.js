"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../services/db");
const auth_1 = require("./auth");
exports.notificationsRouter = (0, express_1.Router)();
// 1. Get notifications for current user
exports.notificationsRouter.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await (0, db_1.getNotifications)(userId);
        const unreadCount = notifications.filter(n => !n.read).length;
        return res.json({ notifications, unreadCount });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// 2. Mark single as read
exports.notificationsRouter.patch('/:id/read', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const success = await (0, db_1.markNotificationRead)(id, userId);
        return res.json({ success });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to mark notification read' });
    }
});
// 3. Mark all as read
exports.notificationsRouter.patch('/read-all', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, db_1.markAllNotificationsRead)(userId);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to mark all notifications read' });
    }
});
