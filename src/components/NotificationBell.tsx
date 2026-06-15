'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Bell, CheckCircle, MessageSquare, ThumbsUp, AlertCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  type: string;
  content: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  sender?: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const processedNotifs = useRef<Set<string>>(new Set()); 
  
  // 🚀 ADDED: Ref to store muted users so the socket listener has instant access to them
  const mutedUsersRef = useRef<Set<string>>(new Set()); 
  
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data) {
          setNotifications(res.data.data || []);
          setUnreadCount(res.data.unreadCount || 0);
        }

        const userRes = await api.get('/users/me');
        const user = userRes.data?.data || userRes.data?.user || userRes.data;
        const userId = user?._id;
        
        // 🚀 ADDED: Store muted users in our ref
        if (user?.mutedUsers) {
          mutedUsersRef.current = new Set(user.mutedUsers);
        }
        
        if (userId) {
          socketRef.current = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');
          socketRef.current.emit('setup_user', userId);
          socketRef.current.off('new_notification'); 
          
          socketRef.current.on('new_notification', (newNotif: Notification) => {
            
            const senderId = newNotif.sender || (newNotif.link.includes('userId=') ? newNotif.link.split('userId=')[1] : null);

            // ==========================================
            // 🚀 1. SUPPRESS MUTED USERS LOGIC
            // ==========================================
            if (newNotif.type === 'message' && senderId && mutedUsersRef.current.has(senderId)) {
              // Silently mark as read in the background so it doesn't pile up in the database
              api.put(`/notifications/${newNotif._id}/read`).catch(() => {});
              return; // Kill the notification right here!
            }

            // ==========================================
            // 2. SUPPRESS ACTIVE CHATS LOGIC
            // ==========================================
            if (typeof window !== 'undefined' && newNotif.type === 'message') {
              const currentUrl = new URL(window.location.href);
              const activeChatId = sessionStorage.getItem('currentlyActiveChatId');

              // ONLY suppress if we are ON the chat page AND the active chat matches the sender
              if (currentUrl.pathname === '/chat' && activeChatId === senderId) {
                api.put(`/notifications/${newNotif._id}/read`).catch(() => {});
                return; 
              }
            }

            if (processedNotifs.current.has(newNotif._id)) return;
            processedNotifs.current.add(newNotif._id);

            setUnreadCount((c) => c + 1);
            setNotifications((prev) => [newNotif, ...prev]);

            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-slate-50`}
                   onClick={() => { 
                     api.put(`/notifications/${newNotif._id}/read`).catch(() => {});
                     setUnreadCount(c => Math.max(0, c - 1));
                     setNotifications(current => current.map(n => n._id === newNotif._id ? { ...n, isRead: true } : n));
                     router.push(newNotif.link);
                     toast.dismiss(t.id); 
                   }}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-slate-900">New Alert</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{newNotif.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ), { id: newNotif._id });
          });
        }
      } catch (error) {
        console.warn("Notifications temporarily unavailable.");
      }
    };

    fetchNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socketRef.current?.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [router]);
  
  const handleRead = async (id: string, link: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setIsOpen(false);
      router.push(link); 
    } catch (error) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'forum_reply': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'connection': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'upvote': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'status_change': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <>
    
    <div className="relative" ref={dropdownRef}>
      <button aria-label="Notifications" onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-500 hover:text-[#0f172a] hover:bg-slate-100 rounded-xl transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 z-50 overflow-hidden flex flex-col max-h-[400px] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-800 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm font-bold text-slate-400">You're all caught up!</div>
            ) : (
              notifications.map((notif, index) => (
                <div key={`${notif._id}-${index}`} onClick={() => handleRead(notif._id, notif.link)} className={`p-4 border-b border-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                  <div className="mt-0.5 bg-white p-2 rounded-xl shadow-sm border border-slate-100">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{notif.content}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!notif.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0 shadow-sm" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}