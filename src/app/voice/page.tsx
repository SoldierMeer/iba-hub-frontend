'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, X, MessageSquare, Clock, CheckCircle, 
  AlertCircle, Shield, ChevronUp, Lock,
  UploadCloud, ChevronDown, Heart, Trash2, Loader2 
} from 'lucide-react';
import UserProfileModal from '@/components/UserProfileModal'; 
import { useAuth } from '@/contexts/AuthContext'; 
import toast from 'react-hot-toast';
import { optimizeImage } from '@/lib/cloudinary';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  headline?: string;
  isAlumni?: boolean; 
}

interface Comment {
  _id: string;
  user: Author;
  text: string;
  upvotes?: string[];
  createdAt: string;
}

interface Complaint {
  _id: string;
  author: Author;
  title: string;
  description: string;
  category: string;
  department?: string;
  mediaUrl?: string;
  upvotes: string[];
  status: string;
  officialResponse?: string;
  comments: Comment[];
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string; 
}

export default function VoicePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [globalStats, setGlobalStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, anonymousPercent: 0, avgRes: '-' });
  
  // Pagination & Loading States
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('student');
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('Global');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🚀 FIX 1: Added filterDepartment state properly
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All'); 

  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const upvoteLocks = useRef<Set<string>>(new Set());
  
  const { requireAuth } = useAuth();



  // 1. Fetch Current User Once on Mount
  useEffect(() => {
    api.get('/users/me').then(userRes => {
      if (userRes && userRes.data) {
        const id = userRes.data?.data?._id || userRes.data?.user?._id || userRes.data?._id;
        const role = userRes.data?.data?.role || userRes.data?.user?.role || 'student';
        if (id) setCurrentUserId(id);
        setCurrentUserRole(role);
      }
    }).catch(() => {});
  }, []);

  // 2. Safe Fetch Function for "Load More"
  const fetchMoreComplaints = async (nextPage: number) => {
    setLoadingMore(true);
    try {
      const res = await api.get('/complaints', {
        params: {
          page: nextPage,
          limit: 10,
          category: filterType,
          status: filterStatus,
          department: filterDepartment
        }
      });
      setComplaints(prev => [...prev, ...res.data.data]);
      setHasMore(res.data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Failed to load more complaints', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 3. Trigger Fetch when Filters Change (Safe React 18 Pattern)
  useEffect(() => {
    let isMounted = true; // Tracks if the user is still on the page
    
    setPage(1); 
    setLoading(true);

    api.get('/complaints', {
      params: {
        page: 1,
        limit: 10,
        category: filterType,
        status: filterStatus,
        department: filterDepartment
      }
    }).then(res => {
      if (!isMounted) return; // If user navigated away, safely ignore the data
      
      setComplaints(res.data.data);
      if (res.data.stats) setGlobalStats(res.data.stats);
      setHasMore(res.data.pagination?.hasMore || false);
    }).catch(error => {
      if (isMounted) console.error('Failed to load complaints', error);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    // Cleanup function: runs automatically when you navigate to a different page
    return () => {
      isMounted = false; 
    };
  }, [filterType, filterStatus, filterDepartment]); 

  // 4. Handle "Load More" Click
  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMoreComplaints(nextPage);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category) return;

    setIsSubmitting(true);
    try {
      await api.post('/complaints', {
        title, description, category, department, mediaUrl, isAnonymous
      });
      
      // 🚀 THE FIX: We removed the code that instantly forces it into the feed.
      // Instead, we show a success message!
      toast.success("Grievance submitted successfully! It is now pending Admin approval.");
      
      // Reset the form
      setTitle(''); setDescription(''); setCategory(''); 
      setDepartment('Global'); 
      setMediaUrl(null); setIsAnonymous(false);
      setIsSubmitModalOpen(false);
    } catch (error) {
      console.error('Failed to post complaint', error);
      toast.error("Failed to submit grievance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComplaint = async (postId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this complaint report?")) return;

    try {
      await api.delete(`/complaints/${postId}`);
      setComplaints(prev => prev.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Failed to delete complaint report thread context.');
    }
  };

  const handleUpvote = async (postId: string) => {
    if (upvoteLocks.current.has(postId)) return;

    requireAuth(async () => {
      if (!currentUserId) return;
      upvoteLocks.current.add(postId);

      setComplaints(prev => prev.map(post => {
        if (post._id !== postId) return post;
        const hasUpvoted = post.upvotes.includes(currentUserId);
        let newUpvotes = [...post.upvotes];
        if (hasUpvoted) newUpvotes = newUpvotes.filter(id => id !== currentUserId);
        else newUpvotes.push(currentUserId);
        return { ...post, upvotes: newUpvotes };
      }));

      try {
        await api.put(`/complaints/${postId}/upvote`);
      } catch (error: any) { 
        toast.error(error.response?.data?.message || 'Upvote failed.'); 
      } finally {
        upvoteLocks.current.delete(postId);
      }
    });
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    if (upvoteLocks.current.has(commentId)) return;
    
    requireAuth(async () => {
      if (!currentUserId) return;
      upvoteLocks.current.add(commentId);

      setComplaints(prev => prev.map(post => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map(c => {
            if (c._id !== commentId) return c;
            const upvotes = c.upvotes || [];
            const hasLiked = upvotes.includes(currentUserId);
            const newUpvotes = hasLiked ? upvotes.filter(id => id !== currentUserId) : [...upvotes, currentUserId];
            return { ...c, upvotes: newUpvotes };
          })
        };
      }));

      try { 
        await api.put(`/complaints/${postId}/comments/${commentId}/like`); 
      } catch (error: any) { 
        toast.error('Failed to like comment.'); 
      } finally {
        upvoteLocks.current.delete(commentId);
      }
    });
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!commentText.trim()) return;

    requireAuth(async () => {
      const toastId = toast.loading('Posting comment...');
      try {
        const res = await api.post(`/complaints/${postId}/comments`, { text: commentText });
        setComplaints(prev => prev.map(post => post._id === postId ? { ...post, comments: res.data.data } : post));
        setCommentText('');
        toast.success('Comment posted!', { id: toastId });
      } catch (error: any) { 
        toast.error(error.response?.data?.message || 'Failed to post comment', { id: toastId }); 
      }
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setComplaints(prev => prev.map(post => {
      if (post._id !== postId) return post;
      return { ...post, comments: post.comments.filter(c => c._id !== commentId) };
    }));
    try { await api.delete(`/complaints/${postId}/comments/${commentId}`); } 
    catch (error) { console.error(error); }
  };

  const handleStatusUpdate = async (postId: string, newStatus: string) => {
    const responseText = window.prompt(`Changing status to "${newStatus}". Enter an official response (optional):`);
    if (responseText === null) return; 

    try {
      const res = await api.put(`/complaints/${postId}/status`, { status: newStatus, officialResponse: responseText });
      setComplaints(prev => prev.map(post => post._id === postId ? res.data.data : post));
    } catch (error: any) { alert("Failed to update status."); }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Resolved': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case 'In Progress': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'Under Review': return "bg-amber-50 text-amber-700 border-amber-100";
      case 'Declined': return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };


  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      
      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        userId={selectedUserId} 
      />

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="w-full md:w-auto">
            <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-2">IBA Voice</h1>
            <p className="text-slate-500 font-medium text-sm sm:text-lg mb-3 sm:mb-4">Report concerns, raise issues, and share feedback responsibly.</p>
            
          </div>
          <button 
            aria-label='open modal'
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-full md:w-auto px-6 py-3.5 sm:py-3 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-bold rounded-xl sm:rounded-full shadow-sm transition-all hover:shadow-md shrink-0"
          >
            Submit Complaint
          </button>
        </div>

        {/* Analytics Widgets Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Total</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.total}</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div> Pending</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.pending}</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div> In Progress</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.inProgress}</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div> Resolved</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.resolved}</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Anonymous</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.anonymousPercent}%</span>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Avg Resolution</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 truncate">{globalStats.avgRes}</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-3 sm:p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 sm:mb-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2">
           <div className="hidden sm:flex px-4 py-2 border-r border-slate-100 items-center gap-2 shrink-0">
             <AlertCircle className="w-4 h-4 text-slate-500" />
           </div>
           
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 px-1 sm:px-3 flex-1 sm:flex-none">
             <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase sm:capitalize tracking-wider sm:tracking-normal pl-1 sm:pl-0">Type</span>
             <div className="w-full sm:w-auto bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200 sm:border-none p-1 sm:p-0">
               <select aria-label='categories' value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none px-2 py-1.5 sm:py-0">
                 <option value="All">All Categories</option>
                 <option value="Academics">Academics</option>
                 <option value="IT Support">IT Support</option>
                 <option value="Hostel">Hostel</option>
                 <option value="Transport">Transport</option>
                 <option value="Cafeteria">Cafeteria</option>
                 <option value="Finance">Finance</option>
                 <option value="General">General</option>
               </select>
             </div>
           </div>
           
           <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
           
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 px-1 sm:px-3 flex-1 sm:flex-none mt-2 sm:mt-0">
             <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase sm:capitalize tracking-wider sm:tracking-normal pl-1 sm:pl-0">Status</span>
             <div className="w-full sm:w-auto bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200 sm:border-none p-1 sm:p-0">
               <select aria-label='status filter' value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none px-2 py-1.5 sm:py-0">
                 <option value="All">All Statuses</option>
                 <option value="Pending">Pending</option>
                 <option value="Under Review">Under Review</option>
                 <option value="In Progress">In Progress</option>
                 <option value="Resolved">Resolved</option>
                 <option value="Declined">Declined</option>
               </select>
             </div>
           </div>

           <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 px-1 sm:px-3 flex-1 sm:flex-none">
             <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase sm:capitalize tracking-wider sm:tracking-normal pl-1 sm:pl-0">Department</span>
             <div className="w-full sm:w-auto bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-200 sm:border-none p-1 sm:p-0">
               {/* 🚀 FIX 4: Corrected value and onChange wiring */}
               <select aria-label='departments' value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer outline-none px-2 py-1.5 sm:py-0">
                 <option value="All">All Departments</option>
                 <option value="Computer Science">CS</option>
                 <option value="Business Administration">BBA</option>
                 <option value="Computer Systems Engineering">CSE</option>
                 <option value="Electrical Engineering">EE</option>
                 <option value="Mathematics">Maths</option>
                 <option value="Education">Education</option>
                 <option value="Media & Communications">Media</option>
                 <option value="Physical Education">PE</option>
               </select>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {loading ? (
              <div className="text-center py-20 text-slate-500 text-sm sm:text-base font-medium bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse">Loading reports...</div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-white border border-slate-200 rounded-3xl text-slate-500 text-sm sm:text-base font-medium shadow-sm px-4">No complaints registered matching these criteria.</div>
            ) : (
              complaints.map(post => {
                const hasUpvoted = post.upvotes.includes(currentUserId);
                const isExpanded = activeCommentPost === post._id;
                const isPostOwnerOrAdmin = String(post.author?._id) === String(currentUserId) || currentUserRole === 'admin' || currentUserRole === 'moderator';

                return (
                  <div key={post._id} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex gap-3 sm:gap-6 items-start relative transition-all hover:shadow-md">
                    
                    {/* UPVOTE COLUMN */}
                      <div className="flex flex-col items-center justify-start pt-1 sm:pt-1.5 shrink-0 gap-0.5 sm:gap-1">
                        <button 
                          aria-label='upvote'
                          onClick={() => handleUpvote(post._id)}
                          disabled={hasUpvoted}
                          className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                            hasUpvoted ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                          }`}
                        >
                          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                        </button>
                        
                        <span className={`text-sm sm:text-lg font-black ${post.upvotes.length >= 10 ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {post.upvotes.length}
                        </span>
                        
                        <button 
                          aria-label='remove upvote'
                          onClick={() => handleUpvote(post._id)}
                          disabled={!hasUpvoted}
                          className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                            !hasUpvoted ? 'text-slate-300 cursor-not-allowed opacity-50' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                        </button>
                      </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-3 gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${getStatusStyle(post.status)}`}>
                            {post.status}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">{post.category}</span>
                          {post.department && post.department !== 'Global' && (
                            <span className="text-[9px] sm:text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
                            {post.department}
                            </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
                          {/* Admin Updates dropdown menu */}
                          {(currentUserRole === 'admin' || currentUserRole === 'moderator') && (
                            <select 
                              aria-label='set status'
                              className="text-[9px] sm:text-[10px] font-black bg-slate-900 text-white rounded-full px-2 py-0.5 outline-none cursor-pointer border-none focus:ring-1 focus:ring-indigo-500"
                              value={post.status}
                              onChange={(e) => handleStatusUpdate(post._id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Declined">Declined</option>
                            </select>
                          )}

                          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <span className="text-[10px] sm:text-xs font-medium text-slate-500">
                              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </span>
                            
                            {isPostOwnerOrAdmin && (
                              <button 
                                aria-label='delete complaint'
                                onClick={() => handleDeleteComplaint(post._id)}
                                className="p-1 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors ml-1"
                                title="Delete Complaint"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <h2 className="text-base sm:text-xl font-bold text-[#0f172a] mb-1.5 sm:mb-2 leading-snug cursor-pointer hover:text-indigo-600 transition-colors break-words" onClick={() => setActiveCommentPost(isExpanded ? null : post._id)}>
                        {post.title}
                      </h2>
                      <p className={`text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 ${!isExpanded ? 'line-clamp-2' : 'whitespace-pre-wrap'}`}>
                        {post.description}
                      </p>

                      {isExpanded && post.mediaUrl && (
                        <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 p-2 sm:p-0">
                          <img src={post.mediaUrl} alt="Evidence Document" className="w-full max-h-[250px] sm:max-h-[380px] object-contain mx-auto rounded-lg sm:rounded-none" />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100/80 gap-2">
                        
                        <div 
                          className={`flex items-center gap-2 sm:gap-2.5 min-w-0 ${!post.isAnonymous ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                          onClick={() => !post.isAnonymous && setSelectedUserId(post.author?._id)}
                        >
                          <Avatar className="w-6 h-6 sm:w-7 sm:h-7 bg-slate-100 border border-slate-200 shrink-0">
                            <AvatarImage src={optimizeImage(post.author?.avatarUrl, 100, 100)} alt='user profile'/>
                            <AvatarFallback className="text-[9px] sm:text-[10px] font-black bg-slate-100 text-slate-600">
                              {post.isAnonymous ? <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-700" /> : post.author?.firstName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 sm:gap-2 truncate">
                            <span className="truncate max-w-[80px] sm:max-w-none">{post.isAnonymous ? 'Anonymous Student' : `${post.author?.firstName} ${post.author?.lastName}`}</span>
                            {(!post.isAnonymous && post.author?.isAlumni) && (
                              <span className="bg-indigo-100 text-indigo-700 text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-black shrink-0 hidden sm:inline-block">
                                Alumni
                              </span>
                            )}
                          </span>
                        </div>

                        <button 
                          aria-label='post'
                          onClick={() => setActiveCommentPost(isExpanded ? null : post._id)}
                          className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold transition-all px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0 ${isExpanded ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> <span>{post.comments.length} <span className="hidden sm:inline">Comments</span></span>
                        </button>
                      </div>

                      {/* Expanded Section Layout */}
                      {isExpanded && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100 animate-in fade-in duration-200">
                          
                          {post.officialResponse && (
                            <div className="bg-[#0f172a] rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-sm border border-slate-800">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                                <span className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Official Response Update
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-slate-500">Authorized Verdict</span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                                {post.officialResponse}
                              </p>
                            </div>
                          )}

                          <div className="mb-3 sm:mb-4 flex items-center gap-2">
                            <h3 className="font-black text-slate-800 text-xs sm:text-sm">Discussions Thread</h3>
                            <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full">{post.comments.length}</span>
                          </div>

                          <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6 pl-1.5 sm:pl-2 border-l-2 border-slate-200/60 ml-1 sm:ml-2">
                            {post.comments.map(comment => {
                              const hasLikedComment = comment.upvotes?.includes(currentUserId);
                              const isCommentOwner = String(comment.user?._id) === String(currentUserId) || currentUserRole === 'admin' || currentUserRole === 'moderator';

                              return (
                                <div key={comment._id} className="relative pl-4 sm:pl-6 group/comment">
                                  
                                  <div 
                                    className="absolute -left-[11px] sm:-left-[15px] top-0.5 bg-[#f8fafc] p-0.5 cursor-pointer hover:scale-105 transition-transform" 
                                    onClick={() => setSelectedUserId(comment.user?._id)}
                                  >
                                    <Avatar className="w-5 h-5 sm:w-6 sm:h-6 border border-slate-200 shadow-sm">
                                      <AvatarImage src={optimizeImage(comment.user?.avatarUrl, 100, 100)} alt='user profile'/>
                                      <AvatarFallback className="text-[7px] sm:text-[8px] font-bold">{comment.user?.firstName?.[0]}</AvatarFallback>
                                    </Avatar>
                                  </div>

                                  <div className="bg-slate-50/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-slate-200/60 flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                                    <div className="flex-1 w-full min-w-0">
                                      <div className="flex justify-between items-center mb-1 gap-2">
                                        
                                        <span 
                                          className="text-[10px] sm:text-xs font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-indigo-600 transition-colors truncate"
                                          onClick={() => setSelectedUserId(comment.user?._id)}
                                        >
                                          <span className="truncate">{comment.user?.firstName} {comment.user?.lastName}</span>
                                          {comment.user?.isAlumni && (
                                            <span className="bg-indigo-100 text-indigo-700 text-[7px] sm:text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-black shrink-0 hidden sm:inline-block">
                                              Alumni
                                            </span>
                                          )}
                                        </span>
                                        
                                        <span className="text-[8px] sm:text-[9px] font-semibold text-slate-500 shrink-0">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed break-words">{comment.text}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 sm:mt-0.5 self-end sm:self-start shrink-0">
                                      <button 
                                        aria-label='comment like'
                                        onClick={() => handleCommentLike(post._id, comment._id)}
                                        className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-1 rounded-md transition-colors ${hasLikedComment ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'}`}
                                      >
                                        <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${hasLikedComment ? 'fill-red-500' : ''}`} />
                                        <span>{comment.upvotes?.length || 0}</span>
                                      </button>

                                      {isCommentOwner && (
                                        <button 
                                          aria-label='delete comment'
                                          onClick={() => handleDeleteComment(post._id, comment._id)}
                                          className="p-1 sm:p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                          title="Delete Comment"
                                        >
                                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-1.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <input 
                              type="text" 
                              placeholder="Add a constructive comment..." 
                              className="flex-1 text-xs sm:text-sm border-none bg-transparent focus:ring-0 px-2 sm:px-3 py-1.5 sm:py-0 outline-none"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post._id)}
                            />
                            <button 
                              aria-label='comment submit'
                              onClick={() => handleCommentSubmit(post._id)}
                              disabled={!commentText.trim()}
                              className="bg-[#0f172a] hover:bg-slate-800 text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50 shrink-0 w-full sm:w-auto"
                            >
                              Comment
                            </button>
                          </div>

                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}

            {/* SERVER-SIDE LOAD MORE BUTTON */}
            {hasMore && (
              <button 
                aria-label='load more complaints'
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3.5 sm:py-4 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl text-[10px] sm:text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                ) : (
                  'Load More Grievances'
                )}
              </button>
            )}
          </div>

          {/* Right Layout Sidebars */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" /> Community Guidelines
              </h3>
              <ul className="space-y-2.5 sm:space-y-3.5 text-xs sm:text-sm font-medium text-slate-600">
                <li className="flex gap-2 sm:gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 sm:mt-2 shrink-0"></div> Ensure complaints are factual and evidence-based.</li>
                <li className="flex gap-2 sm:gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 sm:mt-2 shrink-0"></div> Avoid personal attacks or defamatory language.</li>
                <li className="flex gap-2 sm:gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 sm:mt-2 shrink-0"></div> Check if your issue has already been reported before submitting.</li>
                <li className="flex gap-2 sm:gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 sm:mt-2 shrink-0"></div> Categorize your submission correctly to ensure faster routing.</li>
              </ul>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" /> Safe & Formal
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-2 sm:mb-4 leading-relaxed">
                IBA Voice operates under a strict non-retaliation policy. You have the option to submit grievances completely anonymously.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* --- FORM SUBMISSION MODAL --- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto flex flex-col relative border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="p-6 sm:p-8 border-b border-slate-100 text-center relative shrink-0">
              <button 
                aria-label='close modal'
                onClick={() => setIsSubmitModalOpen(false)}
                className="absolute right-4 sm:right-6 top-6 sm:top-8 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 sm:p-2 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-1.5 pr-8 sm:pr-0">Submit a Grievance</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-md mx-auto">Please provide detailed accurate information.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-2">Complaint Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      aria-label='select category'
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 outline-none focus:border-[#0f172a] focus:bg-white transition-colors"
                    >
                      <option value="" disabled hidden>Select category...</option>
                      <option value="Academics">Academics</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Transport">Transport</option>
                      <option value="Cafeteria">Cafeteria</option>
                      <option value="Finance">Finance</option>
                      <option value="General">General</option>
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-2">Department <span className="text-slate-500 font-medium">(Optional)</span></label>
                  <div className="relative">
                    <select 
                      aria-label='select department'
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 outline-none focus:border-[#0f172a] focus:bg-white transition-colors truncate pr-8"
                    >
                      <option value="Global">Not sure / Global</option>
                      <option value="Computer Science">CS</option>
                      <option value="Business Administration">BBA</option>
                      <option value="Computer Systems Engineering">CSE</option>
                      <option value="Electrical Engineering">EE</option>
                      <option value="Mathematics">Maths</option>
                      <option value="Education">Education</option>
                      <option value="Media & Communications">Media</option>
                      <option value="Physical Education">Physical Education</option>
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-2">Title Headline <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Brief summary of the target issue"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-bold rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 outline-none focus:border-[#0f172a] focus:bg-white placeholder:text-slate-500 transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-2">Detailed Description <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide full details of the incident or operational grievance context..."
                  className="w-full min-h-[100px] sm:min-h-0 resize-y bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 outline-none focus:border-[#0f172a] focus:bg-white placeholder:text-slate-500 transition-colors"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5 sm:mb-2">Evidence Attachments</label>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                
                {!mediaUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl mb-2 sm:mb-3 shadow-sm group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-800 mb-0.5 text-center">Click to upload image</p>
                    <p className="text-[9px] sm:text-xs font-bold text-slate-500 text-center">PNG, JPG or JPEG (max. 10MB)</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-xl sm:rounded-2xl p-2 bg-slate-50 inline-block w-fit">
                    <img src={mediaUrl} alt="Preview" className="h-20 sm:h-28 w-auto rounded-lg sm:rounded-xl object-cover" />
                    <button aria-label='close' type="button" onClick={() => setMediaUrl(null)} className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-red-500 text-white rounded-full p-1 sm:p-1.5 shadow-md hover:bg-red-600 transition-colors">
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm gap-4">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-0.5 sm:mb-1">Post Anonymous</h4>
                  <p className="text-[9px] sm:text-xs font-bold text-slate-500 flex items-start sm:items-center gap-1.5 leading-tight">
                    <Lock className="w-3 h-3 shrink-0 mt-0.5 sm:mt-0" /> Your identity will be safely masked
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                  <div className="w-9 sm:w-11 h-5 sm:h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-[#0f172a]"></div>
                </label>
              </div>

              <div className="pt-2 sm:pt-2">
                <button aria-label='submit' type="submit" disabled={isSubmitting || !title || !description} className="w-full py-3 sm:py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-xl shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-widest">
                  {isSubmitting ? 'Submitting Issue...' : 'Submit Grievance'} &rarr;
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}