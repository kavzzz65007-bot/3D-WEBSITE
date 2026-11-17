import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  ThumbsUp, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Send, 
  Wrench, 
  CheckCheck,
  Building,
  Calendar,
  Phone,
  FileCheck2,
  Camera,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Complaint, ComplaintStatus, UserRole } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface ComplaintDetailModalProps {
  complaintId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaintId,
  onClose,
  onUpdated
}) => {
  const { user, isAdmin, isStaff } = useAuth();
  const { showToast } = useNotifications();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Admin / Staff actions
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Technician assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Resolution modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchComplaint = async () => {
    if (!complaintId) return;
    try {
      const res = await api.getComplaintById(complaintId);
      setComplaint(res.complaint);
      setNewStatus(res.complaint.status);
    } catch (err: any) {
      showToast(err.message || 'Failed to load complaint', 'alert');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const handleToggleUpvote = async () => {
    if (!complaint) return;
    try {
      const res = await api.toggleUpvote(complaint.id);
      setComplaint(prev => {
        if (!prev) return null;
        const userId = user?.id || '';
        const upvoted = res.hasUpvoted;
        return {
          ...prev,
          upvotes: res.upvotes,
          upvotedBy: upvoted
            ? [...prev.upvotedBy, userId]
            : prev.upvotedBy.filter(id => id !== userId)
        };
      });
      onUpdated();
    } catch (e) {
      // ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await api.addComment(complaint.id, newComment);
      setComplaint(res.complaint);
      setNewComment('');
      showToast('Comment posted', 'info');
      onUpdated();
    } catch (e: any) {
      showToast(e.message || 'Failed to post comment', 'alert');
    } finally {
      setSendingComment(false);
    }
  };

  // Status Change
  const handleUpdateStatus = async () => {
    if (!complaint) return;
    setUpdatingStatus(true);
    try {
      const res = await api.updateStatus(complaint.id, newStatus, statusNote);
      setComplaint(res.complaint);
      setShowStatusModal(false);
      setStatusNote('');
      showToast(`Status updated to ${newStatus}`, 'success');
      onUpdated();
    } catch (e: any) {
      showToast(e.message || 'Status update failed', 'alert');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Open Assign Modal & load staff
  const handleOpenAssign = async () => {
    try {
      const res = await api.getStaff();
      setStaffList(res.staff || []);
      if (res.staff && res.staff.length > 0) {
        setSelectedStaffId(res.staff[0].id);
      }
      setShowAssignModal(true);
    } catch (e) {
      showToast('Could not load staff list', 'alert');
    }
  };

  const handleAssignTechnician = async () => {
    if (!complaint || !selectedStaffId) return;
    setAssigning(true);
    const targetStaff = staffList.find(s => s.id === selectedStaffId);
    if (!targetStaff) return;

    try {
      const res = await api.assignTechnician(complaint.id, {
        technicianId: targetStaff.id,
        technicianName: targetStaff.name,
        department: targetStaff.department || 'Maintenance',
        phone: targetStaff.phone,
        note: `Assigned directly by administrator ${user?.name}`
      });
      setComplaint(res.complaint);
      setShowAssignModal(false);
      showToast(`Assigned to ${targetStaff.name}`, 'success');
      onUpdated();
    } catch (e: any) {
      showToast(e.message || 'Assignment failed', 'alert');
    } finally {
      setAssigning(false);
    }
  };

  // Resolve with Proof
  const handleResolveComplaint = async () => {
    if (!complaint) return;
    setResolving(true);
    try {
      const res = await api.resolveComplaint(complaint.id, {
        note: resolveNote || 'Repairs completed and safety verified on-site.',
        imageUrl: resolvePhoto || undefined
      });
      setComplaint(res.complaint);
      setShowResolveModal(false);
      confetti({ particleCount: 70, spread: 60 });
      showToast('Complaint resolved with inspection proof!', 'success');
      onUpdated();
    } catch (e: any) {
      showToast(e.message || 'Resolution failed', 'alert');
    } finally {
      setResolving(false);
    }
  };

  if (!complaintId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {loading || !complaint ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs font-semibold">Loading ticket details...</p>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {complaint.ticketNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  complaint.priority === 'Critical' ? 'bg-rose-500 text-white' :
                  complaint.priority === 'High' ? 'bg-amber-500 text-white' :
                  complaint.priority === 'Medium' ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {complaint.priority} Priority
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {complaint.status}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Title & Metadata */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  {complaint.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Reported by <strong className="text-slate-800 dark:text-slate-200">{complaint.createdBy.name}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(complaint.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {complaint.category}
                  </span>
                </div>
              </div>

              {/* Photo Evidence if Present */}
              {complaint.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-h-72">
                  <img
                    src={complaint.imageUrl}
                    alt={complaint.title}
                    className="w-full h-72 object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Detailed Description
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  {complaint.description}
                </p>
              </div>

              {/* Location Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Physical Campus Location
                  </h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {complaint.location.building}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {complaint.location.room && `${complaint.location.room} • `}
                    {complaint.location.floor && `${complaint.location.floor} • `}
                    {complaint.location.block && `(${complaint.location.block})`}
                  </p>
                </div>
                {complaint.location.qrCodeId && (
                  <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    QR Tagged: {complaint.location.qrCodeId}
                  </span>
                )}
              </div>

              {/* AI Diagnostic Report Banner */}
              {complaint.aiPriorityAnalysis && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      AI Diagnostic Engine Evaluation
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      {complaint.aiPriorityAnalysis.confidenceScore}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {complaint.aiPriorityAnalysis.reasoning}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Target SLA:</span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      {complaint.aiPriorityAnalysis.slaHours} Hours
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400 ml-2">Department:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {complaint.aiPriorityAnalysis.suggestedDepartment}
                    </span>
                  </div>
                </div>
              )}

              {/* Technician Assigned Box */}
              {complaint.assignedTo ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Assigned Field Technician
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {complaint.assignedTo.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {complaint.assignedTo.department}
                      </p>
                    </div>
                  </div>
                  {complaint.assignedTo.phone && (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {complaint.assignedTo.phone}
                    </span>
                  )}
                </div>
              ) : (
                isAdmin && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        Technician Not Assigned
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Assign an electrician or plumber to begin physical inspection
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAssign}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm"
                    >
                      Assign Staff
                    </button>
                  </div>
                )
              )}

              {/* Resolution Inspection Proof (If Resolved) */}
              {complaint.resolutionProof && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Resolution Verification Proof
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {complaint.resolutionProof.note}
                  </p>
                  {complaint.resolutionProof.imageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-48">
                      <img
                        src={complaint.resolutionProof.imageUrl}
                        alt="Resolution Proof"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span>Verified by: <strong>{complaint.resolutionProof.resolvedBy}</strong></span>
                    <span>Resolved at: {new Date(complaint.resolutionProof.resolvedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Live Timeline Stepper */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Real-time Audit Timeline
                </h4>
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                  {complaint.timeline.map((entry, idx) => (
                    <div key={entry.id || idx} className="relative">
                      {/* Step circle */}
                      <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900" />
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {entry.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                          {entry.note}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Updated by {entry.updatedBy} ({entry.updatedByRole})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments / Discussion Thread */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Live Discussion &amp; Updates ({complaint.comments.length})
                </h4>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 mb-3">
                  {complaint.comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No comments yet. Post the first update.</p>
                  ) : (
                    complaint.comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {comm.userName}{' '}
                            <span className="text-[10px] text-indigo-500 font-semibold uppercase">
                              ({comm.userRole})
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{comm.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add comment form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a message or status note..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingComment || !newComment.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </div>

            </div>

            {/* Modal Bottom Actions Bar */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
              
              {/* Upvote */}
              <button
                onClick={handleToggleUpvote}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{complaint.upvotes} Upvotes</span>
              </button>

              {/* Admin / Staff Controls */}
              <div className="flex items-center gap-2">
                {(isAdmin || isStaff) && (
                  <>
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      Change Status
                    </button>

                    {isAdmin && (
                      <button
                        onClick={handleOpenAssign}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        {complaint.assignedTo ? 'Reassign Tech' : 'Assign Tech'}
                      </button>
                    )}

                    {complaint.status !== 'Resolved' && (
                      <button
                        onClick={() => setShowResolveModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4" /> Mark Resolved
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

            </div>
          </>
        )}

      </div>

      {/* Sub-Modal: Change Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Transition Status</h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Reason or status update note..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl"
              >
                {updatingStatus ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Assign Staff */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assign Technician</h3>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || s.role})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                disabled={assigning}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl"
              >
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Resolve with Proof */}
      {showResolveModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-500" /> Mark Ticket as Resolved
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attach technician inspection notes and proof of completed repair work.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Resolution Summary &amp; Safety Verification *
              </label>
              <textarea
                rows={3}
                required
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="e.g. Replaced MCB switch, tested circuit voltage, insulation verified..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Resolution Proof Photo URL
              </label>
              <input
                type="text"
                value={resolvePhoto}
                onChange={(e) => setResolvePhoto(e.target.value)}
                placeholder="https://... or sample URL"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveComplaint}
                disabled={resolving}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl"
              >
                {resolving ? 'Submitting...' : 'Complete & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
