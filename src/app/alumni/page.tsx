'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, MessageSquare, Star, ChevronDown, 
  UserPlus, UserCheck, Briefcase, 
  GraduationCap, Hourglass, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfileModal from '@/components/UserProfileModal'; 
import { optimizeImage } from '@/lib/cloudinary';

interface Alumni {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  department: string;
  batch: string;
  currentPosition?: string;
  skills: string[];
  contributorPoints: number;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'; 
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // 🚀 NEW: Frontend Pagination State (Load 12 at a time)
  const [visibleCount, setVisibleCount] = useState(12);

  const router = useRouter();

  const fetchAlumni = async () => {
    try {
      const res = await api.get('/users/alumni', {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      setAlumni(res.data.data);
    } catch (error) {
      console.error('Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get('/users/me');
        setCurrentUser(userRes.data?.data || userRes.data?.user || userRes.data);
      } catch (e) {
        router.push('/login');
      }
      fetchAlumni();
    };
    init();
  }, [router]);

  // 🚀 NEW: Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, departmentFilter, batchFilter]);

  const handleModalClose = () => {
    setSelectedUserId(null);
    fetchAlumni(); 
  };

  const displayedAlumni = alumni.filter(a => {
    const matchesSearch = `${a.firstName} ${a.lastName} ${a.currentPosition || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All' || a.department === departmentFilter;
    const matchesBatch = batchFilter === 'All' || a.batch === batchFilter;
    return matchesSearch && matchesDept && matchesBatch;
  });

  // 🚀 NEW: Only slice the array up to the visible count!
  const paginatedAlumni = displayedAlumni.slice(0, visibleCount);

  return (
    <>
    <title>Alumni Directory | IBA Hub</title>
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-16">
      
      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={handleModalClose} 
        userId={selectedUserId} 
      />

      {/* HERO SECTION */}
      <div className="bg-[#0f172a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-300 via-transparent to-transparent"></div>
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
          <div className="max-w-3xl text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4 flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 justify-center sm:justify-start">
              <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 shrink-0" />
              Alumni Network
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-medium leading-relaxed mb-6 sm:mb-8 px-2 sm:px-0">
              Connect with IBA Hub graduates worldwide. Seek mentorship, explore career paths, and build professional relationships with those who walked these halls before you.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl flex items-center shadow-2xl w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 ml-2 sm:ml-3 shrink-0" />
              <input 
                type="text"
                placeholder="Search alumni by name, company, or role..."
                className="w-full bg-transparent border-none text-white placeholder:text-slate-500 px-3 sm:px-4 py-2 sm:py-2 focus:ring-0 outline-none font-medium text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
        
        {/* FILTERS BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          
          <div className="w-full sm:flex-1 sm:min-w-[200px] relative">
            <select 
              aria-label='departments'
              value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3 outline-none focus:border-indigo-500 cursor-pointer transition-colors"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Media & Communications">Media & Communications</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="w-full sm:flex-1 sm:min-w-[150px] relative">
            <select 
              aria-label='batches'
              value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3 outline-none focus:border-indigo-500 cursor-pointer transition-colors"
            >
              <option value="All">All Batches</option>
              <option value="2024">Class of 2024</option>
              <option value="2023">Class of 2023</option>
              <option value="2022">Class of 2022</option>
              <option value="2021">Class of 2021</option>
              <option value="2020">Class of 2020</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-indigo-50 text-indigo-700 font-bold text-xs sm:text-sm rounded-xl border border-indigo-100 flex items-center justify-center gap-2 shrink-0">
            <Briefcase className="w-4 h-4" /> {displayedAlumni.length} Found
          </div>
        </div>

        {/* ALUMNI GRID */}
        {loading ? (
          <div className="py-20 text-center font-bold text-slate-500 tracking-widest uppercase animate-pulse text-sm sm:text-base">Loading Alumni Directory...</div>
        ) : displayedAlumni.length === 0 ? (
          <div className="py-16 sm:py-20 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1">No Alumni Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* 🚀 Changed to map over paginatedAlumni */}
              {paginatedAlumni.map(person => {
                const fullName = `${person.firstName} ${person.lastName}`;
                const status = person.connectionStatus;
                
                let connectionDisplay = null;
                if (status === 'accepted') {
                  connectionDisplay = <span className="flex items-center gap-1 text-emerald-600 font-bold text-[9px] sm:text-[10px] text-right"><UserCheck className="w-3 h-3 shrink-0"/> Connected</span>;
                } else if (status === 'pending_sent') {
                  connectionDisplay = <span className="flex items-center gap-1 text-yellow-600 font-bold text-[9px] sm:text-[10px] text-right"><Hourglass className="w-3 h-3 shrink-0"/> Pending</span>;
                } else if (status === 'pending_received') {
                  connectionDisplay = <span className="flex items-center gap-1 text-indigo-600 font-bold text-[9px] sm:text-[10px] text-right"><UserPlus className="w-3 h-3 shrink-0"/> Request Received</span>;
                }

                return (
                  <div key={person._id} className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer" onClick={() => setSelectedUserId(person._id)}>
                    
                    {/* Card Header Background */}
                    <div className="h-16 sm:h-20 bg-gradient-to-r from-indigo-50 to-slate-100 relative"></div>
                    
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 relative flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-white shadow-lg -mt-8 sm:-mt-10 bg-white shrink-0">
                          {/* 🚀 ADDED NATIVE LAZY LOADING */}
                          <AvatarImage alt='user profile' src={optimizeImage(person.avatarUrl, 150, 150)} loading="lazy" decoding="async" className="object-cover" />
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xl sm:text-2xl font-black">{person.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-end mt-1 sm:mt-2 shrink-0 max-w-[50%]">
                          <span className="bg-indigo-50 text-indigo-700 text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100 mb-1 truncate max-w-full">
                            Class of {person.batch || '2022'}
                          </span>
                          {connectionDisplay}
                        </div>
                      </div>

                      <div className="mb-3 sm:mb-4 flex-1">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors leading-tight mb-0.5">
                          <span className="truncate">{fullName}</span>
                          {person.contributorPoints > 50 && <span title="Top Contributor" className="shrink-0 flex">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                          </span>}
                        </h3>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-2 sm:mb-3 truncate">{person.department}</p>
                        
                        <div className="flex items-start gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 mb-3 sm:mb-4">
                          <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                            {person.currentPosition || "Professional Alumni"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {person.skills && person.skills.length > 0 ? (
                            person.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-lg">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium italic">No skills listed</span>
                          )}
                          {person.skills && person.skills.length > 3 && (
                            <span className="bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-lg">+{person.skills.length - 3}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-100">
                        <button className="w-full py-2 sm:py-2.5 bg-slate-900 group-hover:bg-indigo-600 text-white text-[10px] sm:text-xs font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2">
                          View Profile
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🚀 NEW: Load More Button */}
            {visibleCount < displayedAlumni.length && (
              <div className="flex justify-center mt-10 mb-8">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  Load More Alumni <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}