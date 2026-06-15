'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { GraduationCap, Sparkles, Briefcase, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GraduationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentPosition, setCurrentPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [delayLoading, setDelayLoading] = useState(false); 

  useEffect(() => {
    const checkGraduationStatus = async () => {
      const path = window.location.pathname;
      if (path === '/login' || path === '/register') return;

      try {
        const res = await api.get('/users/me');
        const userData = res.data?.data || res.data?.user || res.data;
        
        if (!userData || userData.isAlumni) return;

        // 1. Get current date info
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // Jan = 0, May = 4, Dec = 11

        // 2. Parse the IBA Email format: e.g., bscsf23@iba-suk.edu.pk
        // Group 1: (b|m) -> Bachelors or Masters
        // Group 2: (f|s) -> Fall or Spring
        // Group 3: (\d{2}) -> Year
        const emailRegex = /(b|m)[a-z]*(f|s)(\d{2})@/i;
        const match = userData.email.match(emailRegex);

        // Default to May (4) if somehow the email doesn't strictly match
        let graduationMonth = 4; 

        if (match) {
            const season = match[2].toLowerCase(); // 'f' or 's'
            // Fall admissions graduate in May (4). Spring admissions graduate in December (11).
            graduationMonth = season === 'f' ? 4 : 11;
        }

        // 3. Logic: Have they passed their specific graduation Year AND Month?
        // Note: We use userData.graduationYear from the DB because it respects the "Snooze" button (+1 year)
        const hasPassedGradYear = userData.graduationYear < currentYear;
        const isGraduatingThisMonth = userData.graduationYear === currentYear && currentMonth >= graduationMonth;

        if (hasPassedGradYear || isGraduatingThisMonth) {
          setUser(userData);
          setIsOpen(true);
        }

      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error("Failed to check graduation status", error);
        }
      }
    };
    
    checkGraduationStatus();
  }, []);

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPosition.trim()) return toast.error("Please enter your current position!");
    
    setLoading(true);
    const toastId = toast.loading("Transitioning your profile...");

    try {
      await api.put('/users/become-alumni', { currentPosition });
      toast.success("Welcome to the Alumni Network!", { id: toastId });
      setIsOpen(false);
      
      setTimeout(() => window.location.reload(), 1500); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile", { id: toastId });
      setLoading(false);
    }
  };

  const handleDelayGraduation = async () => {
    setDelayLoading(true);
    const toastId = toast.loading("Updating your academic timeline...");

    try {
      // Backend sets graduationYear = currentYear + 1
      await api.put('/users/delay-graduation'); 
      toast.success("Got it! We'll check back with you next year.", { id: toastId });
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update timeline", { id: toastId });
      setDelayLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
        
        {/* Confetti / Celebration Header */}
        <div className="h-40 bg-gradient-to-br from-indigo-600 via-blue-700 to-[#0f172a] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
          <div className="absolute top-4 left-4 text-white/20"><Sparkles className="w-12 h-12" /></div>
          <div className="absolute bottom-4 right-4 text-white/20"><Sparkles className="w-16 h-16" /></div>
          
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/40 shadow-xl z-10">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Congratulations, Class of {user?.graduationYear}!</h2>
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            According to your IBA email, your academic journey has come to an end! It's time to officially transition your profile from the Student Directory to our exclusive <span className="font-bold text-indigo-600">Alumni Network</span>.
          </p>

          <form onSubmit={handleTransition} className="text-left">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
              Where are you now?
            </label>
            <div className="relative mb-6">
              <Briefcase className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="e.g. Software Engineer at Systems Ltd, or Seeking Opportunities" 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                disabled={loading || delayLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || delayLoading}
              className="w-full py-4 bg-[#0f172a] hover:bg-slate-800 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
            >
              {loading ? "Updating..." : "Join Alumni Network"} <ChevronRight className="w-5 h-5" />
            </button>
            
            <button 
              type="button" 
              onClick={handleDelayGraduation}
              disabled={loading || delayLoading}
              className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {delayLoading ? "Updating..." : "I haven't graduated yet"}
            </button>

          </form>
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            Your connections and points will carry over.
          </p>
        </div>
      </div>
    </div>
  );
}