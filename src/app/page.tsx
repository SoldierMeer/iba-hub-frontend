'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  FileText, MessageSquare, Users, AlertTriangle, BarChart2, 
  ThumbsUp, ArrowRight, BookOpen, Clock, CheckCircle2, TrendingUp, Bell,
  GraduationCap, ExternalLink, FileArchive, Presentation, Image as ImageIcon, File, Github, Linkedin, Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomeDashboard() {
  const [user, setUser] = useState<any>(null);
  
  // 🚀 OPTIMIZATION 1: We start loading, but we will turn it off MUCH earlier.
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Real Data States
  const [recentResources, setRecentResources] = useState<any[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    resourcesCount: 0,
    queriesCount: 0,
    onlineStudents: 0,
    userRank: '-'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      let isAuthenticated = false;
      let currentUser = null;

      // 1. Fetch User Data First
      try {
        const userRes = await api.get('/users/me', { headers: { 'Cache-Control': 'no-cache' } });
        currentUser = userRes.data?.data || userRes.data?.user || userRes.data;
        setUser(currentUser);
        isAuthenticated = true;
      } catch (error) {
        setUser(null); 
      }

      // 🚀 OPTIMIZATION 2: UNBLOCK THE UI INSTANTLY!
      // The moment we know who the user is, we paint the Hero section to the screen. 
      // We don't wait for the heavy stats and arrays to finish downloading.
      setIsLoading(false);

      // 2. Fetch Public Data (In the background)
      Promise.all([
        api.get('/resources').catch(() => ({ data: { data: [] } })),
        api.get('/forum').catch(() => ({ data: { data: [] } })),
        api.get('/announcements').catch(() => ({ data: { data: [] } })),
        api.get('/stats/overview').catch(() => ({ data: { data: { resourcesCount: 0, queriesCount: 0, onlineStudents: 0 } } }))
      ]).then(([resReq, forumReq, annReq, statsReq]) => {
        setRecentResources(resReq.data?.data?.slice(0, 3) || []);
        
        const allQueries = forumReq.data?.data || [];
        const sortedTrending = allQueries.sort((a: any, b: any) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0)).slice(0, 2);
        setTrendingQueries(sortedTrending);

        setAnnouncements(annReq.data?.data?.slice(0, 3) || []);
        setStats(prev => ({ ...prev, ...(statsReq.data?.data || {}) }));
      });

      // 3. Fetch Private Data (In the background)
      if (isAuthenticated) {
        api.get('/users/activity').then(actReq => {
          setRecentActivity(actReq.data?.data?.slice(0, 4) || []);
        }).catch(() => {});
        
        api.get('/users/leaderboard').then(leaderReq => {
          const rankIndex = leaderReq.data?.data?.findIndex((u: any) => u._id === currentUser?._id);
          if (rankIndex !== undefined && rankIndex !== -1) {
             setStats(prev => ({ ...prev, userRank: `#${rankIndex + 1}` }));
          }
        }).catch(() => {});
      }
    };

    fetchDashboardData();
  }, []);

  const getResourceIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (t === 'ppt' || t === 'pptx') return <Presentation className="w-5 h-5 text-orange-500" />;
    if (t === 'zip') return <FileArchive className="w-5 h-5 text-purple-500" />;
    if (t === 'link') return <ExternalLink className="w-5 h-5 text-emerald-500" />;
    if (t.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-indigo-600" />; 
  };

  const QuickActionCard = ({ icon: Icon, title, href, colorClass }: any) => (
    <Link href={href} className="group flex flex-col items-center sm:items-start p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-110 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 text-center sm:text-left leading-tight">{title}</h3>
    </Link>
  );

  const StatCard = ({ label, value, trend, trendUp }: any) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
      <p className="text-[10px] sm:text-xs font-medium text-slate-500">{label}</p>
      <div className="flex items-end justify-between mt-1 sm:mt-2">
        <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
        {trend && (
          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 sm:mb-1 ${trendUp ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
            {trendUp ? '↑' : ''} {trend}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <div className="flex-1 max-w-[90rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        
        {/* ================= HERO SECTION ================= */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 shadow-sm relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-2xl text-center lg:text-left flex flex-col items-center lg:items-start">
            
            {/* 🚀 THE FIX: INLINE SKELETON LOADER */}
            {isLoading ? (
              <div className="w-full flex flex-col items-center lg:items-start animate-pulse">
                <div className="h-10 sm:h-12 lg:h-14 bg-slate-200 rounded-xl w-3/4 mb-3 sm:mb-4"></div>
                <div className="h-10 sm:h-12 lg:h-14 bg-slate-200 rounded-xl w-1/2 mb-6 sm:mb-8"></div>
                <div className="h-16 bg-slate-100 rounded-lg w-full max-w-md mb-6 sm:mb-8"></div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="h-12 sm:h-14 w-full sm:w-40 bg-slate-200 rounded-xl"></div>
                  <div className="h-12 sm:h-14 w-full sm:w-40 bg-slate-100 rounded-xl border border-slate-200"></div>
                </div>
              </div>
            ) : user ? (
              <>
                {/* Your Logged-In State (Unchanged) */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight sm:leading-tight lg:leading-tight mb-3 sm:mb-4 tracking-tight">
                  Welcome back, <span className="text-indigo-700 font-serif italic pr-1">{user.firstName}</span>. <br className="hidden sm:block" />
                  Your academic community.
                </h1>
                <p className="text-slate-500 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl px-2 sm:px-0">
                  Find the resources you trust, connect with mentors who guide your path, and stay perfectly synced with everything happening at IBA.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
                  <Link href="/resources" className="w-full sm:w-auto">
                    <Button className="w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl px-6 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-md shadow-indigo-200 transition-all">
                      <BookOpen className="w-5 h-5 mr-2" /> Explore Resources
                    </Button>
                  </Link>
                  <Link href="/forum" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full rounded-xl px-6 py-5 sm:py-6 text-sm sm:text-base font-medium border-slate-200 text-slate-700 hover:bg-slate-50">
                      <MessageSquare className="w-5 h-5 mr-2" /> Ask a Query
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Your Logged-Out State (Unchanged) */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-4 sm:mb-6">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  The Digital Backbone of Sukkur IBA
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight sm:leading-tight lg:leading-tight mb-3 sm:mb-4 tracking-tight">
                  The Central <span className="text-indigo-700 font-serif italic pr-1">Nervous System</span> <br className="hidden sm:block" /> of Campus Life.
                </h1>
                <p className="text-slate-500 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl px-2 sm:px-0">
                  Where Sukkur IBA students connect, collaborate, and succeed. Join the ecosystem built to elevate your campus experience, from your first semester to your final project.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-lg transition-all">
                      Join the Hub Today
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="ghost" className="w-full rounded-xl px-6 py-5 sm:py-6 text-sm sm:text-base font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50">
                      Sign In <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="hidden lg:block w-[340px] h-[260px] rounded-3xl relative z-10 shadow-2xl overflow-hidden border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500 bg-slate-100 shrink-0">
            <div className="absolute inset-0 bg-indigo-900/10 z-10 mix-blend-multiply"></div>
            {/* 🚀 OPTIMIZATION 3: Removed priority, added lazy loading so mobile browsers don't eagerly download it! */}
            <Image 
              src="/iba-hero.jpg" 
              alt="IBA Knowledge Centre" 
              className="w-full h-full object-cover object-center scale-110"
              width={340}
              height={260}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* ================= MAIN GRID LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* LEFT COLUMN (Wider) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* Quick Actions */}
            {user && (
              <section>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 font-serif">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <QuickActionCard icon={FileText} title="Upload Resource" href="/resources" colorClass="bg-blue-50 text-blue-600" />
                  <QuickActionCard icon={MessageSquare} title="Post Query" href="/forum" colorClass="bg-indigo-50 text-indigo-600" />
                  <QuickActionCard icon={Users} title="Connect Students" href="/chat" colorClass="bg-emerald-50 text-emerald-600" />
                  <QuickActionCard icon={AlertTriangle} title="Submit Complaint" href="/voice" colorClass="bg-orange-50 text-orange-600" />
                  <QuickActionCard icon={GraduationCap} title="Alumni Network" href="/alumni" colorClass="bg-yellow-50 text-yellow-600" />
                  <QuickActionCard icon={BarChart2} title="View Leaderboard" href="/leaderboard" colorClass="bg-purple-50 text-purple-600" />
                </div>
              </section>
            )}

            {/* Recently Added Resources */}
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Recently Added Resources</h2>
                <Link href="/resources" className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">View All</Link>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <div 
                      key={resource._id} 
                      onClick={() => router.push(`/resources?search=${encodeURIComponent(resource.title)}`)} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer gap-2 sm:gap-0"
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                          {getResourceIcon(resource.fileType)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1 pr-4">{resource.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] sm:text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{resource.courseCode || 'GENERAL'}</span>
                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-none">
                              by {resource.uploader?.firstName ? `${resource.uploader.firstName} ${resource.uploader.lastName}` : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs sm:text-sm text-slate-500">No resources available right now.</div>
                )}
              </div>
            </section>

            {/* Trending Queries */}
            <section>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">Trending Queries</h2>
                <Link href="/forum" className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">Go to Forum</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {trendingQueries.length > 0 ? (
                  trendingQueries.map((query) => (
                    <Link key={query._id} href={`/forum/${query._id}`} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1.5 sm:mb-2 leading-snug group-hover:text-indigo-700 line-clamp-2">{query.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 sm:mb-4">{query.body || query.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
                        <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-600 truncate max-w-[120px]">{query.course || query.department || 'General'}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {query.upvotes?.length || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {query.replies?.length || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 p-6 text-center text-xs sm:text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl">No trending queries at the moment.</div>
                )}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN (Sidebar) */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Overview Stats */}
            <section>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 font-serif">Overview</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard label="Resources" value={stats.resourcesCount} trendUp={true} />
                <StatCard label="Active Queries" value={stats.queriesCount} trendUp={true} />
                <StatCard label="Students Online" value={stats.onlineStudents} />
                {user && <StatCard label="Your Rank" value={stats.userRank} trendUp={true} />}
              </div>

              {/* Top Contributor Badge */}
              {user && (user.contributorPoints >= 10 || user.rank === 'Top Contributor') && (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-white shadow-md">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/20 rounded-full border border-indigo-400/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold">Top Contributor</h3>
                    <p className="text-[10px] sm:text-xs text-indigo-200/80 mt-0.5">Points: {user.contributorPoints || 0}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Announcements Sidebar */}
            {user && (
              <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-800" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Announcements</h3>
                  </div>
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold hover:bg-slate-200">Manage</Link>
                  )}
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div key={ann._id} className={`border-l-2 pl-3 py-0.5 ${ann.priority === 'Urgent' ? 'border-red-500' : 'border-indigo-500'}`}>
                        <span className={`text-[8px] sm:text-[9px] font-black tracking-wider uppercase ${ann.priority === 'Urgent' ? 'text-red-500' : 'text-indigo-500'}`}>
                          {ann.priority || 'General'}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5 line-clamp-2">{ann.message}</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                          {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No active announcements.</p>
                  )}
                </div>
              </section>
            )}

            {/* Recent Activity Sidebar */}
            {user && (
              <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="w-4 h-4 text-slate-800" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Your Recent Activity</h3>
                </div>
                <div className="space-y-2 sm:space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((act, index) => (
                      <Link href={act.link} key={index} className="flex gap-2 sm:gap-3 hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer group">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          act.type === 'Voice Issue' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                          act.type === 'Forum Post' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          {act.type === 'Voice Issue' ? <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> :
                           act.type === 'Forum Post' ? <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> :
                           <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        </div>
                        <div>
                          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2">
                            <span className="font-bold text-slate-900">You</span> posted a {act.type}: <span className="font-medium group-hover:text-indigo-600 transition-colors">"{act.title}"</span>
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">
                            {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-3 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">No recent activity found. Start contributing!</p>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
      
      <footer className="w-full bg-white border-t border-slate-200 py-6 sm:py-8 mt-auto">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 text-center md:text-left">
          
          {/* Logo / Brand */}
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <p className="text-xs sm:text-sm font-black text-slate-900 font-serif tracking-tight">IBA <span className="text-indigo-600">Hub</span></p>
          </div>
          
          {/* Developer Credit */}
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
            © {new Date().getFullYear()} IBA Hub. Built by <span className="font-bold text-slate-700">Meer Muhammad</span>.
          </p>

          {/* Social / Portfolio Links */}
          <div className="flex items-center justify-center md:justify-end gap-5">
            <a href="https://linkedin.com/in/meer-muhammad-ansari-678040178" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0077b5] transition-transform hover:scale-110" title="LinkedIn">
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a href="https://github.com/SoldierMeer" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black transition-transform hover:scale-110" title="GitHub">
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            {/* 🚀 Changed to Globe for Portfolio */}
            <a href="https://meer-dev.vercel.app" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-transform hover:scale-110" title="Portfolio Website">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}