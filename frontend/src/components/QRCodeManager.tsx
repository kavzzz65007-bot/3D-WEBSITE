import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer, Plus, Building2, MapPin, Sparkles, Check } from 'lucide-react';
import { api } from '../services/api';
import { CampusSpotQR, ComplaintCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const QRCodeManager: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const [spots, setSpots] = useState<CampusSpotQR[]>([]);
  const [loading, setLoading] = useState(true);

  // New spot modal/inputs
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [building, setBuilding] = useState('');
  const [block, setBlock] = useState('Wing A');
  const [floor, setFloor] = useState('1st Floor');
  const [room, setRoom] = useState('');
  const [defaultCategory, setDefaultCategory] = useState<ComplaintCategory>('Infrastructure');
  const [saving, setSaving] = useState(false);

  const fetchSpots = async () => {
    try {
      const res = await api.getCampusSpots();
      setSpots(res.spots || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!building || !room) {
      showToast('Building and Room are required', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api.createSpot({
        building,
        block,
        floor,
        room,
        defaultCategory
      });
      showToast('New Campus Spot registered with QR Code!', 'success');
      setShowAddSpot(false);
      setBuilding('');
      setRoom('');
      fetchSpots();
    } catch (e: any) {
      showToast(e.message || 'Failed to create spot', 'alert');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (spot: CampusSpotQR) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Campus QR - ${spot.room}</title>
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
            .card { border: 3px solid #1e293b; border-radius: 20px; padding: 30px; max-width: 400px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 4px; color: #4f46e5; }
            p { font-size: 14px; color: #64748b; margin-top: 0; }
            img { width: 220px; height: 220px; margin: 20px 0; }
            .meta { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 8px; }
            .instruction { font-size: 12px; color: #059669; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>FixMyCampus</h1>
            <p>Smart Issue Reporting Terminal</p>
            <img src="${spot.qrDataUrl}" alt="${spot.code}" />
            <div class="meta">${spot.room}</div>
            <div>${spot.building} - ${spot.floor}</div>
            <div class="instruction">📷 Scan to Report Broken Equipment or Hazards</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-500" />
            Campus QR Facility Placards
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Printable physical QR codes for classrooms, laboratories, and hostel spots
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddSpot(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Register New Spot QR
          </button>
        )}
      </div>

      {/* Grid of Placards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.map((spot) => (
          <div
            key={spot.id}
            className="glass-card p-5 flex flex-col items-center text-center relative group hover:border-indigo-500/50 transition-all hover:shadow-lg"
          >
            {/* Spot Code Tag */}
            <div className="flex items-center justify-between w-full mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {spot.code}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {spot.defaultCategory}
              </span>
            </div>

            {/* QR Graphic */}
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 my-2">
              {spot.qrDataUrl ? (
                <img
                  src={spot.qrDataUrl}
                  alt={`QR for ${spot.room}`}
                  className="w-40 h-40 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-100">
                  <QrCode className="w-12 h-12 text-slate-400" />
                </div>
              )}
            </div>

            {/* Room & Building */}
            <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
              {spot.room}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {spot.building} • {spot.floor} ({spot.block})
            </p>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-2">
              <button
                onClick={() => handlePrint(spot)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Placard
              </button>

              {spot.qrDataUrl && (
                <a
                  href={spot.qrDataUrl}
                  download={`${spot.code}.png`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> PNG
                </a>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Register Spot Modal */}
      {showAddSpot && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Register Campus Facility Spot
            </h3>
            <form onSubmit={handleCreateSpot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Building Name *
                </label>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g. Mechanical Workshop Complex"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Room / Space Name *
                </label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. CNC Machine Room 104"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. Ground Floor"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Block / Wing
                  </label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Wing B"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSpot(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl"
                >
                  {saving ? 'Creating...' : 'Create QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
