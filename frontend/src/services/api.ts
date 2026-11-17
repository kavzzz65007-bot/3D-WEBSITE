import {
  User,
  Complaint,
  AnalyticsData,
  CampusSpotQR,
  NotificationItem,
  AIDuplicateCheckResult,
  AIPriorityAnalysis,
  ComplaintStatus,
  ComplaintPriority
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('fmc_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(data: Partial<User> & { password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async demoLogin(role: 'student' | 'admin' | 'staff'): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getStaff(): Promise<{ staff: User[] }> {
    const res = await fetch(`${API_BASE}/auth/staff`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Complaints
  async getComplaints(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    myComplaints?: boolean;
    userId?: string;
  }): Promise<{ complaints: Complaint[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.myComplaints) params.set('myComplaints', 'true');
    if (filters?.userId) params.set('userId', filters.userId);

    const res = await fetch(`${API_BASE}/complaints?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getComplaintById(id: string): Promise<{ complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async checkDuplicate(data: {
    title: string;
    description: string;
    category: string;
    location: any;
  }): Promise<AIDuplicateCheckResult> {
    const res = await fetch(`${API_BASE}/complaints/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async checkPriority(data: {
    title: string;
    description: string;
    category: string;
    locationSummary?: string;
  }): Promise<AIPriorityAnalysis> {
    const res = await fetch(`${API_BASE}/complaints/check-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async createComplaint(data: any): Promise<{ complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async toggleUpvote(id: string): Promise<{ upvotes: number; hasUpvoted: boolean }> {
    const res = await fetch(`${API_BASE}/complaints/${id}/upvote`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateStatus(id: string, status: ComplaintStatus, note?: string): Promise<{ complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, note })
    });
    return handleResponse(res);
  },

  async assignTechnician(id: string, data: {
    technicianId: string;
    technicianName: string;
    department: string;
    phone?: string;
    note?: string;
  }): Promise<{ complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async resolveComplaint(id: string, data: {
    note: string;
    imageUrl?: string;
    satisfactionRating?: number;
  }): Promise<{ complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async addComment(id: string, text: string): Promise<{ comment: any; complaint: Complaint }> {
    const res = await fetch(`${API_BASE}/complaints/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text })
    });
    return handleResponse(res);
  },

  // QR
  async getCampusSpots(): Promise<{ spots: CampusSpotQR[] }> {
    const res = await fetch(`${API_BASE}/qr/spots`);
    return handleResponse(res);
  },

  async lookupSpot(code: string): Promise<{ spot: CampusSpotQR }> {
    const res = await fetch(`${API_BASE}/qr/spot/${code}`);
    return handleResponse(res);
  },

  async createSpot(data: Partial<CampusSpotQR>): Promise<{ spot: CampusSpotQR }> {
    const res = await fetch(`${API_BASE}/qr/spots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() }
    });
  }
};
