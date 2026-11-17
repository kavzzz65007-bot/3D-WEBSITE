import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  ThumbsUp, 
  Compass, 
  Loader2, 
  Building, 
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ComplaintCategory, AIDuplicateCheckResult, AIPriorityAnalysis, LocationInfo } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface ComplaintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintCreated: () => void;
  initialLocation?: LocationInfo;
  initialCategory?: ComplaintCategory;
  onViewExistingComplaint?: (id: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Electrical',
  'Plumbing',
  'Classroom & Labs',
  'Infrastructure',
  'Cleanliness & Sanitation',
  'Internet & IT',
  'Safety & Security',
  'Hostel & Mess',
  'Other'
];

const SAMPLE_CAMPUS_IMAGES = [
  { label: 'Electrical Conduit', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80' },
  { label: 'Lab Equipment', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
  { label: 'Water Dispenser', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80' },
  { label: 'Wi-Fi Router', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80' }
];

export const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({
  isOpen,
  onClose,
  onComplaintCreated,
  initialLocation,
  initialCategory,
  onViewExistingComplaint
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>(initialCategory || 'Electrical');
  
  // Location
  const [building, setBuilding] = useState(initialLocation?.building || 'Engineering Block A');
  const [block, setBlock] = useState(initialLocation?.block || 'Wing A');
  const [floor, setFloor] = useState(initialLocation?.floor || '2nd Floor');
  const [room, setRoom] = useState(initialLocation?.room || 'Room 204');
  const [latitude, setLatitude] = useState<number | undefined>(initialLocation?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialLocation?.longitude);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Photo
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');

  // AI live checks
  const [duplicateCheck, setDuplicateCheck] = useState<AIDuplicateCheckResult | null>(null);
  const [priorityAnalysis, setPriorityAnalysis] = useState<AIPriorityAnalysis | null>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync initial location if passed from QR scan
  useEffect(() => {
    if (initialLocation) {
      if (initialLocation.building) setBuilding(initialLocation.building);
      if (initialLocation.block) setBlock(initialLocation.block);
      if (initialLocation.floor) setFloor(initialLocation.floor);
      if (initialLocation.room) setRoom(initialLocation.room);
    }
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialLocation, initialCategory]);

  // Debounced Live AI Duplicate & Priority Check
  useEffect(() => {
    if (!title || title.length < 5) {
      setDuplicateCheck(null);
      setPriorityAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingAI(true);
      try {
        const [dupRes, prioRes] = await Promise.all([
          api.checkDuplicate({
            title,
            description,
            category,
            location: { building, block, floor, room }
          }),
          api.checkPriority({
            title,
            description,
            category,
            locationSummary: `${building} ${room}`
          })
        ]);
        setDuplicateCheck(dupRes);
        setPriorityAnalysis(prioRes);
      } catch (e) {
        // ignore
      } finally {
        setIsCheckingAI(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, category, building, room]);

  // Capture GPS
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(5)));
        setLongitude(Number(pos.coords.longitude.toFixed(5)));
        setGettingLocation(false);
        showToast('Campus GPS coordinates logged successfully', 'success');
      },
      () => {
        // Simulated campus coords fallback
        setLatitude(12.9716);
        setLongitude(77.5946);
        setGettingLocation(false);
        showToast('Auto-tagged with Central Campus coordinates', 'info');
      },
      { timeout: 7000 }
    );
  };

  // Image Upload handler
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !building) {
      showToast('Please fill out all required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await api.createComplaint({
        title,
        description,
        category,
        location: {
          building,
          block,
          floor,
          room,
          latitude,
          longitude
        },
        imageUrl: imageUrl || imagePreview || undefined
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast('Complaint submitted! Routed to maintenance team.', 'success');
      onComplaintCreated();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setImagePreview('');
      setImageUrl('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit complaint', 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Log Campus Problem
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI analyzes duplicate reports and assigns priority automatically
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* AI DUPLICATE ALERT BANNER */}
          {duplicateCheck?.isDuplicate && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Potential Duplicate Issue Detected ({duplicateCheck.confidenceScore}% match)
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1">
                    {duplicateCheck.explanation}
                  </p>
                  
                  {duplicateCheck.matchedComplaintId && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onViewExistingComplaint && duplicateCheck.matchedComplaintId) {
                            onViewExistingComplaint(duplicateCheck.matchedComplaintId);
                            onClose();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm flex items-center gap-1.5"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        View Existing &amp; Upvote (+1)
                      </button>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        Or continue submitting if yours is distinct.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI PRIORITY PREVIEW PILL */}
          {priorityAnalysis && (
            <div className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">AI Priority:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  priorityAnalysis.priority === 'Critical' ? 'bg-rose-500 text-white' :
                  priorityAnalysis.priority === 'High' ? 'bg-amber-500 text-white' :
                  priorityAnalysis.priority === 'Medium' ? 'bg-blue-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>
                  {priorityAnalysis.priority} ({priorityAnalysis.slaHours}h SLA)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Routing: {priorityAnalysis.suggestedDepartment.split(' ')[0]}
              </span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Water leaking in 2nd Floor Chemistry Lab / Sparking wire in Block A"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Problem Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location Fields */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location Details
              </span>

              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={gettingLocation}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {gettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                {latitude ? `GPS Tagged (${latitude}, ${longitude})` : 'Auto-Detect GPS'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Building / Complex *
                </label>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="e.g., Engineering Block A"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Room / Lab / Facility Spot *
                </label>
                <input
                  type="text"
                  required
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., Room 204 / AI Research Lab"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Block / Wing
                </label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder="e.g., Wing B / North Tower"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g., 2nd Floor / Ground Floor"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description &amp; Observed Impact *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about the malfunction or hazard so technicians bring the correct equipment..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Photo Evidence (Optional but recommended)</span>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => { setImagePreview(''); setImageUrl(''); }}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48">
                <img
                  src={imagePreview}
                  alt="Complaint Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                  <Camera className="w-7 h-7 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to upload photo or take picture
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, WebP up to 15MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>

                {/* Quick sample photo selector for testing convenience */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Quick test samples:</span>
                  {SAMPLE_CAMPUS_IMAGES.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImagePreview(s.url);
                        setImageUrl(s.url);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 border border-slate-200 dark:border-slate-700"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
