export type UserRole = 'student' | 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export type ComplaintCategory = 
  | 'Electrical'
  | 'Plumbing'
  | 'Infrastructure'
  | 'Classroom & Labs'
  | 'Cleanliness & Sanitation'
  | 'Internet & IT'
  | 'Safety & Security'
  | 'Hostel & Mess'
  | 'Other';

export type ComplaintPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus = 
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export interface LocationInfo {
  building: string;
  block?: string;
  floor?: string;
  room?: string;
  areaDescription?: string;
  latitude?: number;
  longitude?: number;
  qrCodeId?: string;
}

export interface ComplaintTimelineEntry {
  id: string;
  status: ComplaintStatus;
  note: string;
  updatedBy: string;
  updatedByRole: UserRole;
  timestamp: string;
}

export interface AIDuplicateCheckResult {
  isDuplicate: boolean;
  confidenceScore: number;
  matchedComplaintId?: string;
  matchedTitle?: string;
  explanation: string;
}

export interface AIPriorityAnalysis {
  priority: ComplaintPriority;
  confidenceScore: number;
  slaHours: number;
  urgencySignals: string[];
  suggestedDepartment: string;
  reasoning: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: LocationInfo;
  imageUrl?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  aiPriorityAnalysis: AIPriorityAnalysis;
  aiDuplicateResult?: AIDuplicateCheckResult;
  assignedTo?: {
    id: string;
    name: string;
    department: string;
    phone?: string;
  };
  resolutionProof?: {
    note: string;
    imageUrl?: string;
    resolvedAt: string;
    resolvedBy: string;
    satisfactionRating?: number;
  };
  upvotes: number;
  upvotedBy: string[];
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  timeline: ComplaintTimelineEntry[];
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  complaintId?: string;
  read: boolean;
  createdAt: string;
}

export interface CampusSpotQR {
  id: string;
  code: string;
  building: string;
  block: string;
  floor: string;
  room: string;
  defaultCategory: ComplaintCategory;
  qrDataUrl?: string;
}

export interface AnalyticsData {
  summary: {
    total: number;
    resolved: number;
    inProgress: number;
    pending: number;
    critical: number;
    resolutionRate: number;
    avgResolutionHours: number;
  };
  categoryStats: Array<{
    category: string;
    count: number;
    resolved: number;
    percentage: number;
  }>;
  priorityCounts: Record<ComplaintPriority, number>;
  hotspots: Array<{
    building: string;
    totalIssues: number;
    criticalIssues: number;
    resolvedIssues: number;
    riskLevel: 'High' | 'Medium' | 'Low';
  }>;
  trend: Array<{
    day: string;
    reported: number;
    resolved: number;
  }>;
}
