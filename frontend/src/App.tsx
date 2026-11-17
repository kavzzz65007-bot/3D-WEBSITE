import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Flame, 
  Sparkles, 
  QrCode, 
  Layers, 
  ThumbsUp, 
  BarChart3, 
  CheckCircle2, 
  LayoutDashboard,
  Building2,
  TrendingUp,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SplineHeroSection } from './components/SplineHeroSection';
import { ComplaintCard } from './components/ComplaintCard';
import { ComplaintFormModal } from './components/ComplaintFormModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { QRScannerModal } from './components/QRScannerModal';
import { QRCodeManager } from './components/QRCodeManager';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuthModal } from './components/AuthModal';

import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationContext';
import { api } from './services/api';
import { Complaint, ComplaintCategory, LocationInfo } from './types';

const CATEGORIES: Array<{ label: string; value: string }> = [
  { label: 'All Issues', value: 'all' },
  { label: 'Electrical', value: 'Electrical' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Classrooms & Labs', value: 'Classroom & Labs' },
  { label: 'Infrastructure', value: 'Infrastructure' },
  { label: 'Internet & IT', value: 'Internet & IT' },
  { label: 'Safety & Security', value: 'Safety & Security' },
  { label: 'Hostel & Mess', value: 'Hostel & Mess' }
];

export const App: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  // Navigation
  const [activeTab, setActiveTab] = useState<'feed' | 'admin' | 'analytics' | 'qr'>('feed');

  // Complaints
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in-progress' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'upvotes' | 'newest' | 'critical'>('upvotes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyOnly, setShowMyOnly] = useState(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Location/Category pre-fill from QR Scanner
  const [prefilledLocation, setPrefilledLocation] = useState<LocationInfo | undefined>();
  const [prefilledCategory, setPrefilledCategory] = useState<ComplaintCategory | undefined>();

  // Fetch Complaints
  const fetchComplaints = async () => {
    try {
      const res = await api.getComplaints({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        myComplaints: showMyOnly,
        userId: user?.id
      });
      setComplaints(res.complaints || []);
    } catch (e: any) {
      // ignore
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedCategory, searchQuery, showMyOnly, user]);

  // Handle QR Scanned
  const handleSpotScanned = (loc: LocationInfo, defaultCat?: ComplaintCategory) => {
    setPrefilledLocation(loc);
    setPrefilledCategory(defaultCat);
    setShowReportModal(true);
    showToast(`Location pre-filled: ${loc.room} (${loc.building})`, 'success');
  };

  // Upvote toggle
  const handleToggleUpvote = async (id: string) => {
    if (!user) {
      setShowAuthModal(true);
      showToast('Please sign in to upvote issues', 'info');
      return;
    }
    try {
      const res = await api.toggleUpvote(id);
      setComplaints(prev => prev.map(c => {
        if (c.id === id) {
          const upvoted = res.hasUpvoted;
          return {
            ...c,
            upvotes: res.upvotes,
            upvotedBy: upvoted
              ? [...c.upvotedBy, user.id]
              : c.upvotedBy.filter(uid => uid !== user.id)
          };
        }
        return c;
      }));
    } catch (e) {
      // ignore
    }
  };

  // Filter & Sort
  const filteredComplaints = complaints
    .filter(c => {
      if (statusFilter === 'active') return c.status === 'Submitted' || c.status === 'Under Review';
      if (statusFilter === 'in-progress') return c.status === 'In Progress' || c.status === 'Assigned';
      if (statusFilter === 'resolved') return c.status === 'Resolved' || c.status === 'Closed';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'critical') {
        const order: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // KPI stats for Hero
  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const criticalCount = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved' && c.status !== 'Closed').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onSelectComplaint={(id) => setSelectedComplaintId(id)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Render Feed */}
        {activeTab === 'feed' && (
          <div>
            {/* 3D Spline Hero Section */}
            <SplineHeroSection
              onOpenReportModal={() => setShowReportModal(true)}
              onOpenQRScanner={() => setShowQRScanner(true)}
              totalComplaints={totalCount}
              resolvedComplaints={resolvedCount}
              criticalComplaints={criticalCount}
              splineSceneUrl="https://prod.spline.design/XXu4OLqSxdALqRgh/scene.splinecode"
            />

            {/* Complaints Feed Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
              
              {/* Controls Bar: Category Chips, Status Tabs, Search, Sort */}
              <div className="space-y-4">
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 max-w-md relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search complaints by title, room, or ticket..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    
                    {/* Status filter chips */}
                    <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          statusFilter === 'active' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Reported
                      </button>
                      <button
                        onClick={() => setStatusFilter('in-progress')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          statusFilter === 'in-progress' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => setStatusFilter('resolved')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          statusFilter === 'resolved' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Resolved
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="upvotes">Most Upvoted</option>
                        <option value="critical">Critical First</option>
                        <option value="newest">Newest First</option>
                      </select>
                    </div>

                    {/* My reports toggle */}
                    {user && (
                      <button
                        onClick={() => setShowMyOnly(!showMyOnly)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          showMyOnly
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        My Reports
                      </button>
                    )}

                  </div>
                </div>

                {/* Category Horizontal Scrolling Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedCategory === cat.value
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Complaints Grid */}
              {loadingComplaints ? (
                <div className="py-20 text-center text-xs text-slate-400">
                  Loading campus complaints...
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="glass-card py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No Complaints Matching Filter
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Everything in this category is currently operating smoothly or no records match your search.
                  </p>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    Report New Problem
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredComplaints.map((c) => (
                    <ComplaintCard
                      key={c.id}
                      complaint={c}
                      onSelect={(id) => setSelectedComplaintId(id)}
                      onToggleUpvote={handleToggleUpvote}
                    />
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Render Admin Dashboard */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AdminDashboard onSelectComplaint={(id) => setSelectedComplaintId(id)} />
          </div>
        )}

        {/* Render Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <AnalyticsDashboard />
          </div>
        )}

        {/* Render Campus QR Manager */}
        {activeTab === 'qr' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <QRCodeManager />
          </div>
        )}

      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              FixMyCampus
            </span>
            <span>• AI-Powered Campus Facility Management</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowQRScanner(true)} className="hover:underline">
              Room QR Scanner
            </button>
            <button onClick={() => setActiveTab('analytics')} className="hover:underline">
              SLA Telemetry
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
              v1.0.0 Online
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ComplaintFormModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setPrefilledLocation(undefined);
          setPrefilledCategory(undefined);
        }}
        onComplaintCreated={() => {
          fetchComplaints();
        }}
        initialLocation={prefilledLocation}
        initialCategory={prefilledCategory}
        onViewExistingComplaint={(id) => setSelectedComplaintId(id)}
      />

      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSpotScanned={handleSpotScanned}
      />

      <ComplaintDetailModal
        complaintId={selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
        onUpdated={() => fetchComplaints()}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

    </div>
  );
};

export default App;

