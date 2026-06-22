import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Search, Users, GraduationCap, UserCheck, Hourglass, UserPlus, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { User } from '@/app/chat/page';
import { optimizeImage } from '@/lib/cloudinary';

interface NetworkViewProps {
  currentUser: any;
  directory: User[];
  displayedDirectory: User[];
  suggestedConnections: User[];
  statusQueueUsers: User[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
  semesterFilter: string;
  setSemesterFilter: (v: string) => void;
  showConnectionsOnly: boolean;
  sectionFilter: string;
  setSectionFilter: (v: string) => void;
  setShowConnectionsOnly: (v: boolean) => void;
  handleConnectionAction: (id: string, action: any, name: string) => void;
  setSelectedProfile: (user: User) => void;
  router: any;
  handleUserSelect: (user: User) => void; 
}

export default function NetworkView({
  currentUser, directory, displayedDirectory, suggestedConnections, statusQueueUsers,
  searchTerm, setSearchTerm, departmentFilter, setDepartmentFilter,
  semesterFilter, setSemesterFilter, sectionFilter, setSectionFilter, showConnectionsOnly, setShowConnectionsOnly,
  handleConnectionAction, setSelectedProfile, router, handleUserSelect
}: NetworkViewProps) {

  const DEPARTMENTS = [
    "Computer Science", "Business Administration", "Computer Systems Engineering", 
    "Electrical Engineering", "Mathematics", "Education", 
    "Media & Communications", "Physical Education"
  ];
  const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  
  return (
    <div className="animate-in fade-in duration-300 px-4 sm:px-0 mt-6 sm:mt-0">
      {/* Header & Stats */}
      {currentUser?.isAlumni ? (
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" /> Alumni Hub
          </h1>
          <p className="text-sm sm:text-lg text-slate-500 font-medium">Manage your connections and incoming messages from students and peers.</p>
        </div>
      ) : (
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-2 sm:mb-3">Connect</h1>
          <p className="text-sm sm:text-lg text-slate-500 font-medium mb-4 sm:mb-6">Find students, build connections, and chat directly across departments.</p>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-bold text-slate-700">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" /> {directory.filter(u => !u.isAlumni).length + 1} Registered
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-bold text-slate-700">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></div> {directory.filter(u => u.isOnline && !u.isAlumni).length + 1} Online
            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR (Hidden for Alumni as requested) */}
      {!currentUser?.isAlumni && (
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 mb-6 sm:mb-8 flex flex-col xl:flex-row items-center gap-3 sm:gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search students by name..." 
              className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0f172a] focus:bg-white transition-all outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-2 sm:gap-3 w-full xl:w-auto">
            {/* Department Filter */}
            <select aria-label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl px-2 sm:pl-4 sm:pr-8 py-2 sm:py-2.5 outline-none focus:border-[#0f172a] cursor-pointer">
              <option value="All">Dept</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            
            {/* Semester Filter */}
            <select aria-label="Semester" value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl px-2 sm:pl-4 sm:pr-8 py-2 sm:py-2.5 outline-none focus:border-[#0f172a] cursor-pointer">
              <option value="All">Sem</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Section Filter */}
            <select aria-label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl px-2 sm:pl-4 sm:pr-8 py-2 sm:py-2.5 outline-none focus:border-[#0f172a] cursor-pointer">
              <option value="All">Sec</option>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between w-full xl:w-auto pt-1 sm:pt-0">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors shrink-0">
              <input type="checkbox" checked={showConnectionsOnly} onChange={(e) => setShowConnectionsOnly(e.target.checked)} className="rounded text-[#0f172a] focus:ring-[#0f172a] border-slate-300 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-bold text-slate-700">My Connections</span>
            </label>
            <button 
              onClick={() => { 
                setSearchTerm(''); setDepartmentFilter('All'); 
                setSemesterFilter('All'); setSectionFilter('All'); 
                setShowConnectionsOnly(false); 
              }} 
              className="text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 px-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
        
        {/* 🚀 FIXED: Removed the if/else Alumni block here! Now Alumni and Students use the exact same grid, but the data is automatically filtered by useMemo! */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 order-2 lg:order-1">
          {displayedDirectory.length === 0 ? (
            <div className="col-span-full py-16 sm:py-20 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm px-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-slate-500 font-bold">
                {currentUser?.isAlumni ? "You don't have any active connections yet." : "No students found matching your criteria."}
              </p>
            </div>
          ) : (
          displayedDirectory.map(user => {
            const status = user.connectionStatus;
            const fullName = `${user.firstName} ${user.lastName}`;

            let connectionButton = null;
            if (status === 'accepted') {
              connectionButton = (
                <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="w-full py-2 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm border">
                  <UserCheck className="w-3.5 h-3.5" /> Connected
                </button>
              );
            } else if (status === 'pending_sent') {
                connectionButton = (
                  <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="w-full py-2 text-xs font-bold rounded-lg bg-white border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm border">
                    <Hourglass className="w-3.5 h-3.5" /> Pending
                  </button>
                );
            } else if (status === 'pending_received') {
                connectionButton = (
                  <div className="w-full grid grid-cols-2 gap-1.5">
                     <button onClick={() => handleConnectionAction(user._id, 'accept', fullName)} className="py-2 text-[10px] sm:text-xs font-bold rounded-lg bg-blue-600 border border-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1 shadow-sm border">Accept</button>
                     <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="py-2 text-[10px] sm:text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 shadow-sm border">Decline</button>
                  </div>
                );
            } else if (status === 'rejected') {
                connectionButton = (
                  <button onClick={() => handleConnectionAction(user._id, 'send', fullName)} className="w-full py-2 text-[10px] sm:text-xs font-bold rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm border">
                    <UserPlus className="w-3.5 h-3.5" /> Send Again
                  </button>
                );
            } else {
                connectionButton = (
                  <button onClick={() => handleConnectionAction(user._id, 'send', fullName)} className="w-full py-2 text-[10px] sm:text-xs font-bold rounded-lg bg-[#0f172a] border-[#0f172a] hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm border">
                    <UserPlus className="w-3.5 h-3.5" /> Connect
                  </button>
                );
            }

            return (
              <div key={user._id} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white shadow-sm cursor-pointer" onClick={() => setSelectedProfile(user)}>
                      <AvatarImage alt='user profile' src={optimizeImage(user.avatarUrl, 100, 100)} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-base sm:text-lg font-bold">{user.firstName[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  {user.isOnline ? (
                    <span className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50 text-emerald-700 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 text-slate-500 text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border border-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Offline
                    </span>
                  )}
                </div>
                
                <div className="mb-4 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1 cursor-pointer hover:underline truncate" onClick={() => setSelectedProfile(user)}>
                    <span className="truncate">{fullName}</span> {user.contributorPoints > 50 && <span title="Top Contributor" className="flex shrink-0">
                      <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                      </span>}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2 truncate">{user.department} • Sem {user.semester?.replace(/\D/g,'')} • Sec {user.section || 'A'}</p>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {user.headline || `Studying ${user.department} at IBA Hub.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                  {connectionButton}
                  <button 
                    onClick={() => handleUserSelect(user)} 
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </button>
                </div>
              </div>
            )
          })
        )}
        </div>

        {/* Right Sidebars */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-1 lg:order-2">
          
          {/* Suggested Connections (Hidden for Alumni) */}
          {!currentUser?.isAlumni && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h3 className="font-black text-slate-900 text-[10px] sm:text-xs uppercase tracking-wider mb-3 sm:mb-4">Suggested Connections</h3>
            {suggestedConnections.length === 0 ? (
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 italic">No suggestions right now. Explore the directory!</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {suggestedConnections.map(user => {
                   const fullName = `${user.firstName} ${user.lastName}`;
                   return (
                      <div key={user._id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1" onClick={() => setSelectedProfile(user)}>
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-slate-200 bg-slate-50 shrink-0">
                            <AvatarImage alt='user profile' src={optimizeImage(user.avatarUrl, 100, 100)} />
                            <AvatarFallback className="text-[10px] sm:text-xs font-bold text-slate-500">{user.firstName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 hover:underline truncate">{fullName}</p>
                            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 truncate">{user.department}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleConnectionAction(user._id, 'send', fullName)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
                          title="Connect"
                        >
                          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                  )
                })}
              </div>
            )}
          </div>
          )}

          {/* Connection Status Sidebar */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h3 className="font-black text-slate-900 text-[10px] sm:text-xs uppercase tracking-wider mb-3 sm:mb-4">Connection Status</h3>
            {statusQueueUsers.length === 0 ? (
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 italic">No pending requests.</p>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[350px] overflow-y-auto pr-1">
                {statusQueueUsers.map(user => {
                  const fullName = `${user.firstName} ${user.lastName}`;
                  return (
                    <div key={user._id} className="flex flex-col gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => setSelectedProfile(user)}>
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-slate-200 shrink-0">
                          <AvatarImage alt='user profile' src={optimizeImage(user.avatarUrl, 100, 100)} />
                          <AvatarFallback className="text-[9px] sm:text-[10px] font-bold">{user.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:underline">{fullName}</p>
                          <p className={`text-[9px] sm:text-[10px] font-bold truncate ${
                            user.connectionStatus === 'pending_received' ? 'text-blue-600' :
                            user.connectionStatus === 'rejected' ? 'text-red-500' : 'text-yellow-600'
                          }`}>
                            {user.connectionStatus === 'pending_sent' && 'Request Sent'}
                            {user.connectionStatus === 'pending_received' && 'Wants to connect'}
                            {user.connectionStatus === 'rejected' && 'Request Declined'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                        {user.connectionStatus === 'pending_sent' && (
                          <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors">Cancel Request</button>
                        )}
                        {user.connectionStatus === 'pending_received' && (
                          <>
                            <button onClick={() => handleConnectionAction(user._id, 'accept', fullName)} className="flex-1 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors">Accept</button>
                            <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors">Decline</button>
                          </>
                        )}
                        {user.connectionStatus === 'rejected' && (
                          <>
                            <button onClick={() => handleConnectionAction(user._id, 'send', fullName)} className="flex-1 py-1.5 bg-[#0f172a] text-white hover:bg-slate-800 text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors">Send Again</button>
                            <button onClick={() => handleConnectionAction(user._id, 'remove', fullName)} className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-[9px] sm:text-[10px] font-bold rounded-lg transition-colors">Clear</button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}