import { Router, Response } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/db';
import { authMiddleware, AuthRequest } from './auth';

export const notificationsRouter = Router();

// 1. Get notifications for current user
notificationsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await getNotifications(userId);
    const unreadCount = notifications.filter(n => !n.read).length;
    return res.json({ notifications, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 2. Mark single as read
notificationsRouter.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const success = await markNotificationRead(id, userId);
    return res.json({ success });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// 3. Mark all as read
notificationsRouter.patch('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await markAllNotificationsRead(userId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
});
