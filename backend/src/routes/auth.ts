import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { findUserByEmail, findUserById, createUser, getUsers } from '../services/db';
import { UserRole } from '../types';

const uuidv4 = () => crypto.randomUUID();

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fixmycampus-super-secure-jwt-token-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
  }
  next();
}

function generateToken(user: { id: string; email: string; role: UserRole; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'student', department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this campus email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `user-${uuidv4()}`,
      name,
      email,
      password: hashedPassword,
      role: role as UserRole,
      department: department || 'General Campus Community',
      phone: phone || '',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString()
    };

    await createUser(newUser);

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPass } = newUser;

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userWithoutPass
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// 2. Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid campus credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login error' });
  }
});

// 3. Demo Quick Login (One-click testing without typing)
authRouter.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // 'student' | 'admin' | 'staff'
    const users = await getUsers();
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
  } catch (err: any) {
    return res.status(500).json({ error: 'Demo login failed' });
  }
});

// 4. Me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPass } = user;
    return res.json({ user: userWithoutPass });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// 5. Technicians list for assignment dropdown
authRouter.get('/staff', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await getUsers();
    const staff = users
      .filter(u => u.role === 'staff' || u.role === 'admin')
      .map(({ password, ...u }) => u);
    return res.json({ staff });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});
