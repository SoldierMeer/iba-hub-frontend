'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import Link from 'next/link';
import UserProfileModal from '@/components/UserProfileModal';
import { 
  ShieldAlert, Clock, CheckCircle, AlertCircle, Search, 
  FileText, AlertTriangle, CheckCircle2, XCircle, FileIcon, Eye, Maximize, Minimize, ExternalLink, Download, RefreshCw, Presentation, Users, Megaphone, Trash2, Plus, Flag, Image as ImageIcon // 🚀 ADDED ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { optimizeImage } from '@/lib/cloudinary';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(''); 
  
  const [activeTab, setActiveTab] = useState<'voice-approvals' | 'resource-approvals' | 'voice-management' | 'user-management' | 'announcements' | 'reports'>('voice-approvals');
  
  const [pendingComplaints, setPendingComplaints] = useState<any[]>([]);
  const [pendingResources, setPendingResources] = useState<any[]>([]);
  const [activeComplaints, setActiveComplaints] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]); 
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const refreshAdminData = async (isManual = true, role = currentUserRole) => {
    if (isManual) setIsRefreshing(true);
    try {
      const pendingRes = await api.get('/admin/pending');
      setPendingResources(pendingRes.data.data.resources || []);
      setPendingComplaints(pendingRes.data.data.complaints || []);

      const compRes = await api.get('/complaints');
      const sortedComplaints = compRes.data.data.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActiveComplaints(sortedComplaints);

      const annRes = await api.get('/announcements');
      setAnnouncementsList(annRes.data.data || []);

      if (role === 'admin') {
        const usersRes = await api.get('/admin/users');
        setUsersList(usersRes.data.data || []);
        
        try {
          const reportsRes = await api.get('/admin/reports');
          setReportsList(reportsRes.data.data || []);
        } catch (e) { console.error("Failed to fetch reports"); }
      }

      if (isManual) toast.success('Dashboard synced successfully.');
    } catch (error) {
      if (isManual) toast.error('Failed to sync data');
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const userRes = await api.get('/users/me');
        const userData = userRes.data?.data || userRes.data?.user || userRes.data;

        if (userData?.role !== 'admin' && userData?.role !== 'moderator') {
          toast.error("Access Denied: Admins only.");
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        setCurrentUserId(userData._id); 
        setCurrentUserRole(userData.role); 

        await refreshAdminData(false, userData.role); 
      } catch (error) {
        toast.error("Authentication failed.");
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  const handleResolveReport = async (reportId: string) => {
    if (!window.confirm("Mark this report as reviewed/resolved? It will be removed from this list.")) return;
    try {
      await api.put(`/admin/reports/${reportId}/resolve`);
      setReportsList(prev => prev.filter(r => r._id !== reportId));
      toast.success("Report marked as resolved.");
    } catch (error) {
      toast.error("Failed to resolve report.");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncementsList(prev => prev.filter(a => a._id !== id));
      toast.success("Announcement deleted successfully");
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const previousUsers = [...usersList];
    setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role successfully updated to ${newRole}`);
    } catch (error: any) {
      setUsersList(previousUsers); 
      toast.error(error.response?.data?.message || "Failed to update user role");
    }
  };

  const handleModerateComplaint = async (id: string, action: 'approved' | 'rejected') => {
    const targetComplaint = pendingComplaints.find(c => c._id === id);
    setPendingComplaints(prev => prev.filter(c => c._id !== id));
    if (action === 'approved' && targetComplaint) {
      setActiveComplaints(prev => [{ ...targetComplaint, status: 'Pending' }, ...prev]);
    }
    try {
      await api.put(`/admin/complaints/${id}/moderate`, { action });
      toast.success(`Complaint ${action}!`);
    } catch (error: any) {
      toast.error('Network error. Reverting...');
      setPendingComplaints(prev => [targetComplaint, ...prev]);
      if (action === 'approved') setActiveComplaints(prev => prev.filter(c => c._id !== id));
    }
  };

  const handleModerateResource = async (id: string, action: 'approved' | 'rejected') => {
    const targetResource = pendingResources.find(r => r._id === id);
    setPendingResources(prev => prev.filter(r => r._id !== id));
    try {
      await api.put(`/admin/resources/${id}/moderate`, { action });
      toast.success(`Resource ${action}!`);
    } catch (error: any) {
      toast.error('Network error. Reverting...');
      setPendingResources(prev => [targetResource, ...prev]);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    const previousState = [...activeComplaints];
    setActiveComplaints(prev => prev.map(c => c._id === complaintId ? { ...c, status: newStatus } : c));
    try {
      await api.put(`/complaints/${complaintId}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status. Reverting...");
      setActiveComplaints(previousState);
    }
  };

  const handlePreview = (resource: any) => setPreviewResource(resource);

  const handleForceDownload = async (resource: any) => {
    const fileExt = resource.fileType?.toLowerCase() === 'ppt' ? 'PPT' : 'ZIP';
    const loadingToast = toast.loading(`Downloading ${fileExt}...`);
    try {
      const response = await axios.get(resource.fileUrl, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let safeName = resource.fileName || `${resource.title.replace(/\s+/g, '_')}`;
      const targetExt = fileExt === 'PPT' ? '.pptx' : '.zip';
      if (!safeName.toLowerCase().includes('.')) safeName += targetExt;
      link.setAttribute('download', safeName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download complete!', { id: loadingToast });
    } catch (error) {
      console.error("Download failed:", error);
      toast.error('Download failed. Opening raw file...', { id: loadingToast });
      window.open(resource.fileUrl, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Verifying security credentials...</div>;
  if (!isAdmin) return null; 

  const filteredActiveComplaints = activeComplaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPendingResources = pendingResources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.uploader?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPendingComplaints = pendingComplaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUsers = usersList.filter(u => 
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredReports = reportsList.filter(r => 
    r.reportedUser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportedUser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reporter?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tablePendingCount = activeComplaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = activeComplaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = activeComplaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        userId={selectedUserId} 
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-red-100 rounded-xl sm:rounded-2xl text-red-600 shrink-0">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Platform moderation and ticket management.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:border-l-4 border-l-indigo-500">
          <div className="p-2 sm:p-3 bg-indigo-50 rounded-lg sm:rounded-full text-indigo-500 shrink-0"><FileText className="w-5 h-5 sm:w-6 sm:h-6"/></div>
          <div><p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Resources to Review</p><h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{pendingResources.length}</h3></div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:border-l-4 border-l-orange-500">
          <div className="p-2 sm:p-3 bg-orange-50 rounded-lg sm:rounded-full text-orange-500 shrink-0"><Clock className="w-5 h-5 sm:w-6 sm:h-6"/></div>
          <div><p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Unresolved Tickets</p><h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{tablePendingCount}</h3></div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:border-l-4 border-l-blue-500">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-full text-blue-500 shrink-0"><AlertCircle className="w-5 h-5 sm:w-6 sm:h-6"/></div>
          <div><p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</p><h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{inProgressCount}</h3></div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:border-l-4 border-l-emerald-500">
          <div className="p-2 sm:p-3 bg-emerald-50 rounded-lg sm:rounded-full text-emerald-500 shrink-0"><CheckCircle className="w-5 h-5 sm:w-6 sm:h-6"/></div>
          <div><p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</p><h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{resolvedCount}</h3></div>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 mb-6 border-b border-slate-200 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button 
          onClick={() => setActiveTab('voice-approvals')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'voice-approvals' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Voice Approvals
          {pendingComplaints.length > 0 && <span className="ml-1 sm:ml-2 bg-orange-500 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">{pendingComplaints.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('resource-approvals')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'resource-approvals' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Resource Approvals
          {pendingResources.length > 0 && <span className="ml-1 sm:ml-2 bg-indigo-600 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">{pendingResources.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('voice-management')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'voice-management' ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Manage Tickets
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'announcements' ? 'bg-pink-50 text-pink-700 border border-pink-200 shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Announcements
        </button>

        {currentUserRole === 'admin' && (
          <>
            <button 
              onClick={() => setActiveTab('user-management')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'user-management' ? 'bg-indigo-600 text-white border border-indigo-600 shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> User Management
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${activeTab === 'reports' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> User Reports
              {reportsList.length > 0 && <span className="ml-1 sm:ml-2 bg-red-600 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full">{reportsList.length}</span>}
            </button>
          </>
        )}
        
        {/* 🚀 FIXED: Added ml-auto to push refresh button to the far right! */}
        <button
          onClick={() => refreshAdminData(true)}
          disabled={isRefreshing}
          className="ml-auto w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> <span className="sm:hidden">Refresh Data</span>
        </button>
      </div>
      

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            {activeTab === 'voice-approvals' && 'Pending Complaints (Awaiting Approval)'}
            {activeTab === 'resource-approvals' && 'Pending Resources (Awaiting Approval)'}
            {activeTab === 'voice-management' && 'Active IBA Voice Tickets'}
            {activeTab === 'announcements' && 'Platform Announcements'}
            {activeTab === 'user-management' && currentUserRole === 'admin' && 'Platform User Management'}
            {activeTab === 'reports' && currentUserRole === 'admin' && 'Moderation: Reported Users'}
          </h2>
          {activeTab !== 'announcements' && (
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 outline-none"
              />
            </div>
          )}
        </div>

        {activeTab === 'voice-approvals' && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            {filteredPendingComplaints.length === 0 ? (
               <div className="p-12 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">No pending complaints to review.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPendingComplaints.map(complaint => (
                  <div key={complaint._id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0"><AlertTriangle className="w-5 h-5"/></div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug">{complaint.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold bg-slate-100 inline-block px-2 py-0.5 mt-1.5 rounded uppercase tracking-wider">{complaint.category || 'General'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs space-y-2 flex-1 border border-slate-100">
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Author:</span> <span className="font-bold text-slate-700">{complaint.isAnonymous ? 'Anonymous' : `${complaint.author?.firstName} ${complaint.author?.lastName}`}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Date:</span> <span className="font-bold text-slate-700">{new Date(complaint.createdAt).toLocaleDateString()}</span></p>
                      <div className="pt-2 mt-2 border-t border-slate-200 text-slate-600 font-medium line-clamp-4 leading-relaxed bg-white p-2 rounded-lg italic">"{complaint.description}"</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleModerateComplaint(complaint._id, 'approved')}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                         <CheckCircle2 className="w-3.5 h-3.5"/> Approve
                      </button>
                      <button 
                        onClick={() => handleModerateComplaint(complaint._id, 'rejected')}
                        className="flex-1 bg-red-50 hover:bg-red-500 hover:text-white text-red-700 border border-red-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                         <XCircle className="w-3.5 h-3.5"/> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resource-approvals' && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            {filteredPendingResources.length === 0 ? (
               <div className="p-12 text-center text-sm font-medium text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">No pending resources to review.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredPendingResources.map(resource => (
                  <div key={resource._id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0"><FileIcon className="w-5 h-5"/></div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug">{resource.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold bg-slate-100 inline-block px-2 py-0.5 mt-1.5 rounded uppercase tracking-wider">{resource.courseCode}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs space-y-2 flex-1 border border-slate-100">
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Uploader:</span> <span className="font-bold text-slate-700">{resource.uploader?.firstName} {resource.uploader?.lastName}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Format:</span> <span className="font-bold text-slate-700 uppercase">{resource.fileType}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500 font-medium">Size:</span> <span className="font-bold text-slate-700">{resource.fileSize}</span></p>
                      <div className="pt-2 mt-2 border-t border-slate-200 text-slate-600 italic line-clamp-2 leading-relaxed">"{resource.description}"</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {resource.fileType?.toLowerCase() === 'link' ? (
                        <button 
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                          className="flex-1 bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                           <ExternalLink className="w-3.5 h-3.5"/> Open Link
                        </button>
                      ) : (resource.fileType?.toLowerCase() === 'zip' || resource.fileType?.toLowerCase() === 'ppt' || resource.fileType?.toLowerCase() === 'txt') ? (
                        <button 
                          onClick={() => handleForceDownload(resource)}
                          className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                           <Download className="w-3.5 h-3.5"/> Review {resource.fileType}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handlePreview(resource)}
                          className="flex-1 bg-slate-50 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                           <Eye className="w-3.5 h-3.5"/> Preview
                        </button>
                      )}

                      <button 
                        onClick={() => handleModerateResource(resource._id, 'approved')}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 border border-emerald-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                         <CheckCircle2 className="w-3.5 h-3.5"/> Approve
                      </button>
                      <button 
                        onClick={() => handleModerateResource(resource._id, 'rejected')}
                        className="w-10 sm:w-auto sm:flex-1 bg-red-50 hover:bg-red-500 hover:text-white text-red-700 border border-red-200 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-colors shrink-0"
                        title="Reject Resource"
                      >
                         <XCircle className="w-3.5 h-3.5"/> <span className="hidden sm:inline ml-1.5">Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'voice-management' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Issue Title</th>
                  <th className="p-4 font-bold">Author</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-center">Upvotes</th>
                  <th className="p-4 font-bold">Resolution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActiveComplaints.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No active tickets found.</td></tr>
                ) : (
                  filteredActiveComplaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{complaint.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{complaint.category || 'General'}</p>
                      </td>
                      <td className="p-4 text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                        {complaint.isAnonymous ? 'Anonymous' : `${complaint.author?.firstName} ${complaint.author?.lastName}`}
                      </td>
                      <td className="p-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs sm:text-sm font-bold text-slate-700 text-center">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">{complaint.upvotes?.length || 0}</span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors focus:outline-none outline-none ${
                            complaint.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-300' :
                            complaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <div className="flex justify-end mb-6">
              <Link 
                href="/admin/announcements" 
                className="w-full sm:w-auto bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Post New Announcement
              </Link>
            </div>
            
            <div className="space-y-4">
              {announcementsList.length === 0 ? (
                <div className="text-center py-16 text-sm font-medium text-slate-500 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                  No active announcements. Broadcast a message to the students!
                </div>
              ) : (
                announcementsList.map(ann => (
                  <div key={ann._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          ann.priority === 'Urgent' ? 'bg-red-50 text-red-600 border border-red-100' : 
                          ann.priority === 'Department' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                          'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {ann.priority || 'General'}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400">
                          {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">{ann.message}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnnouncement(ann._id)}
                      className="w-full sm:w-auto py-2 sm:py-0 sm:p-2.5 bg-red-50 sm:bg-transparent text-red-600 sm:text-slate-400 sm:hover:bg-red-50 sm:hover:text-red-600 rounded-xl transition-colors border border-red-100 sm:border-transparent sm:hover:border-red-100 shrink-0 flex items-center justify-center gap-2 text-xs font-bold"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'user-management' && currentUserRole === 'admin' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">User</th>
                  <th className="p-4 font-bold">Department</th>
                  <th className="p-4 font-bold">Joined Date</th>
                  <th className="p-4 font-bold text-right">Platform Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-sm font-medium text-slate-500">No users found matching your search.</td></tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-slate-200 shadow-sm shrink-0">
                          <AvatarImage src={optimizeImage(user.avatarUrl, 100, 100)} />
                          <AvatarFallback className="text-[12px] font-bold bg-indigo-50 text-indigo-700">
                            {user.firstName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4 text-xs sm:text-sm font-bold text-slate-600">
                        {user.department || 'Not Specified'}
                      </td>
                      <td className="p-4 text-xs sm:text-sm font-semibold text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <select 
                          value={user.role || 'student'}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={user._id === currentUserId}
                          className={`text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors outline-none uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300' :
                            user.role === 'moderator' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300' :
                            'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <option value="student">Student</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && currentUserRole === 'admin' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Reported User</th>
                  <th className="p-4 font-bold">Reported By</th>
                  <th className="p-4 font-bold">Reason & Details</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-sm font-medium text-slate-500">No active user reports to moderate.</td></tr>
                ) : (
                  filteredReports.map((report: any) => (
                    <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                      
                      <td className="p-4">
                        <div 
                          className="flex items-center gap-3 cursor-pointer group w-max"
                          onClick={() => setSelectedUserId(report.reportedUser?._id)}
                        >
                          <Avatar className="w-8 h-8 border border-red-200 shadow-sm shrink-0 group-hover:ring-2 ring-red-400 ring-offset-1 transition-all">
                            <AvatarImage src={optimizeImage(report.reportedUser?.avatarUrl, 100, 100)}/>
                            <AvatarFallback className="text-[10px] font-bold bg-red-50 text-red-700">
                              {report.reportedUser?.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-red-600 truncate group-hover:underline">{report.reportedUser?.firstName} {report.reportedUser?.lastName}</p>
                            <p className="text-[10px] font-semibold text-slate-500 truncate">ID: {report.reportedUser?._id?.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                         <p 
                           className="text-xs font-bold text-slate-800 cursor-pointer hover:text-indigo-600 hover:underline transition-colors w-max"
                           onClick={() => setSelectedUserId(report.reporter?._id)}
                         >
                           {report.reporter?.firstName} {report.reporter?.lastName}
                         </p>
                      </td>
                      
                      {/* 🚀 ADDED EVIDENCE VIEW BUTTON HERE */}
                      <td className="p-4 text-xs text-slate-700 font-medium max-w-xs">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg leading-relaxed mb-2">
                          "{report.reason}"
                        </div>
                        {report.evidenceUrl && (
                          <button 
                            onClick={() => handlePreview({
                              fileType: 'image',
                              fileUrl: optimizeImage(report.evidenceUrl, 1200, 1200), // Huge preview, but auto-compressed
                              title: `Evidence vs ${report.reportedUser?.firstName}`,
                              fileName: 'attached_screenshot.jpg'
                            })}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-100 w-max shadow-sm"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> View Attached Evidence
                          </button>
                        )}
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleResolveReport(report._id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      <Dialog 
        open={!!previewResource} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewResource(null);
            setIsFullscreen(false); 
          }
        }}
      >
        <DialogContent 
          className={`p-0 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
            isFullscreen 
              ? '!max-w-none !w-screen !h-screen !m-0 !rounded-none !border-0' 
              : 'w-[95vw] !max-w-5xl h-[85vh] rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-2xl'
          }`}
        >
          <DialogHeader className="p-3 sm:p-4 border-b border-slate-100 bg-white shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-between pr-6 sm:pr-8">
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  {previewResource?.fileType?.toLowerCase() === 'ppt' ? <Presentation className="w-4 h-4 sm:w-5 sm:h-5" /> : previewResource?.fileType?.toLowerCase().includes('image') ? <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black leading-none truncate">{previewResource?.title}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 sm:mt-1 truncate">{previewResource?.fileName}</p>
                </div>
              </div>

              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden sm:flex p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors items-center gap-2 text-sm font-bold border border-slate-200 shrink-0"
              >
                {isFullscreen ? (
                  <><Minimize className="w-4 h-4" /> Exit Fullscreen</>
                ) : (
                  <><Maximize className="w-4 h-4" /> Maximize</>
                )}
              </button>

            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 bg-slate-100 relative">
            {previewResource?.fileType?.toLowerCase().includes('image') ? (
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-6">
                <img 
                  src={previewResource.fileUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg sm:rounded-xl shadow-sm" 
                />
              </div>
            ) : previewResource?.fileType?.toLowerCase() === 'ppt' ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewResource?.fileUrl || '')}`}
                className="w-full h-full border-0"
                title="PowerPoint Preview"
              />
            ) : (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewResource?.fileUrl || '')}&embedded=true`}
                className="w-full h-full border-0"
                title="Document Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}