import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { getAllCampusSpots, findSpotByCode, createCampusSpot } from '../services/db';
import { CampusSpotQR, ComplaintCategory } from '../types';
import { authMiddleware, AuthRequest } from './auth';

const uuidv4 = () => crypto.randomUUID();

export const qrRouter = Router();

// 1. Get all predefined campus spots with visual QR codes
qrRouter.get('/spots', async (_req: Request, res: Response) => {
  try {
    const spots = await getAllCampusSpots();
    
    // Generate QR Data URLs for spots if not cached
    const enrichedSpots = await Promise.all(
      spots.map(async (spot) => {
        try {
          const payload = JSON.stringify({
            code: spot.code,
            building: spot.building,
            block: spot.block,
            floor: spot.floor,
            room: spot.room,
            category: spot.defaultCategory
          });
          const qrDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            margin: 2,
            color: {
              dark: '#1e293b',
              light: '#ffffff'
            }
          });
          return { ...spot, qrDataUrl };
        } catch (e) {
          return spot;
        }
      })
    );

    return res.json({ spots: enrichedSpots });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch campus QR spots' });
  }
});

// 2. Lookup spot by QR code string
qrRouter.get('/spot/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const spot = await findSpotByCode(code);
    if (!spot) {
      return res.status(404).json({ error: `No campus location registered for code "${code}"` });
    }
    return res.json({ spot });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to lookup spot' });
  }
});

// 3. Admin: Generate new campus QR Spot
qrRouter.post('/spots', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { building, block, floor, room, defaultCategory } = req.body;
    if (!building || !room) {
      return res.status(400).json({ error: 'Building and Room are required' });
    }

    const code = `QR-${building.substring(0, 3).toUpperCase()}-${room.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}`;

    const newSpot: CampusSpotQR = {
      id: `spot-${uuidv4()}`,
      code,
      building,
      block: block || 'Main',
      floor: floor || '1st Floor',
      room,
      defaultCategory: (defaultCategory as ComplaintCategory) || 'Infrastructure'
    };

    const saved = await createCampusSpot(newSpot);
    return res.status(201).json({ spot: saved });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create campus QR spot' });
  }
});
