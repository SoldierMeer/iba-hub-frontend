'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from '@/components/NotificationBell';
import { 
  Search, Loader2, User as UserIcon, MessageSquare, FileText, 
  AlertCircle, LogOut, Menu, X, Star, Users, GraduationCap, ChevronRight
} from 'lucide-react';

import { optimizeImage } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  // ✅ ADD THIS INSTEAD
  const { user, isAuthenticated } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], resources: [], complaints: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 🚀 NEW: Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🚀 Close mobile menu and dropdown automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
    setSearchQuery('');
  }, [pathname]);

  // 🚀 Lock background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Global Search Debounce Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [], resources: [], complaints: [] });
      setShowDropdown(false);
      return;
    }

    const fetchSearch = async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${searchQuery}`);
        setSearchResults(res.data.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => fetchSearch(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
      localStorage.clear();
      sessionStorage.clear();

      // 🚀 THE FIX: Destroy the Next.js Server Component cookie
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed, forcing clean-up:', error);
      localStorage.clear();
      sessionStorage.clear();

      // 🚀 THE FIX: Ensure the cookie is destroyed even if the API call fails
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      window.location.href = '/';
    }
  };

  // 🚀 NEW: This prevents the 2-second freeze on page load!
  const navigateInstantly = (path: string) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open
    startTransition(() => {
      router.push(path);
    });
  };

  const handleResultClick = (path: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    navigateInstantly(path); // 🚀 UPDATED
  };

  const hasResults = searchResults.users.length > 0 || searchResults.posts.length > 0 || 
                     searchResults.resources.length > 0 || searchResults.complaints.length > 0;

 // Premium Desktop Nav Link
// Revert back to standard Next.js Links to trigger loading.tsx
const NavLink = ({ href, label }: { href: string, label: string }) => {
  const isActive = pathname.startsWith(href);
  return (
    <Link 
      href={href} 
      onClick={() => setIsMobileMenuOpen(false)}
      className={`relative h-full flex items-center px-3 text-sm font-bold transition-colors duration-200 ${
        isActive ? 'text-[#0f172a]' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#0f172a] rounded-t-full shadow-[0_-2px_10px_rgba(15,23,42,0.1)] animate-in fade-in zoom-in-95 duration-300" />
      )}
    </Link>
  );
};

const MobileNavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: any }) => {
  const isActive = pathname.startsWith(href);
  return (
    <Link 
      href={href} 
      onClick={() => setIsMobileMenuOpen(false)}
      className={`flex items-center justify-between p-4 rounded-2xl transition-all font-bold ${
        isActive 
          ? 'bg-[#0f172a] text-white shadow-md' 
          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
        {label}
      </div>
      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white/70' : 'text-slate-300'}`} />
    </Link>
  );
};


  return (
    <>
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm transition-all h-16">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between h-full items-center">
            
            <div className="flex items-center gap-8 flex-1 h-full">
              {/* LOGO - Routes to Home/Dashboard */}
              <Link href="/" className="text-2xl font-black text-[#0f172a] tracking-tight shrink-0 flex items-center h-full">
                IBA Hub
              </Link>

              {/* 💻 DESKTOP: Global Search Bar */}
              {isAuthenticated && (
                <div className="relative max-w-md w-full hidden md:block" ref={searchRef}>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#0f172a] focus-within:border-[#0f172a] transition-all shadow-sm">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search peers, forums, resources..." 
                      className="w-full pl-2 pr-2 bg-transparent border-none text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                    />
                    {isSearching && <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />}
                  </div>

                  {/* 💻 DESKTOP: Spotlight Search Dropdown */}
                  {showDropdown && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {!hasResults && !isSearching ? (
                        <div className="p-6 text-center text-sm font-bold text-slate-400">No results found for "{searchQuery}"</div>
                      ) : (
                        <div className="py-2">
                          {searchResults.users.length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">Peers</div>
                              {searchResults.users.map((u: any) => (
                                <div key={u._id} onClick={() => handleResultClick(`/chat?userId=${u._id}`)} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors">
                                  <Avatar className="h-7 w-7 border border-slate-200"><AvatarImage src={optimizeImage(u.avatarUrl, 80, 80)}/><AvatarFallback><UserIcon className="h-3 w-3"/></AvatarFallback></Avatar>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                    <p className="text-[10px] font-semibold text-slate-500">{u.department}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.posts.length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">Forum Posts</div>
                              {searchResults.posts.map((p: any) => (
                                <div key={p._id} onClick={() => handleResultClick(`/forum`)} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors">
                                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shrink-0"><MessageSquare className="h-3.5 w-3.5" /></div>
                                  <p className="text-sm font-bold text-slate-800 truncate">{p.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.resources.length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">Resources</div>
                              {searchResults.resources.map((r: any) => (
                                <div key={r._id} onClick={() => handleResultClick(`/resources`)} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors">
                                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md shrink-0"><FileText className="h-3.5 w-3.5" /></div>
                                  <p className="text-sm font-bold text-slate-800 truncate">{r.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.complaints.length > 0 && (
                            <div>
                              <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">IBA Voice</div>
                              {searchResults.complaints.map((c: any) => (
                                <div key={c._id} onClick={() => handleResultClick(`/voice`)} className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors">
                                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md shrink-0"><AlertCircle className="h-3.5 w-3.5" /></div>
                                  <p className="text-sm font-bold text-slate-800 truncate">{c.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 💻 DESKTOP: Navigation Links */}
            <div className="items-center h-full gap-1 hidden md:flex">
              <NavLink href="/resources" label="Resources" />
              <NavLink href="/forum" label="Forum" />
              <NavLink href="/leaderboard" label="Leaderboard" />

              {isAuthenticated && (
                <>
                  <div className="h-5 w-px bg-slate-200 mx-2" />
                  <NavLink href="/alumni" label="Alumni" />
                  <NavLink href="/chat" label={user?.isAlumni ? "Messages" : "Connect"} />
                  <NavLink href="/voice" label="Voice" />
                  
                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                     <NavLink href="/admin" label="Admin" />
                  )}
                  
                  <div className="px-2 flex items-center h-full">
                    <NotificationBell />
                  </div>

                  <Link href="/profile" className="flex items-center h-full">
                    <Avatar className="h-9 w-9 border-2 border-slate-100 hover:border-[#0f172a] transition-all cursor-pointer ml-2 shadow-sm">
                      <AvatarImage src={optimizeImage(user?.avatarUrl, 100, 100)} alt={`${user?.firstName}'s avatar`} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-800 text-xs font-bold">{user?.firstName?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    title="Log Out"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-2"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <div className="flex items-center h-full gap-3 ml-4">
                  <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-[#0f172a] transition-colors px-2">Log In</Link>
                  <Link href="/register">
                    <Button className="bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl px-5 h-10 font-bold shadow-sm transition-all">Register</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* 📱 MOBILE: Hamburger Menu Trigger & Notification Bell */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && <NotificationBell />}
              <button 
                aria-label="Open Mobile Menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* 📱 MOBILE: Full-Screen Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-slate-50/95 backdrop-blur-xl z-40 md:hidden flex flex-col overflow-y-auto animate-in slide-in-from-top-2 duration-200 pb-10">
          
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Mobile User Profile Summary */}
            {isAuthenticated && user && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={optimizeImage(user?.avatarUrl, 100, 100)} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-800 text-base font-bold">{user.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">{user.firstName} {user.lastName}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{user.department}</p>
                  </div>
                </div>
                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  View
                </Link>
              </div>
            )}

            {/* Mobile Search Bar */}
            {isAuthenticated && (
              <div className="relative w-full">
                <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0f172a] focus-within:border-[#0f172a] transition-all shadow-sm">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search peers, forums, resources..." 
                    className="w-full pl-3 pr-2 bg-transparent border-none text-base font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && <Loader2 className="h-5 w-5 text-slate-400 animate-spin shrink-0" />}
                </div>

                {/* Mobile Search Dropdown (Inline) */}
                {searchQuery.trim() && hasResults && (
                   <div className="mt-2 w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                      <div className="py-2">
                        {searchResults.users.length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">Peers</div>
                            {searchResults.users.map((u: any) => (
                              <div key={u._id} onClick={() => handleResultClick(`/chat?userId=${u._id}`)} className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0">
                                <Avatar className="h-8 w-8 border border-slate-200"><AvatarImage src={optimizeImage(u.avatarUrl, 80, 80)}/><AvatarFallback><UserIcon className="h-3 w-3"/></AvatarFallback></Avatar>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                  <p className="text-[10px] font-semibold text-slate-500">{u.department}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Similar styling applied to other search sections for mobile */}
                        {searchResults.posts.length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50/50">Forum Posts</div>
                            {searchResults.posts.map((p: any) => (
                              <div key={p._id} onClick={() => handleResultClick(`/forum`)} className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><MessageSquare className="h-4 w-4" /></div>
                                <p className="text-sm font-bold text-slate-800 truncate">{p.title}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* ... Resources and Complaints styled identically ... */}
                      </div>
                   </div>
                )}
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <MobileNavLink href="/resources" label="Resources & Notes" icon={FileText} />
              <MobileNavLink href="/forum" label="Student Forum" icon={MessageSquare} />
              <MobileNavLink href="/leaderboard" label="Leaderboard" icon={Star} />
              
              {isAuthenticated && (
                <>
                  <div className="h-px w-full bg-slate-200 my-4" />
                  <MobileNavLink href="/alumni" label="Alumni Network" icon={GraduationCap} />
                  <MobileNavLink href="/chat" label={user?.isAlumni ? "Connect" : "Connect & Chat"} icon={Users} />
                  <MobileNavLink href="/voice" label="IBA Voice" icon={AlertCircle} />
                  
                  {(user?.role === 'admin' || user?.role === 'moderator') && (
                     <MobileNavLink href="/admin" label="Admin Dashboard" icon={AlertCircle} />
                  )}
                </>
              )}
            </div>

            {/* Mobile Logout / Auth Actions */}
            <div className="pt-4 border-t border-slate-200 mt-6">
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl h-12 font-bold transition-all shadow-sm">Log In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl h-12 font-bold transition-all shadow-md">Create Account</Button>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}