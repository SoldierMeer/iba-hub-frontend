'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
  Camera, Edit3, Save, X, Star, BookOpen, User as UserIcon, 
  MessageSquare, AlertCircle, FileText, ArrowRight, Crop, 
  Users, GraduationCap, Sparkles, CheckCircle2, Briefcase, Loader2, Globe
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { optimizeImage } from '@/lib/cloudinary';

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// --- HELPER FUNCTION: HTML5 Canvas Image Cropper ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL('image/jpeg', 0.8); 
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0); 
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [formData, setFormData] = useState({
    bio: '',
    department: '',
    semester: '',
    section: 'A',
    currentPosition: '', 
    about: '',
    skills: '',
    avatarUrl: '',
    bannerUrl: '',
    linkedin: '', 
    instagram: '',
    github: '' ,
    portfolio: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const ensureHttps = (url: string) => {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) return `https://${url}`;
    return url;
  }

  // Inside ProfilePage component
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Get the current user's ID
      const userRes = await api.get('/users/me');
      const userData = userRes.data?.data || userRes.data?.user || userRes.data;
      setUser(userData);
      
      const userId = userData?._id;
  
      // 2. Fetch from the rich public endpoint to get accurate stats & connections
      let activityData = [];
      let fetchedPoints = 0;
      let fetchedConns = 0;
  
      if (userId) {
        try {
          const publicRes = await api.get(`/users/public/${userId}`);
          activityData = publicRes.data?.activity || [];
          fetchedPoints = publicRes.data?.totalPoints || 0;
          fetchedConns = publicRes.data?.connectionCount || 0;
        } catch (error) {
          console.error("Stats could not be loaded:", error);
        }
      }
  
      setActivity(activityData);
      setTotalPoints(fetchedPoints);
      setConnectionCount(fetchedConns); // 🚀 Ensure accurate connection count
      
      // 3. Set form data
      setFormData({
        bio: userData.bio || '',
        department: userData.department || '',
        semester: userData.semester || '',
        section: userData.section || 'A',
        currentPosition: userData.currentPosition || '', 
        about: userData.about || '',
        skills: userData.skills?.join(', ') || '',
        avatarUrl: userData.avatarUrl || '',
        bannerUrl: userData.bannerUrl || '',
        linkedin: userData.linkedin || '',
        instagram: userData.instagram || '',
        github: userData.github || '',
        portfolio: userData.portfolio || ''
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        toast.error("Failed to load profile data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = type === 'banner' ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${type === 'banner' ? 'Banner' : 'Avatar'} must be smaller than ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
        setCropType(type);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        e.target.value = ''; 
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !cropType) return;
    try {
      const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (cropType === 'avatar') setFormData(prev => ({ ...prev, avatarUrl: croppedBase64 }));
      else setFormData(prev => ({ ...prev, bannerUrl: croppedBase64 }));
      setCropImageSrc(null); setCropType(null);
    } catch (e) { toast.error("Failed to crop image"); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { 
        ...formData, 
        linkedin: ensureHttps(formData.linkedin),
        instagram: ensureHttps(formData.instagram),
        github: ensureHttps(formData.github),
        portfolio: ensureHttps(formData.portfolio)
      };
      
      const res = await api.put('/users/profile', dataToSave);
      setUser(res.data.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) { 
      toast.error("Failed to save profile"); 
    } finally {
      setIsSaving(false); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold tracking-widest uppercase">Loading Profile...</div>;

  const renderedSkills = user?.skills || [];
  const displayBanner = isEditing ? formData.bannerUrl : user?.bannerUrl;
  const optimizedBanner = optimizeImage(displayBanner, 1200, 400);
  
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      
      {/* 1. IMAGE CROPPER MODAL */}
      {cropImageSrc && cropType && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
            <div className="relative w-full h-[50vh] sm:h-[60vh] bg-black">
              <Cropper
                image={cropImageSrc} crop={crop} zoom={zoom} aspect={cropType === 'avatar' ? 1 : 16 / 5}
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
                cropShape={cropType === 'avatar' ? 'round' : 'rect'} showGrid={false}
              />
            </div>
            <div className="p-6 bg-slate-900 flex flex-col items-center gap-6">
              <div className="w-full max-w-md flex items-center gap-4 text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Zoom</span>
                <input aria-label="Zoom Image" type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div className="flex gap-4 w-full max-w-md">
                <Button variant="outline" onClick={() => { setCropImageSrc(null); setCropType(null); }} className="flex-1 bg-transparent text-white border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl font-bold">
                  Cancel
                </Button>
                <Button onClick={handleApplyCrop} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl font-bold">
                  <Crop className="w-4 h-4" /> Apply Crop
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULLSCREEN IMAGE VIEWER */}
      {viewingImage && !cropImageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm transition-all" onClick={() => setViewingImage(null)}>
          <button aria-label="Close viewer" className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-50" onClick={() => setViewingImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={optimizeImage(viewingImage, 1200, 1200)} alt="Expanded view of profile image" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* 3. MAIN PAGE CONTENT */}
      <div className="max-w-[70rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* === TOP HEADER CARD === */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-8 relative">
          <div 
            className={`h-56 w-full relative bg-slate-200 bg-cover bg-center transition-all ${!isEditing && displayBanner ? 'cursor-pointer hover:opacity-95' : ''}`}
            style={displayBanner ? { backgroundImage: `url(${optimizedBanner})` } : { background: 'linear-gradient(to right, #0f172a, #334155)' }}
            onClick={() => { if (!isEditing && displayBanner) setViewingImage(displayBanner); }}
          >
            {isEditing && (
              <div onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }} className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 text-white font-bold border border-white/30 shadow-lg hover:bg-white/30 transition-colors">
                  <Camera className="w-5 h-5" /> Update Cover Photo
                </div>
              </div>
            )}
            <input aria-label="Upload Banner" type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar */}
              <div className="relative group inline-block">
                <Avatar 
                  className={`w-32 h-32 sm:w-40 sm:h-40 border-[6px] border-white shadow-xl bg-white transition-opacity ${!isEditing && user?.avatarUrl ? 'cursor-pointer hover:opacity-90' : ''}`}
                  onClick={() => { if (!isEditing && user?.avatarUrl) setViewingImage(optimizeImage(user.avatarUrl, 100, 100)); }}
                >
                  <AvatarImage alt={`${user?.firstName || 'User'}'s profile picture`} src={optimizeImage(isEditing ? formData.avatarUrl : user?.avatarUrl, 400, 400)} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 text-slate-600 text-4xl font-black">{user?.firstName?.[0]}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 border-[6px] border-transparent">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
                <input aria-label="Upload Avatar" type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 z-10 pb-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl px-6 h-11 font-bold shadow-sm transition-all flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        bio: user?.bio || '', 
                        department: user?.department || '', 
                        semester: user?.semester || '', 
                        section: user?.section || 'A', 
                        currentPosition: user?.currentPosition || '',
                        about: user?.about || '', 
                        skills: user?.skills?.join(', ') || '', 
                        avatarUrl: user?.avatarUrl || '', 
                        bannerUrl: user?.bannerUrl || '',
                        linkedin: user?.linkedin || '', 
                        instagram: user?.instagram || '',
                        github: user?.github || '' ,
                        portfolio: user?.portfolio || ''
                      });
                    }} variant="outline" className="rounded-xl px-6 h-11 font-bold text-slate-600 border-slate-200 hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving} 
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-11 font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 flex items-center gap-3 mb-2">
                {user?.firstName} {user?.lastName}
                {totalPoints > 50 && <span title="Top Contributor" className="flex shrink-0">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </span>}
              </h1>
              
              {!isEditing ? (
                <div className="animate-in fade-in duration-300">
                  <p className="text-lg text-slate-600 font-medium mb-4">{user?.bio || 'Student at IBA Hub'}</p>
                  
                  <div className="flex flex-wrap items-center gap-y-3 gap-x-4 text-sm font-semibold mb-4">
                    {user?.isAlumni ? (
                      <span className="flex items-center gap-1.5 bg-indigo-600 border border-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm">
                        <GraduationCap className="w-4 h-4" /> Alumni • Class of {user?.batch || '202X'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg">
                        <GraduationCap className="w-4 h-4" /> {user?.department}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                      <Users className="w-4 h-4" /> {connectionCount} Connections
                    </span>
                  </div>

                  {(user?.linkedin || user?.instagram || user?.github || user?.portfolio) && (
                  <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-100">
                    {user?.linkedin && (
                      <a href={ensureHttps(user.linkedin)} aria-label="LinkedIn Profile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5]/20 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                        <LinkedinIcon className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {user?.github && (
                      <a href={ensureHttps(user.github)} aria-label="GitHub Profile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                        <GithubIcon className="w-4 h-4" /> GitHub
                      </a>
                    )}
                    {user?.instagram && (
                      <a href={ensureHttps(user.instagram)} aria-label="Instagram Profile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                        <InstagramIcon className="w-4 h-4" /> Instagram
                      </a>
                    )}
                  </div>
                )}
                {/* Bottom Row: Portfolio Link */}
                    {user?.portfolio && (
                      <a href={ensureHttps(user.portfolio)} aria-label="Portfolio Website" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow w-fit mt-4">
                        <Globe className="w-4 h-4" />Portfolio Website
                      </a>
                    )}
                </div>
              ) : (
                <div className="mt-4 space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">Profile Headline (Bio)</label>
                    <input 
                      type="text" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} maxLength={150}
                      placeholder="E.g., Software Engineering Student | AI Enthusiast..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] outline-none transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200/60 pt-4 mt-2">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5"><LinkedinIcon className="w-3.5 h-3.5"/> LinkedIn</label>
                      <input aria-label="LinkedIn URL" type="url" value={formData.linkedin} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5"><GithubIcon className="w-3.5 h-3.5"/> GitHub</label>
                      <input aria-label="GitHub URL" type="url" value={formData.github} onChange={(e) => setFormData({...formData, github: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5"><InstagramIcon className="w-3.5 h-3.5"/> Instagram</label>
                      <input aria-label="Instagram URL" type="url" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Portfolio</label>
                      <input aria-label="Portfolio URL" type="url" value={formData.portfolio} onChange={(e) => setFormData({...formData, portfolio: e.target.value})} placeholder="https://your-website.com" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === TWO COLUMN LAYOUT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: About & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-indigo-500" /> About
              </h2>
              {!isEditing ? (
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {user?.about || "You haven't added a detailed bio yet."}
                </p>
              ) : (
                <textarea 
                  aria-label="About Me"
                  rows={5} value={formData.about} onChange={(e) => setFormData({...formData, about: e.target.value})} maxLength={500}
                  placeholder="Tell your peers a bit about yourself, your goals, and what you are learning..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0f172a] outline-none resize-none"
                />
              )}
            </div>

            {/* Recent Activity */}
            {!isEditing && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h2 className="font-black text-slate-900 text-lg flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-blue-500" /> Recent Platform Activity
                </h2>
                <div className="space-y-4">
                  {activity.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                      <p className="text-slate-500 font-bold">No recent activity yet. Start contributing!</p>
                    </div>
                  ) : (
                    activity.map((item) => (
                      <Link key={item._id} href={item.link} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all hover:shadow-sm group">
                        <div className={`p-3 rounded-xl shrink-0 ${
                          item.type === 'Voice Issue' ? 'bg-orange-100 text-orange-600' :
                          item.type === 'Forum Post' || item.type.includes('Answer') ? 'bg-blue-100 text-blue-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {item.type === 'Voice Issue' ? <AlertCircle className="w-5 h-5" /> :
                           item.type.includes('Answer') ? <CheckCircle2 className="w-5 h-5" /> :
                           item.type === 'Forum Post' ? <MessageSquare className="w-5 h-5" /> :
                           <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-black uppercase tracking-wider" style={{
                              color: item.type === 'Voice Issue' ? '#ea580c' : item.type.includes('Answer') || item.type === 'Forum Post' ? '#2563eb' : '#059669'
                            }}>{item.type}</p>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">{item.title}</h3>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-2.5 shrink-0" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Academic & Skills */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Academic Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 mb-5">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Academic Status
              </h2>
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Department</p>
                    <p className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{user?.department}</p>
                  </div>
                  
                  {user?.isAlumni ? (
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Current Position</p>
                      <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 px-3 py-2.5 rounded-lg">
                        <Briefcase className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-black text-indigo-900">{user?.currentPosition || 'Professional'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Semester</p>
                        <p className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{user?.semester}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Section</p>
                        <p className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{user?.section || 'A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Department</label>
                    <select aria-label="Select Department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] outline-none">
                      <option value="Computer Science">Computer Science</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Computer Systems Engineering">Computer Systems Eng</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Education">Education</option>
                      <option value="Media & Communications">Media & Communications</option>
                      <option value="Physical Education">Physical Education</option>
                    </select>
                  </div>

                  {user?.isAlumni ? (
                    <div className="mt-4">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Current Position</label>
                      <input 
                        type="text" 
                        value={formData.currentPosition} 
                        onChange={(e) => setFormData({...formData, currentPosition: e.target.value})} 
                        placeholder="e.g. Software Engineer at Systems Ltd" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] outline-none" 
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Semester</label>
                        <select aria-label="Select Semester" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] outline-none">
                          {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Section</label>
                        <select aria-label="Select Section" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] outline-none">
                          {['A','B','C','D','E','F','G','H'].map(sec => <option key={sec} value={sec}>{sec}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-orange-500" /> Skills & Interests
              </h2>
              {!isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {renderedSkills.length === 0 ? (
                    <p className="text-xs font-medium text-slate-500 italic">No skills added yet.</p>
                  ) : (
                    renderedSkills.map((skill: string, index: number) => (
                      <span key={index} className="bg-[#0f172a] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Comma Separated Skills</label>
                  <textarea 
                    aria-label="Edit Skills"
                    rows={3} value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="E.g., React, Python, Public Speaking, UI/UX..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#0f172a] outline-none resize-none"
                  />
                </div>
              )}
            </div>

            {/* Stats Card */}
            {!isEditing && (
              <div className="bg-gradient-to-br from-[#0f172a] to-slate-800 rounded-3xl shadow-md p-6 text-center border border-slate-700 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 mx-auto mb-3 backdrop-blur-md border border-white/20">
                <span title="Top Contributor" className="flex shrink-0">
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </span>
                </div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Contributor Points</p>
                <h3 className="text-5xl font-black text-white">{totalPoints}</h3>
                <Link href="/leaderboard" className="mt-4 inline-block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  View Leaderboard &rarr;
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}