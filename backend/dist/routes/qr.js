"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrRouter = void 0;
const express_1 = require("express");
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../services/db");
const auth_1 = require("./auth");
const uuidv4 = () => crypto_1.default.randomUUID();
exports.qrRouter = (0, express_1.Router)();
// 1. Get all predefined campus spots with visual QR codes
exports.qrRouter.get('/spots', async (_req, res) => {
    try {
        const spots = await (0, db_1.getAllCampusSpots)();
        // Generate QR Data URLs for spots if not cached
        const enrichedSpots = await Promise.all(spots.map(async (spot) => {
            try {
                const payload = JSON.stringify({
                    code: spot.code,
                    building: spot.building,
                    block: spot.block,
                    floor: spot.floor,
                    room: spot.room,
                    category: spot.defaultCategory
                });
                const qrDataUrl = await qrcode_1.default.toDataURL(payload, {
                    errorCorrectionLevel: 'M',
                    margin: 2,
                    color: {
                        dark: '#1e293b',
                        light: '#ffffff'
                    }
                });
                return { ...spot, qrDataUrl };
            }
            catch (e) {
                return spot;
            }
        }));
        return res.json({ spots: enrichedSpots });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to fetch campus QR spots' });
    }
});
// 2. Lookup spot by QR code string
exports.qrRouter.get('/spot/:code', async (req, res) => {
    try {
        const code = req.params.code;
        const spot = await (0, db_1.findSpotByCode)(code);
        if (!spot) {
            return res.status(404).json({ error: `No campus location registered for code "${code}"` });
        }
        return res.json({ spot });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to lookup spot' });
    }
});
// 3. Admin: Generate new campus QR Spot
exports.qrRouter.post('/spots', auth_1.authMiddleware, async (req, res) => {
    try {
        const { building, block, floor, room, defaultCategory } = req.body;
        if (!building || !room) {
            return res.status(400).json({ error: 'Building and Room are required' });
        }
        const code = `QR-${building.substring(0, 3).toUpperCase()}-${room.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}`;
        const newSpot = {
            id: `spot-${uuidv4()}`,
            code,
            building,
            block: block || 'Main',
            floor: floor || '1st Floor',
            room,
            defaultCategory: defaultCategory || 'Infrastructure'
        };
        const saved = await (0, db_1.createCampusSpot)(newSpot);
        return res.status(201).json({ spot: saved });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to create campus QR spot' });
    }
});
