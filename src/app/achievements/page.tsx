'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { 
  Briefcase, GraduationCap, Award, Megaphone, 
  Send, Image as ImageIcon, X, ThumbsUp, 
  PartyPopper, HeartHandshake, Lightbulb 
} from 'lucide-react';
import { optimizeImage } from '@/lib/cloudinary';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  headline?: string;
}

interface Reaction {
  user: string;
  type: 'Like' | 'Celebrate' | 'Support' | 'Insightful';
}

interface Achievement {
  _id: string;
  author: Author;
  title: string;
  description: string;
  category: 'Job' | 'Internship' | 'Certificate' | 'Award' | 'Alumni Update' | 'Other';
  mediaUrl?: string;
  reactions: Reaction[]; 
  createdAt: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Internship');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/achievements');
      setAchievements(res.data.data);
    } catch (error) {
      console.error('Failed to load achievements', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
        try {
          const userRes = await api.get('/users/me'); 
          
          // 1. Let's see EXACTLY what the backend is sending back
          console.log("🚀 API /me Response:", userRes.data); 
  
          // 2. Try to grab the ID from the 3 most common MERN stack payload structures
          const id = userRes.data?.data?._id || userRes.data?.user?._id || userRes.data?._id;
          
          if (id) {
            setCurrentUserId(id);
            console.log("✅ Successfully set currentUserId:", id);
          } else {
            console.warn("⚠️ API succeeded, but couldn't find an _id field in the response!");
          }
        } catch (error: any) {
          console.error("❌ Session fetch failed:", error.response?.status, error.response?.data || error.message);
        }
      };

    fetchCurrentUser();
    fetchAchievements();
  }, []);

  // Convert uploaded file to Base64 string
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/achievements', {
        title,
        description,
        category,
        mediaUrl
      });
      
      setAchievements([res.data.data, ...achievements]);
      
      // Clear form
      setTitle('');
      setDescription('');
      setCategory('Internship');
      setMediaUrl(null);
    } catch (error) {
      console.error('Failed to post achievement', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimistic UI update for reactions
  const handleReaction = async (postId: string, type: 'Like' | 'Celebrate' | 'Support' | 'Insightful' | null) => {
    // 1. Instantly update the UI (0ms lag)
    setAchievements(prev => prev.map(post => {
      if (post._id !== postId) return post;
      
      // Remove any previous reaction by this user to prevent duplicates locally
      let newReactions = post.reactions.filter(r => r.user !== currentUserId);
      
      // Add the new reaction if they clicked one
      if (type && currentUserId) {
        newReactions.push({ user: currentUserId, type });
      }
      
      return { ...post, reactions: newReactions };
    }));

    // 2. Perform background API Call to save to database
    try {
      const res = await api.put(`/achievements/${postId}/react`, { type });
      // Silently sync with real database data
      setAchievements(prev => prev.map(post => 
        post._id === postId ? { ...post, reactions: res.data.data } : post
      ));
    } catch (error) {
      console.error('Failed to react, rolling back', error);
      fetchAchievements(); // Rollback if the server fails
    }
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'Internship': return { color: 'bg-emerald-100 text-emerald-700', icon: <Briefcase className="w-4 h-4 mr-1" /> };
      case 'Job': return { color: 'bg-blue-100 text-blue-700', icon: <Briefcase className="w-4 h-4 mr-1" /> };
      case 'Certificate': return { color: 'bg-amber-100 text-amber-700', icon: <GraduationCap className="w-4 h-4 mr-1" /> };
      case 'Award': return { color: 'bg-purple-100 text-purple-700', icon: <Award className="w-4 h-4 mr-1" /> };
      case 'Alumni Update': return { color: 'bg-slate-200 text-slate-700', icon: <Megaphone className="w-4 h-4 mr-1" /> };
      default: return { color: 'bg-gray-100 text-gray-700', icon: null };
    }
  };

  const getReactionIcon = (type: string, className = "w-5 h-5") => {
    switch(type) {
      case 'Like': return <ThumbsUp className={`${className} text-blue-600`} />;
      case 'Celebrate': return <PartyPopper className={`${className} text-emerald-600`} />;
      case 'Support': return <HeartHandshake className={`${className} text-purple-600`} />;
      case 'Insightful': return <Lightbulb className={`${className} text-amber-500`} />;
      default: return <ThumbsUp className={`${className} text-slate-500`} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Campus Professional Network</h1>
        <p className="text-slate-500 mt-1">Celebrate your wins, share certificates, and connect with IBA alumni.</p>
      </div>

      {/* Share a Win Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <input 
                type="text" 
                placeholder="What did you achieve? (e.g., Summer Internship at Devsinc)" 
                className="w-full text-lg font-semibold placeholder-slate-400 border-none focus:ring-0 p-0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea 
                placeholder="Share the details with your network..." 
                className="w-full resize-none text-slate-600 placeholder-slate-400 border-none focus:ring-0 p-0"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              
              {/* Image Preview Area */}
              {mediaUrl && (
                <div className="relative mt-2 inline-block">
                  <img src={mediaUrl} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-slate-200" />
                  <button 
                    type="button"
                    onClick={() => setMediaUrl(null)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-sm hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Internship">Internship</option>
                <option value="Job">Job</option>
                <option value="Certificate">Certificate</option>
                <option value="Award">Award</option>
                <option value="Alumni Update">Alumni Update</option>
                <option value="Other">Other</option>
              </select>

              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                title="Attach an image or certificate"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !title || !description}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Share Win'}
            </Button>
          </div>
        </form>
      </div>

      {/* The Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading network updates...</div>
        ) : achievements.length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
            No achievements posted yet. Be the first to share a win!
          </div>
        ) : (
          achievements.map((post) => {
            const config = getCategoryConfig(post.category);
            
            // Checks using the real logged-in ID
            const userReaction = post.reactions.find(r => r.user === currentUserId);

            return (
              <div key={post._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <Avatar className="w-12 h-12 border border-slate-100">
                      <AvatarImage src={optimizeImage(post.author?.avatarUrl, 100, 100)} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {post.author?.firstName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">
                        {post.author?.firstName} {post.author?.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {post.author?.headline || 'IBA Student'} • {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  {post.category !== 'Other' && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${config.color}`}>
                      {config.icon}
                      {post.category}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-lg text-slate-900 mb-1.5">{post.title}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.description}</p>
                </div>

                {post.mediaUrl && (
                  <div className="mb-4 mt-2 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img 
                      src={post.mediaUrl} 
                      alt="Achievement media" 
                      className="w-full h-auto max-h-[500px] object-contain" 
                    />
                  </div>
                )}

                {/* --- REACTION SYSTEM --- */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between relative group">
                  
                  {/* The Main Reaction Button */}
                  <button 
                    onClick={() => handleReaction(post._id, userReaction ? null : 'Like')}
                    className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {userReaction ? getReactionIcon(userReaction.type) : <ThumbsUp className="w-5 h-5 text-slate-500" />}
                    <span className={userReaction ? "font-bold text-slate-800" : ""}>
                      {userReaction ? userReaction.type : 'React'}
                    </span>
                  </button>

                  {/* Hover Menu */}
                  <div className="absolute left-0 -top-12 bg-white border border-slate-200 shadow-lg rounded-full px-3 py-2 flex gap-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 scale-95 group-hover:scale-100">
                    <button onClick={() => handleReaction(post._id, 'Like')} className="hover:-translate-y-1 transition-transform" title="Like">
                      <ThumbsUp className="w-6 h-6 text-blue-600 fill-blue-50" />
                    </button>
                    <button onClick={() => handleReaction(post._id, 'Celebrate')} className="hover:-translate-y-1 transition-transform" title="Celebrate">
                      <PartyPopper className="w-6 h-6 text-emerald-600 fill-emerald-50" />
                    </button>
                    <button onClick={() => handleReaction(post._id, 'Support')} className="hover:-translate-y-1 transition-transform" title="Support">
                      <HeartHandshake className="w-6 h-6 text-purple-600 fill-purple-50" />
                    </button>
                    <button onClick={() => handleReaction(post._id, 'Insightful')} className="hover:-translate-y-1 transition-transform" title="Insightful">
                      <Lightbulb className="w-6 h-6 text-amber-500 fill-amber-50" />
                    </button>
                  </div>

                  {/* Reaction Count Display */}
                  {post.reactions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer hover:underline">
                      <div className="flex -space-x-1.5">
                        {Array.from(new Set(post.reactions.map(r => r.type))).slice(0, 3).map((type, i) => (
                          <span key={i} className="bg-white rounded-full p-0.5 border border-slate-100">
                            {getReactionIcon(type, "w-3 h-3")}
                          </span>
                        ))}
                      </div>
                      <span>{post.reactions.length}</span>
                    </div>
                  )}
                  
                </div>
                
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}