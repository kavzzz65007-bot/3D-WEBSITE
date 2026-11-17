"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getUsers = getUsers;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
exports.getAllComplaints = getAllComplaints;
exports.findComplaintById = findComplaintById;
exports.createComplaint = createComplaint;
exports.updateComplaint = updateComplaint;
exports.deleteComplaint = deleteComplaint;
exports.getAllCampusSpots = getAllCampusSpots;
exports.findSpotByCode = findSpotByCode;
exports.createCampusSpot = createCampusSpot;
exports.getNotifications = getNotifications;
exports.createNotification = createNotification;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const seedData_1 = require("../models/seedData");
const DATA_DIR = path_1.default.join(__dirname, '../../data');
const DB_FILE = path_1.default.join(DATA_DIR, 'db.json');
let memoryDb = {
    users: [...seedData_1.initialUsers],
    complaints: [...seedData_1.initialComplaints],
    campusSpots: [...seedData_1.initialCampusSpots],
    notifications: [...seedData_1.initialNotifications]
};
let isMongoConnected = false;
// Initialize persistence directory & load from file if exists
async function initDatabase() {
    // 1. Try connecting to MongoDB if URI provided
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmycampus';
    try {
        const mongoTimeoutMs = 1500;
        const connPromise = mongoose_1.default.connect(mongoUri, {
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
    }
    catch (err) {
        console.log('ℹ️ Running in Embedded Resilient Document Store mode (Persisting to backend/data/db.json).');
        console.log('ℹ️ To connect to external MongoDB cluster, set MONGODB_URI in backend/.env');
    }
    // 2. Ensure data directory exists for file persistence
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs_1.default.existsSync(DB_FILE)) {
        try {
            const content = fs_1.default.readFileSync(DB_FILE, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed.users && parsed.complaints) {
                memoryDb = parsed;
                console.log(` Loaded ${memoryDb.complaints.length} complaints and ${memoryDb.users.length} users from storage.`);
                return;
            }
        }
        catch (e) {
            console.warn('⚠️ Could not parse existing db.json, writing clean seed data.');
        }
    }
    // Seed default data if file didn't exist
    saveToFile();
    console.log('🌱 Seeded campus initial demo data successfully.');
}
function saveToFile() {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Error saving db to disk:', err);
    }
}
// User operations
async function getUsers() {
    return memoryDb.users;
}
async function findUserByEmail(email) {
    return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}
async function findUserById(id) {
    return memoryDb.users.find(u => u.id === id);
}
async function createUser(user) {
    memoryDb.users.push(user);
    saveToFile();
    return user;
}
// Complaint operations
async function getAllComplaints() {
    // Sort descending by created date
    return [...memoryDb.complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function findComplaintById(id) {
    return memoryDb.complaints.find(c => c.id === id);
}
async function createComplaint(complaint) {
    memoryDb.complaints.unshift(complaint);
    saveToFile();
    return complaint;
}
async function updateComplaint(id, updates) {
    const index = memoryDb.complaints.findIndex(c => c.id === id);
    if (index === -1)
        return null;
    memoryDb.complaints[index] = {
        ...memoryDb.complaints[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveToFile();
    return memoryDb.complaints[index];
}
async function deleteComplaint(id) {
    const prevLen = memoryDb.complaints.length;
    memoryDb.complaints = memoryDb.complaints.filter(c => c.id !== id);
    const deleted = memoryDb.complaints.length < prevLen;
    if (deleted)
        saveToFile();
    return deleted;
}
// Campus Spots operations
async function getAllCampusSpots() {
    return memoryDb.campusSpots;
}
async function findSpotByCode(code) {
    return memoryDb.campusSpots.find(s => s.code.toLowerCase() === code.toLowerCase());
}
async function createCampusSpot(spot) {
    memoryDb.campusSpots.push(spot);
    saveToFile();
    return spot;
}
// Notification operations
async function getNotifications(userId) {
    return memoryDb.notifications
        .filter(n => n.userId === userId || n.userId === 'all')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function createNotification(item) {
    memoryDb.notifications.unshift(item);
    saveToFile();
    return item;
}
async function markNotificationRead(id, userId) {
    const notif = memoryDb.notifications.find(n => n.id === id && (n.userId === userId || n.userId === 'all'));
    if (notif) {
        notif.read = true;
        saveToFile();
        return true;
    }
    return false;
}
async function markAllNotificationsRead(userId) {
    memoryDb.notifications.forEach(n => {
        if (n.userId === userId || n.userId === 'all') {
            n.read = true;
        }
    });
    saveToFile();
}
