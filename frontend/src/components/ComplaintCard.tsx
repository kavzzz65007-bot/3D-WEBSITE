import React from 'react';
import { 
  MapPin, 
  ThumbsUp, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Flame,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface ComplaintCardProps {
  complaint: Complaint;
  onSelect: (id: string) => void;
  onToggleUpvote: (id: string) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onSelect,
  onToggleUpvote
}) => {
  const { user } = useAuth();
  const hasUpvoted = user ? complaint.upvotedBy.includes(user.id) : false;

  const getPriorityBadge = (p: ComplaintPriority) => {
    switch (p) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-500" /> Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-500" /> High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (s: ComplaintStatus) => {
    switch (s) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
            <Clock className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            Assigned
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
            Under Review
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
            Submitted
          </span>
        );
    }
  };

  return (
    <div 
      onClick={() => onSelect(complaint.id)}
      className="glass-card p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        
        {/* Top Meta: Ticket ID & Status & Priority */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {complaint.ticketNumber}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {complaint.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {getPriorityBadge(complaint.priority)}
            {getStatusBadge(complaint.status)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 font-normal leading-relaxed">
          {complaint.description}
        </p>

        {/* Image thumbnail if attached */}
        {complaint.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden h-32 w-full bg-slate-100 dark:bg-slate-800">
            <img
              src={complaint.imageUrl}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* Location Pill */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate font-medium">
            {complaint.location.building} • {complaint.location.room || complaint.location.floor || 'General Area'}
          </span>
        </div>

        {/* AI Insight Pill */}
        {complaint.aiPriorityAnalysis && (
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-lg">
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="truncate">SLA: {complaint.aiPriorityAnalysis.slaHours}h target</span>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        
        {/* Upvote button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleUpvote(complaint.id);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
            hasUpvoted
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
          <span>{complaint.upvotes}</span>
          <span className="hidden sm:inline font-medium">Me Too</span>
        </button>

        {/* Comments count & View Details CTA */}
        <div className="flex items-center gap-3">
          {complaint.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {complaint.comments.length}
            </span>
          )}

          <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Details <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

      </div>

    </div>
  );
};
