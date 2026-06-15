'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { 
  Send, Search, MessageSquare, Star, Circle, BookOpen, 
  Smile, Paperclip, X, Users, CheckCircle2, ChevronDown, 
  BellOff, BellRing, Ban, Flag, UserPlus, UserCheck, AlertTriangle, ArrowLeft,
  Edit3, ArrowRight, Hourglass, GraduationCap, Image as ImageIcon, Loader2
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { optimizeImage } from '@/lib/cloudinary';
import dynamic from 'next/dynamic';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { 
  ssr: false, 
  loading: () => <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white">Loading Emojis...</div> 
});
const NetworkView = dynamic(() => import('@/components/chat/NetworkView'), { 
  loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading Network...</div> 
});

const MessagesView = dynamic(() => import('@/components/chat/MessagesView'), { 
  loading: () => <div className="p-8 text-center text-slate-500 animate-pulse">Loading Messages...</div> 
});


// --- Interfaces ---
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  department: string;
  semester: string;
  section: string;
  isOnline: boolean;
  contributorPoints: number;
  headline?: string;
  bio?: string;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'; 
  bannerUrl?: string; 
  isAlumni?: boolean;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  mediaUrl?: string;
  createdAt: string;
}

// --- Inner Chat Component ---
function ConnectEngine() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [directory, setDirectory] = useState<User[]>([]);
  const [conversations, setConversations] = useState<User[]>([]); 
  const [activeUser, setActiveUser] = useState<User | null>(null);
  
  // Modals & States
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<'network' | 'messages'>('network');
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  const activeUserRef = useRef<User | null>(null); 
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // 🚀 NEW: REVERSE PAGINATION STATES
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const shouldScrollToBottom = useRef(true); // 🚀 SCROLL LOCK!

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<any>(null);
  
  // Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showConnectionsOnly, setShowConnectionsOnly] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<any>(null);
  let typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlUserId = searchParams.get('userId'); 

  useEffect(() => {
    if (viewMode === 'messages' && activeUser) {
      sessionStorage.setItem('currentlyActiveChatId', activeUser._id);
    } else {
      sessionStorage.removeItem('currentlyActiveChatId');
    }
    return () => sessionStorage.removeItem('currentlyActiveChatId');
  }, [viewMode, activeUser]);

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    
    const initializeChat = async () => {
      try {
        const userRes = await api.get('/users/me', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' }
        });
        const user = userRes.data?.data || userRes.data?.user || userRes.data;
        if (user?._id) {
          setCurrentUser(user);
          socketRef.current?.emit('setup_user', user._id);
          socketRef.current?.on('connect', () => socketRef.current?.emit('setup_user', user._id));
        }
      } catch (error) { 
        console.error("Authentication failed. Redirecting to login...");
        router.push('/login'); 
      }
    };

    initializeChat();
    fetchConversations();

    socketRef.current.on('receive_message', (incomingMessage: Message) => {
      if (blockedUsers.has(incomingMessage.sender)) return;

      if (activeUserRef.current?._id === incomingMessage.sender) {
        shouldScrollToBottom.current = true; // 🚀 Auto-scroll for new messages
        setMessages((prev) => [...prev, incomingMessage]);
      } else {
        setUnreadSenders((prev) => {
          const newSet = new Set(prev);
          newSet.add(incomingMessage.sender);
          return newSet;
        });
      }
    });

    socketRef.current.on('new_notification', (notif: any) => {
      if (notif.type === 'connection') {
        fetchDirectory();
        fetchConversations();
      }
    });

    socketRef.current.on('typing', () => setIsTyping(true));
    socketRef.current.on('stop_typing', () => setIsTyping(false));
    return () => { socketRef.current?.disconnect(); };
  }, [blockedUsers, router]);


  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data);
    } catch (error) { console.error('Failed to load recent conversations'); }
  };

  const fetchDirectory = async () => {
      try {
        const res = await api.get('/chat/users', {
          params: { 
            search: searchTerm, 
            department: departmentFilter !== 'All' ? departmentFilter : '',
            section: sectionFilter !== 'All' ? sectionFilter : ''
          },
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        setDirectory(res.data.data);
      } catch (error) { console.error('Failed to load directory'); }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchDirectory(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm, departmentFilter, sectionFilter]);

  useEffect(() => {
    if (selectedProfile) {
      const updatedProfile = directory.find(u => u._id === selectedProfile._id) || conversations.find(u => u._id === selectedProfile._id);
      if (updatedProfile && updatedProfile.connectionStatus !== selectedProfile.connectionStatus) {
        setSelectedProfile(updatedProfile); 
      }
    }
    
    if (activeUser) {
      const updatedActive = directory.find(u => u._id === activeUser._id) || conversations.find(u => u._id === activeUser._id);
      if (updatedActive && updatedActive.connectionStatus !== activeUser.connectionStatus) {
        setActiveUser(updatedActive);
      }
    }
  }, [directory, conversations]);

  useEffect(() => {
    if (urlUserId && directory.length > 0) {
      if (activeUserRef.current?._id !== urlUserId) {
        const userToOpen = directory.find((u) => u._id === urlUserId) || conversations.find((u) => u._id === urlUserId);
        if (userToOpen) {
          setActiveUser(userToOpen);
          setViewMode('messages'); 
          setUnreadSenders(prev => {
            const newSet = new Set(prev);
            newSet.delete(urlUserId);
            return newSet;
          });
        }
      }
    }
  }, [urlUserId, directory, conversations]);

  // 🚀 MODIFIED: Initial Message Fetch (Page 1)
  useEffect(() => {
    if (!activeUser) return;
    const fetchInitialMessages = async () => {
      setMessagePage(1);
      shouldScrollToBottom.current = true; // Auto-scroll for initial load
      try {
        const res = await api.get(`/chat/messages/${activeUser._id}?page=1&limit=50`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        setMessages(res.data.data);
        setHasMoreMessages(res.data.pagination?.hasMore || false);
      } catch (error) { console.error('Failed to load messages'); }
    };
    fetchInitialMessages();
  }, [activeUser]);

  // 🚀 NEW: Load Older Messages Function
  const loadMoreMessages = async () => {
    if (!activeUser || !hasMoreMessages || isLoadingMoreMessages) return;
    setIsLoadingMoreMessages(true);
    
    const nextPage = messagePage + 1;
    setMessagePage(nextPage);

    // Capture scroll height before prepending so we can freeze the UI position
    const container = chatContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    try {
      const res = await api.get(`/chat/messages/${activeUser._id}?page=${nextPage}&limit=50`);
      
      shouldScrollToBottom.current = false; // Lock the scroll!
      
      // Prepend older messages to the top
      setMessages(prev => [...res.data.data, ...prev]); 
      setHasMoreMessages(res.data.pagination?.hasMore || false);
      
      // Restore scroll position instantly
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeight;
        }
      }, 0);

    } catch (error) { console.error('Failed to load older messages'); }
    finally { setIsLoadingMoreMessages(false); }
  };

  // 🚀 MODIFIED: Smart Auto-Scroller
  useEffect(() => {
    if (chatContainerRef.current && shouldScrollToBottom.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
    // Reset back to true for the next socket event
    shouldScrollToBottom.current = true;
  }, [messages, isTyping]);


  const handleUserSelect = (user: User) => {
    setActiveUser(user);
    setSelectedProfile(null); 
    setViewMode('messages'); 
    setUnreadSenders((prev) => {
      const newSet = new Set(prev);
      newSet.delete(user._id);
      return newSet;
    });
    
    if (searchParams.get('userId') !== user._id) {
      window.history.replaceState(null, '', `/chat?userId=${user._id}`);
    }
  };

  const handleConnectionAction = async (targetUserId: string, action: 'send' | 'accept' | 'remove', userFullName: string) => {
    let newStatus: any = 'none';
    if(action === 'send') newStatus = 'pending_sent';
    if(action === 'accept') newStatus = 'accepted';
    
    const updateUserState = (u: User) => u._id === targetUserId ? { ...u, connectionStatus: newStatus } : u;
    setDirectory(prev => prev.map(updateUserState));
    setConversations(prev => prev.map(updateUserState));
    setActiveUser(prev => prev?._id === targetUserId ? { ...prev, connectionStatus: newStatus } : prev);
    setSelectedProfile(prev => prev?._id === targetUserId ? { ...prev, connectionStatus: newStatus } : prev);

    try {
        let endpoint = '';
        let method = 'POST';

        if(action === 'send') endpoint = `/chat/connect/send/${targetUserId}`;
        if(action === 'accept') { endpoint = `/chat/connect/accept/${targetUserId}`; method = 'PUT'; }
        if(action === 'remove') { endpoint = `/chat/connect/remove/${targetUserId}`; method = 'DELETE'; }

        // @ts-ignore
        await api[method.toLowerCase()](endpoint);
        
        let successMessage = 'Action completed.';
        if(action === 'send') successMessage = `Connection request sent to ${userFullName}.`;
        if(action === 'accept') successMessage = `You are now connected to ${userFullName}!`;
        if(action === 'remove') successMessage = `Connection removed.`;

        toast.success(successMessage);
    } catch (error: any) {
        toast.error(error.response?.data?.message || `Failed to process request.`);
        fetchDirectory();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !activeUser || !currentUser) return;
    const messageText = newMessage;
    const currentMedia = mediaUrl; 
    setNewMessage('');
    setMediaUrl(null); 
    setShowEmojiPicker(false);
    socketRef.current?.emit('stop_typing', { receiverId: activeUser._id, senderId: currentUser._id });

    try {
      const res = await api.post('/chat/messages', { receiverId: activeUser._id, text: messageText, mediaUrl: currentMedia });
      const savedMessage = res.data.data;
      
      shouldScrollToBottom.current = true; // 🚀 Auto-scroll
      setMessages(prev => [...prev, savedMessage]);
      socketRef.current?.emit('send_message', savedMessage);

      if (!conversations.find(u => u._id === activeUser._id)) {
        setConversations(prev => [activeUser, ...prev]);
      }
    } catch (error) { console.error('Failed to send message'); }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socketRef.current || !activeUser || !currentUser) return;
    socketRef.current.emit('typing', { receiverId: activeUser._id, senderId: currentUser._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', { receiverId: activeUser._id, senderId: currentUser._id });
    }, 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleMute = async () => {
    if (!activeUser) return;
    setMutedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activeUser._id)) newSet.delete(activeUser._id);
      else newSet.add(activeUser._id);
      return newSet;
    });
    try { await api.put(`/chat/mute/${activeUser._id}`); } catch (e) { console.error('Mute failed', e); }
  };

  const handleBlock = async () => {
    if (!activeUser) return;
    const isCurrentlyBlocked = blockedUsers.has(activeUser._id);
    
    if (isCurrentlyBlocked) {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(activeUser._id);
        return newSet;
      });
      try { await api.put(`/chat/unblock/${activeUser._id}`); } catch (e) { console.error(e); }
      toast.success("User unblocked");
      return;
    }

    if (window.confirm(`Are you sure you want to block ${activeUser.firstName}? You will no longer receive their messages.`)) {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(activeUser._id);
        return newSet;
      });
      try { await api.post(`/chat/block/${activeUser._id}`); } catch (e) { console.error(e); }
      toast.success("User blocked successfully.");
      setActiveUser(null);
      router.replace('/chat');
    }
  };

  const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5MB");
      setEvidenceFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeEvidence = () => {
    setEvidenceFile(null);
    setPreviewUrl(null);
    if (reportFileInputRef.current) reportFileInputRef.current.value = '';
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !activeUser) return;
    
    setIsReporting(true);
    const toastId = toast.loading('Submitting report...');

    try {
      const formData = new FormData();
      formData.append('targetUserId', activeUser._id);
      formData.append('reason', reportReason);
      
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      await api.post('/chat/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(`Report submitted for ${activeUser.firstName}. Our moderation team will review this.`, { id: toastId });
      setReportModalOpen(false);
      setReportReason('');
      removeEvidence();
    } catch (e) {
      toast.error("Failed to submit report.", { id: toastId });
    } finally {
      setIsReporting(false);
    }
  };

  const displayedDirectory = directory.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (user.isAlumni) return false; 
    if (blockedUsers.has(user._id)) return false; 
    if (semesterFilter !== 'All' && user.semester !== semesterFilter) return false;
    if (onlineOnly && !user.isOnline) return false;
    if (showConnectionsOnly && user.connectionStatus !== 'accepted') return false; 
    return true;
  });

  const sidebarMap = new Map<string, User>();
  conversations.forEach(u => sidebarMap.set(u._id, u));
  directory.forEach(u => {
    if (u.connectionStatus === 'accepted' || unreadSenders.has(u._id) || activeUser?._id === u._id) {
      sidebarMap.set(u._id, u);
    }
  });

  const chatSidebarUsers = Array.from(sidebarMap.values())
    .filter(u => !blockedUsers.has(u._id))
    .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aUnread = unreadSenders.has(a._id) ? 1 : 0;
      const bUnread = unreadSenders.has(b._id) ? 1 : 0;
      if (aUnread !== bUnread) return bUnread - aUnread; 
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1; 
      return 0; 
    });

  const statusQueueUsers = directory.filter(u => ['pending_sent', 'pending_received', 'rejected'].includes(u.connectionStatus));
  
  const suggestedConnections = directory
    .filter(u => u.department === currentUser?.department && u.connectionStatus === 'none' && !u.isAlumni)
    .slice(0, 3); 


  return (
    <>
    <ProtectedRoute>
    <title>Connect & Chat | IBA Hub</title>
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative">
      
      {/* TOP NAVIGATION TABS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4 sm:gap-8 h-12 sm:h-14">
          <button 
            onClick={() => {
              setViewMode('network');
              window.history.replaceState(null, '', '/chat');
            }}
            className={`text-xs sm:text-sm font-bold h-full border-b-2 transition-colors px-2 sm:px-4 ${viewMode === 'network' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Connect Directory
          </button>
          <button 
            onClick={() => {
              setViewMode('messages');
            }}
            className={`text-xs sm:text-sm font-bold h-full border-b-2 transition-colors px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 ${viewMode === 'messages' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Messages
            {unreadSenders.size > 0 && (
              <span className="bg-red-500 text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shrink-0">{unreadSenders.size}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[90rem] w-full mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-0 sm:py-6 md:py-8">
        
        {viewMode === 'network' && (
          <NetworkView 
            currentUser={currentUser}
            directory={directory}
            displayedDirectory={displayedDirectory}
            suggestedConnections={suggestedConnections}
            statusQueueUsers={statusQueueUsers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            showConnectionsOnly={showConnectionsOnly}
            setShowConnectionsOnly={setShowConnectionsOnly}
            handleConnectionAction={handleConnectionAction}
            setSelectedProfile={setSelectedProfile}
            router={router}
          />
        )}

        {viewMode === 'messages' && (
          <MessagesView 
            currentUser={currentUser}
            activeUser={activeUser}
            setActiveUser={setActiveUser}
            chatSidebarUsers={chatSidebarUsers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleUserSelect={handleUserSelect}
            setSelectedProfile={setSelectedProfile}
            messages={messages}
            isTyping={isTyping}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            handleTyping={handleTyping}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            mediaUrl={mediaUrl}
            setMediaUrl={setMediaUrl}
            handleImageChange={handleImageChange}
            fileInputRef={fileInputRef}
            chatContainerRef={chatContainerRef}
            toggleMute={toggleMute}
            handleBlock={handleBlock}
            setReportModalOpen={setReportModalOpen}
            mutedUsers={mutedUsers}
            blockedUsers={blockedUsers}
            unreadSenders={unreadSenders}
            setViewMode={setViewMode}
            router={router}
            // 🚀 NEW PASSED PROPS
            loadMoreMessages={loadMoreMessages}
            hasMoreMessages={hasMoreMessages}
            isLoadingMoreMessages={isLoadingMoreMessages}
          />
        )}

      </div>

      {/* ========================================== */}
      {/* 🚀 MODAL: FULL PROFILE SUMMARY OVERLAY     */}
      {/* ========================================== */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div 
              className="h-24 sm:h-32 bg-slate-900 relative bg-cover bg-center shrink-0"
              style={selectedProfile.bannerUrl ? { backgroundImage: `url(${optimizeImage(selectedProfile.bannerUrl, 800, 250)})` } : {}}
            >
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white bg-black/20 hover:bg-black/40 p-1.5 sm:p-2 rounded-full transition-colors z-10 backdrop-blur-md"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-8 pb-6 sm:pb-8 relative text-center">
              <Avatar className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-white shadow-xl mx-auto -mt-10 sm:-mt-14 mb-3 sm:mb-4 bg-slate-50 shrink-0">
                <AvatarImage alt='user profile' src={optimizeImage(selectedProfile.avatarUrl, 150, 150)} />
                <AvatarFallback className="text-xl sm:text-2xl font-black text-slate-600">{selectedProfile.firstName[0]}</AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="truncate">{selectedProfile.firstName} {selectedProfile.lastName}</span>
                {selectedProfile.contributorPoints > 50 && <span title="Top Contributor" className="flex shrink-0">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </span>}
              </h2>
              
              <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold rounded-full">{selectedProfile.department}</span>
                {selectedProfile.isAlumni ? (
                   <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-full">Alumni</span>
                ) : (
                  <>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold rounded-full">Sem {selectedProfile.semester?.replace(/\D/g,'')}</span>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold rounded-full">Sec {selectedProfile.section || 'A'}</span>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                {selectedProfile.headline || `Studying at IBA Hub. Always open to connecting and collaborating on projects.`}
              </p>

              <div className="flex flex-col gap-2 sm:gap-3">
                {currentUser?._id === selectedProfile._id ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button 
                      onClick={() => router.push('/profile')}
                      className="w-full py-2.5 sm:py-3 bg-[#0f172a] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Edit Profile
                    </button>
                    <button 
                      onClick={() => router.push('/profile')}
                      className="w-full py-2.5 sm:py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
                    >
                      View Full Profile
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                       {(() => {
                           const status = selectedProfile.connectionStatus;
                           const fullName = `${selectedProfile.firstName} ${selectedProfile.lastName}`;
                           if (status === 'accepted') {
                               return (
                                <button 
                                  onClick={() => handleConnectionAction(selectedProfile._id, 'remove', fullName)}
                                  className="w-full py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm border bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  title="Click to disconnect"
                                >
                                  <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Connected
                                </button>
                               );
                           } else if (status === 'pending_sent') {
                               return (
                                <button 
                                  onClick={() => handleConnectionAction(selectedProfile._id, 'remove', fullName)}
                                  className="w-full py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm border bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                  title="Click to cancel request"
                                >
                                  <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Pending
                                </button>
                               );
                           } else if (status === 'pending_received') {
                               return (
                                 <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    <button 
                                        onClick={() => handleConnectionAction(selectedProfile._id, 'accept', fullName)}
                                        className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1 shadow-sm border border-blue-600"
                                     >
                                        Accept
                                     </button>
                                    <button 
                                        onClick={() => handleConnectionAction(selectedProfile._id, 'remove', fullName)}
                                        className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all flex items-center justify-center gap-1 shadow-sm border border-slate-200"
                                     >
                                        Decline
                                     </button>
                                 </div>
                               );
                           } else if (status === 'rejected') {
                               return (
                                <button 
                                  onClick={() => handleConnectionAction(selectedProfile._id, 'send', fullName)}
                                  className="w-full py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm border bg-white border-red-200 text-red-600 hover:bg-red-50"
                                  title="They declined your request. Click to send again."
                                >
                                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Send Again
                                </button>
                               );
                           } else {
                               return (
                                <button 
                                  onClick={() => handleConnectionAction(selectedProfile._id, 'send', fullName)}
                                  className="w-full py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm border bg-[#0f172a] border-[#0f172a] hover:bg-slate-800 text-white"
                                >
                                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Connect
                                </button>
                               );
                           }
                       })()}

                      <button 
                        onClick={() => {
                          handleUserSelect(selectedProfile);
                          setSelectedProfile(null);
                        }}
                        className="w-full py-2.5 sm:py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Message
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => router.push(`/profile/${selectedProfile._id}`)}
                      className="w-full py-2.5 sm:py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      View Full Profile <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🚀 MODAL: PREMIUM REPORT USER OVERLAY      */}
      {/* ========================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-md p-5 sm:p-6 relative border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 text-red-600">
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Report User</h3>
            </div>
            
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-4 sm:mb-6">
              If <span className="font-bold text-slate-700">{activeUser?.firstName}</span> is violating guidelines, please explain what happened and attach a screenshot as proof.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); submitReport(); }} className="space-y-4">
              
              <div>
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Reason for Report <span className="text-red-500">*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the inappropriate behavior..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full resize-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Attach Evidence (Optional)
                </label>
                
                {!previewUrl ? (
                  <div 
                    onClick={() => reportFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-2">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-600">Click to upload screenshot</p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-1">
                    <img src={previewUrl} alt="Evidence Preview" className="w-full h-32 sm:h-40 object-contain rounded-lg" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setEvidenceFile(null);
                        setPreviewUrl(null);
                        if (reportFileInputRef.current) reportFileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors shadow-sm"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={reportFileInputRef} 
                  onChange={handleEvidenceChange} 
                />
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[9px] sm:text-[10px] font-semibold text-red-800 leading-tight">
                  False reports may result in penalties to your own account.
                </p>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportReason('');
                    setEvidenceFile(null);
                    setPreviewUrl(null);
                  }} 
                  variant="outline" 
                  className="rounded-xl font-bold h-9 sm:h-11 text-xs sm:text-sm flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isReporting || !reportReason.trim()} 
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50 h-9 sm:h-11 text-xs sm:text-sm flex-1 flex items-center justify-center gap-2"
                >
                  {isReporting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-bold text-sm sm:text-base">Loading Workspace...</div>}>
      <ConnectEngine />
    </Suspense>
  );
}