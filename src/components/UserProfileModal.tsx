'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserPlus, UserCheck, MessageSquare, Briefcase, 
  GraduationCap, MapPin, Star, X, Hourglass, ExternalLink, Activity, User
} from 'lucide-react';
import { optimizeImage } from '@/lib/cloudinary';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('none');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
  const router = useRouter();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfileAndSession();
    } else {
      setProfile(null);
      setLoading(true);
    }
  }, [isOpen, userId]);

  const fetchUserProfileAndSession = async () => {
    setLoading(true);

    // 1. Fetch the public profile
    try {
      const profileRes = await api.get(`/users/public/${userId}`);
      setProfile(profileRes.data.data);
      setConnectionStatus(profileRes.data.connectionStatus || 'none');
    } catch (error) {
      toast.error('Failed to load user profile');
      onClose();
      setLoading(false);
      return; 
    }

    // 2. Fetch the session
    try {
      const sessionRes = await api.get('/users/me');
      const myId = sessionRes.data?.data?._id || sessionRes.data?.user?._id || sessionRes.data?._id;
      setCurrentUserId(myId);
    } catch (error) {
      setCurrentUserId(null); 
    }

    setLoading(false);
  };

  const handleConnectionAction = async (action: 'send' | 'accept' | 'remove') => {
    const loadingToast = toast.loading(`Processing request...`);
    try {
      let endpoint = '';
      let method = 'POST';

      if (action === 'send') endpoint = `/chat/connect/send/${userId}`;
      if (action === 'accept') { endpoint = `/chat/connect/accept/${userId}`; method = 'PUT'; }
      if (action === 'remove') { endpoint = `/chat/connect/remove/${userId}`; method = 'DELETE'; }

      // @ts-ignore
      await api[method.toLowerCase()](endpoint);
      
      let successMessage = 'Action completed.';
      if (action === 'send') { successMessage = `Connection request sent!`; setConnectionStatus('pending_sent'); }
      if (action === 'accept') { successMessage = `You are now connected!`; setConnectionStatus('accepted'); }
      if (action === 'remove') { successMessage = `Connection removed.`; setConnectionStatus('none'); }

      toast.success(successMessage, { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to process request.`, { id: loadingToast });
    }
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : 'User Profile';
  const isSelf = profile && currentUserId && String(profile._id) === String(currentUserId);
  const isGuest = !currentUserId; 

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl bg-slate-50 [&>button]:hidden">
        
        <DialogTitle className="sr-only">{fullName}</DialogTitle>

        {loading ? (
          <div className="h-80 sm:h-96 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Profile...</p>
          </div>
        ) : profile ? (
          <div className="flex flex-col relative max-h-[85vh] overflow-y-auto overflow-x-hidden">
            
            <div 
              className={`h-24 sm:h-32 relative shrink-0 ${!profile.bannerUrl ? 'bg-gradient-to-r from-[#0f172a] to-indigo-950' : ''}`}
              // 🚀 FIX: Optimize banner inline after profile exists
              style={profile.bannerUrl ? { backgroundImage: `url(${optimizeImage(profile.bannerUrl, 800, 250)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {profile.bannerUrl && <div className="absolute inset-0 bg-black/20" />}
              <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-md transition-colors z-10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 sm:px-8 pb-6 relative bg-white">
              <div className="flex justify-between items-end -mt-10 sm:-mt-12 mb-3 sm:mb-4">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-[3px] sm:border-4 border-white shadow-lg bg-white relative z-10 shrink-0">
                  {/* 🚀 FIX: Increased to 200x200 for crisp modal resolution */}
                  <AvatarImage src={optimizeImage(profile.avatarUrl, 200, 200)} className="object-cover" />
                  <AvatarFallback className="bg-indigo-50 text-indigo-700 text-2xl sm:text-3xl font-black">
                    {profile.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col items-end gap-1.5 sm:gap-2 pb-1">
                  {isSelf ? (
                    <span className="bg-slate-900 text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> You
                    </span>
                  ) : profile.isAlumni ? (
                    <span className="bg-indigo-50 text-indigo-700 text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                      <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Alumni
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                      Student
                    </span>
                  )}
                  
                  {profile.contributorPoints > 50 && (
                    <span className="bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500" /> Top Contributor
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{fullName}</h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mb-3 sm:mb-4">{profile.email}</p>
                
                {profile.bio && (
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 mb-4 sm:mb-6">
                    "{profile.bio}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 flex items-start gap-2 sm:gap-3">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {profile.isAlumni ? 'Current Role' : 'Department'}
                      </p>
                      {/* 🚀 FIXED: Value now strictly matches the label based on isAlumni */}
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug truncate">
                        {profile.isAlumni 
                          ? (profile.currentPosition || 'Not specified') 
                          : (profile.department || 'Not specified')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 flex items-start gap-2 sm:gap-3">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        {profile.isAlumni ? 'Class Of' : 'Semester'}
                      </p>
                      {/* 🚀 FIXED: Value now strictly matches the label based on isAlumni */}
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug truncate">
                        {profile.isAlumni 
                          ? (profile.batch || 'Not specified') 
                          : (profile.semester || 'Not specified')}
                      </p>
                    </div>
                  </div>
                </div>

                {profile.skills && profile.skills.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Expertise & Skills</p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {profile.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-4 pt-4 sm:pt-6 border-t border-slate-100">
                {isGuest ? (
                  // 🚀 GUEST VIEW: Only show Full Profile
                  <button 
                    onClick={() => { router.push(`/profile/${profile._id}`); onClose(); }}
                    className="col-span-2 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> View Full Profile
                  </button>
                ) : isSelf ? (
                  <button 
                    onClick={() => { router.push(`/profile/${profile._id}`); onClose(); }}
                    className="col-span-2 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Go to My Profile
                  </button>
                ) : (
                  <>
                    {connectionStatus === 'accepted' ? (
                      <button onClick={() => router.push(`/chat?userId=${profile._id}`)} className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-2 shadow-sm px-1">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Message
                      </button>
                    ) : connectionStatus === 'pending_sent' ? (
                      <button onClick={() => handleConnectionAction('remove')} className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition-all flex items-center justify-center gap-2 shadow-sm px-1">
                        <Hourglass className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Request Sent
                      </button>
                    ) : connectionStatus === 'pending_received' ? (
                      <button onClick={() => handleConnectionAction('accept')} className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center justify-center gap-2 shadow-sm px-1">
                        <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Accept Request
                      </button>
                    ) : (
                      <button onClick={() => handleConnectionAction('send')} className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-2 shadow-sm px-1">
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Connect
                      </button>
                    )}

                    <button 
                      onClick={() => { router.push(`/profile/${profile._id}`); onClose(); }}
                      className="py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm px-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Full Profile
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm font-medium">Profile unavailable.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}