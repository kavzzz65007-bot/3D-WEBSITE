import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User, Complaint, CampusSpotQR, NotificationItem } from '../types';
import { initialUsers, initialComplaints, initialCampusSpots, initialNotifications } from '../models/seedData';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  campusSpots: CampusSpotQR[];
  notifications: NotificationItem[];
}

let memoryDb: DatabaseSchema = {
  users: [...initialUsers],
  complaints: [...initialComplaints],
  campusSpots: [...initialCampusSpots],
  notifications: [...initialNotifications]
};

let isMongoConnected = false;

// Initialize persistence directory & load from file if exists
export async function initDatabase(): Promise<void> {
  // 1. Try connecting to MongoDB if URI provided
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmycampus';
  
  try {
    const mongoTimeoutMs = 1500;
    const connPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: mongoTimeoutMs
    });
    
    // Give Mongoose a short window to connect
    const result = await Promise.race([
      connPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Mongo connection timeout')), mongoTimeoutMs))
    ]);

    if (result) {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB instance successfully.');
    }
  } catch (err: any) {
    console.log('ℹ️ Running in Embedded Resilient Document Store mode (Persisting to backend/data/db.json).');
    console.log('ℹ️ To connect to external MongoDB cluster, set MONGODB_URI in backend/.env');
  }

  // 2. Ensure data directory exists for file persistence
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.users && parsed.complaints) {
        memoryDb = parsed;
        console.log(` Loaded ${memoryDb.complaints.length} complaints and ${memoryDb.users.length} users from storage.`);
        return;
      }
    } catch (e) {
      console.warn('⚠️ Could not parse existing db.json, writing clean seed data.');
    }
  }

  // Seed default data if file didn't exist
  saveToFile();
  console.log('🌱 Seeded campus initial demo data successfully.');
}

function saveToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db to disk:', err);
  }
}

// User operations
export async function getUsers(): Promise<User[]> {
  return memoryDb.users;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  return memoryDb.users.find(u => u.id === id);
}

export async function createUser(user: User): Promise<User> {
  memoryDb.users.push(user);
  saveToFile();
  return user;
}

// Complaint operations
export async function getAllComplaints(): Promise<Complaint[]> {
  // Sort descending by created date
  return [...memoryDb.complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function findComplaintById(id: string): Promise<Complaint | undefined> {
  return memoryDb.complaints.find(c => c.id === id);
}

export async function createComplaint(complaint: Complaint): Promise<Complaint> {
  memoryDb.complaints.unshift(complaint);
  saveToFile();
  return complaint;
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint | null> {
  const index = memoryDb.complaints.findIndex(c => c.id === id);
  if (index === -1) return null;

  memoryDb.complaints[index] = {
    ...memoryDb.complaints[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveToFile();
  return memoryDb.complaints[index];
}

export async function deleteComplaint(id: string): Promise<boolean> {
  const prevLen = memoryDb.complaints.length;
  memoryDb.complaints = memoryDb.complaints.filter(c => c.id !== id);
  const deleted = memoryDb.complaints.length < prevLen;
  if (deleted) saveToFile();
  return deleted;
}

// Campus Spots operations
export async function getAllCampusSpots(): Promise<CampusSpotQR[]> {
  return memoryDb.campusSpots;
}

export async function findSpotByCode(code: string): Promise<CampusSpotQR | undefined> {
  return memoryDb.campusSpots.find(s => s.code.toLowerCase() === code.toLowerCase());
}

export async function createCampusSpot(spot: CampusSpotQR): Promise<CampusSpotQR> {
  memoryDb.campusSpots.push(spot);
  saveToFile();
  return spot;
}

// Notification operations
export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  return memoryDb.notifications
    .filter(n => n.userId === userId || n.userId === 'all')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createNotification(item: NotificationItem): Promise<NotificationItem> {
  memoryDb.notifications.unshift(item);
  saveToFile();
  return item;
}

export async function markNotificationRead(id: string, userId: string): Promise<boolean> {
  const notif = memoryDb.notifications.find(n => n.id === id && (n.userId === userId || n.userId === 'all'));
  if (notif) {
    notif.read = true;
    saveToFile();
    return true;
  }
  return false;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  memoryDb.notifications.forEach(n => {
    if (n.userId === userId || n.userId === 'all') {
      n.read = true;
    }
  });
  saveToFile();
}
