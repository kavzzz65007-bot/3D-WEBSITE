import React, { useState, useEffect } from 'react';
import { X, QrCode, Sparkles, Building2, Check, ArrowRight, Zap } from 'lucide-react';
import { api } from '../services/api';
import { CampusSpotQR, LocationInfo, ComplaintCategory } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotScanned: (location: LocationInfo, defaultCategory?: ComplaintCategory) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSpotScanned
}) => {
  const [spots, setSpots] = useState<CampusSpotQR[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getCampusSpots()
        .then(res => setSpots(res.spots || []))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSelectSpot = (spot: CampusSpotQR) => {
    onSpotScanned({
      building: spot.building,
      block: spot.block,
      floor: spot.floor,
      room: spot.room,
      qrCodeId: spot.code
    }, spot.defaultCategory);
    onClose();
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.lookupSpot(manualCode.trim());
      if (res.spot) {
        handleSelectSpot(res.spot);
      } else {
        setErrorMsg('No campus location found for this code.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'QR Code lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Instant QR Issue Reporting
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan barcode tagged at classroom door or pick quick location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Animated Viewfinder Simulation */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800">
            {/* Corner targets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>
            
            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse"></div>

            <QrCode className="w-16 h-16 text-slate-700 animate-pulse-slow mb-2" />
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Optical QR Camera Sensor Active
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Point at campus room QR tag or select a pre-registered spot below
            </p>
          </div>

          {/* Quick-Pick Registered Campus Spots */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Select Pre-Tagged Campus Room</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto-fills form
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {spots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => handleSelectSpot(spot)}
                  className="p-3 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all group flex items-start justify-between"
                >
                  <div>
                    <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 mb-1">
                      {spot.code}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {spot.room}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {spot.building} ({spot.floor})
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all mt-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Code Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Or Enter Alphanumeric Spot Code:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. QR-ENG-304"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-mono"
              />
              <button
                type="submit"
                disabled={loading || !manualCode}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
              >
                Lookup
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errorMsg}</p>
            )}
          </form>

        </div>

      </div>
    </div>
  );
};
