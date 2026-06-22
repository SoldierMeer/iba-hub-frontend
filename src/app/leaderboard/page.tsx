import { cookies } from 'next/headers';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, Info, FileText, MessageSquare, Building2, CheckCircle2, TrendingUp } from 'lucide-react';
import ProfileClickWrapper from '@/components/ProfileClickWrapper';
import { optimizeImage } from '@/lib/cloudinary';

async function getLeaderboardPageData(tab: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value || cookieStore.get('token')?.value;
  const authHeaders = { Cookie: token ? `jwt=${token}; token=${token}` : '' };
  
  try {
    const [lbRes, meRes, actRes] = await Promise.all([
      // 🚀 THE FIX: Removed `headers: authHeaders`!
      // By sending no cookies, Next.js guarantees this response is cached globally for 60 seconds.
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/users/leaderboard?filter=${tab}`, { 
        next: { revalidate: 60 } 
      }),
      
      // These routes return private user data, so they MUST use authHeaders and MUST NOT be cached.
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/users/me`, { 
        cache: 'no-store', 
        headers: authHeaders 
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/users/activity`, { 
        cache: 'no-store', 
        headers: authHeaders 
      })
    ]);
  
    const lbJson = lbRes.ok ? await lbRes.json() : { data: [] };
    const meJson = meRes.ok ? await meRes.json() : { data: null };
    const actJson = actRes.ok ? await actRes.json() : { data: [] };
  
    return { 
      users: lbJson.data || [], 
      me: meJson.data || null,
      activity: actJson.data || []
    };
  } catch (error) {
    return { users: [], me: null, activity: [] };
  }
}

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || 'overall';
  
  const { users, me, activity } = await getLeaderboardPageData(currentTab);

  const currentUserId = me?._id;
  const currentUserIndex = users.findIndex((u: any) => String(u._id) === String(currentUserId));
  const currentUser = currentUserIndex !== -1 ? users[currentUserIndex] : null;
  const currentRank = currentUserIndex !== -1 ? currentUserIndex + 1 : '-';

  // 🚀 FAST FALLBACK: If the user is outside the Top 50, grab their points from their 'me' profile!
  let displayScore = currentUser?.score || 0;
  if (!currentUser && me && (currentTab === 'overall' || currentTab === 'all_time')) {
    displayScore = me.contributorPoints || 0;
  }

  let targetScore = 500;
  let pointsNeeded = 150;
  let targetRankLabel: string | number = '-';

  if (currentUser) {
      if (currentRank === 1) {
          targetScore = Math.ceil((currentUser.score + 1) / 100) * 100;
          if(targetScore === currentUser.score) targetScore += 100; 
          targetRankLabel = 'Next Milestone';
      } else if (currentUserIndex > 0) {
          const personAbove = users[currentUserIndex - 1];
          targetScore = personAbove.score;
          if (targetScore <= currentUser.score) targetScore = currentUser.score + 10;
          targetRankLabel = `#${currentUserIndex}`;
      }
      pointsNeeded = targetScore - currentUser.score;
  } else if (displayScore > 0) {
      // If they have points but aren't top 50, their target is the 50th person's score!
      targetScore = users.length === 50 ? users[49].score + 5 : displayScore + 50;
      pointsNeeded = targetScore - displayScore;
      targetRankLabel = "Top 50";
  }

  const progressPercent = displayScore > 0 ? Math.min(100, (displayScore / targetScore) * 100) : 0;

  const deptPointsMap: { [key: string]: number } = {};
  users.forEach((u: any) => {
    const d = u.department || 'Other';
    deptPointsMap[d] = (deptPointsMap[d] || 0) + (u.score || 0);
  });
  const sortedDepartments = Object.entries(deptPointsMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxDeptPoints = sortedDepartments[0]?.[1] || 1;

  const podiumUsers = users.slice(0, 3);
  const tableUsers = users.slice(3);

  return (
    <>
    <title>Leaderboard | IBA Hub</title>
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        <div className="mb-6 sm:mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Leaderboard</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">Recognizing the students who contribute most to IBA Hub.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Rank</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{currentRank !== '-' ? `#${currentRank}` : '- '}</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Points</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{displayScore}</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uploads</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{currentUser?.uploads || (me ? '...' : 0)}</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Replies</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{currentUser?.replies || (me ? '...' : 0)}</p>
          </div>
        </div>

        {/* 🚀 Mobile Swipeable Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-10 sm:mb-12 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link href="/leaderboard?tab=overall" className={`shrink-0 px-4 sm:px-5 py-2 text-xs font-bold rounded-full transition-colors ${currentTab === 'overall' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Overall</Link>
          <Link href="/leaderboard?tab=resources" className={`shrink-0 px-4 sm:px-5 py-2 text-xs font-bold rounded-full transition-colors ${currentTab === 'resources' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Resources</Link>
          <Link href="/leaderboard?tab=query_replies" className={`shrink-0 px-4 sm:px-5 py-2 text-xs font-bold rounded-full transition-colors ${currentTab === 'query_replies' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Query Replies</Link>
          <Link href="/leaderboard?tab=this_week" className={`shrink-0 px-4 sm:px-5 py-2 text-xs font-bold rounded-full transition-colors ${currentTab === 'this_week' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>This Week</Link>
          <Link href="/leaderboard?tab=monthly" className={`shrink-0 px-4 sm:px-5 py-2 text-xs font-bold rounded-full transition-colors ${currentTab === 'monthly' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Monthly</Link>
        </div>

        {/* 🚀 Podium - Stacks beautifully on Mobile */}
        {podiumUsers.length > 0 && (
          <div className="flex flex-col md:flex-row justify-center items-center md:items-end gap-14 md:gap-6 mb-16 px-4 pt-8 md:pt-0">
            
            {/* Rank #2 Slot */}
            {podiumUsers[1] && (
              <div className="order-2 md:order-1 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center w-full max-w-xs md:w-64 h-auto md:h-56 justify-end relative mt-6 md:mt-0">
                <div className="absolute -top-10 md:-top-6">
                  <ProfileClickWrapper userId={podiumUsers[1]._id}>
                    <div className="relative">
                      <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                        {/* 🚀 AI COMPRESSED (150x150) */}
                        <AvatarImage src={optimizeImage(podiumUsers[1].avatarUrl, 150, 150)} alt='user profile'/>
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{podiumUsers[1].firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm">2</div>
                    </div>
                  </ProfileClickWrapper>
                </div>
                <ProfileClickWrapper userId={podiumUsers[1]._id}>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-10 hover:text-indigo-600 transition-colors text-center">{podiumUsers[1].firstName} {podiumUsers[1].lastName}</h3>
                </ProfileClickWrapper>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-3 text-center">Dept. of {podiumUsers[1].department || 'General'}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800">{podiumUsers[1].score} pts</p>
              </div>
            )}

            {/* Rank #1 Slot */}
            {podiumUsers[0] && (
              <div className="order-1 md:order-2 bg-white p-5 sm:p-6 rounded-3xl border-2 border-indigo-900 shadow-xl flex flex-col items-center w-full max-w-[22rem] md:w-72 h-auto md:h-72 justify-end relative z-10 md:-translate-y-8">
                <div className="absolute -top-12 md:-top-8">
                  <ProfileClickWrapper userId={podiumUsers[0]._id}>
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                        {/* 🚀 AI COMPRESSED (200x200) */}
                        <AvatarImage src={optimizeImage(podiumUsers[0].avatarUrl, 200, 200)} alt='user profile'/>
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xl">{podiumUsers[0].firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-900 text-white rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow-sm">1</div>
                    </div>
                  </ProfileClickWrapper>
                </div>
                <ProfileClickWrapper userId={podiumUsers[0]._id}>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl mt-12 md:mt-8 hover:text-indigo-600 transition-colors text-center">{podiumUsers[0].firstName} {podiumUsers[0].lastName}</h3>
                </ProfileClickWrapper>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-3 text-center">Dept. of {podiumUsers[0].department || 'General'}</p>
                <div className="px-2.5 sm:px-3 py-1 bg-slate-100 rounded-md flex items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4 border border-slate-200">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-700" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 uppercase tracking-wider">Top Contributor</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-indigo-900 leading-none">{podiumUsers[0].score}</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Points</p>
              </div>
            )}

            {/* Rank #3 Slot */}
            {podiumUsers[2] && (
              <div className="order-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center w-full max-w-xs md:w-64 h-auto md:h-56 justify-end relative mt-6 md:mt-0">
                <div className="absolute -top-10 md:-top-6">
                  <ProfileClickWrapper userId={podiumUsers[2]._id}>
                    <div className="relative">
                      <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                        {/* 🚀 AI COMPRESSED (150x150) */}
                        <AvatarImage src={optimizeImage(podiumUsers[2].avatarUrl, 150, 150)} alt='user profile'/>
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{podiumUsers[2].firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-sm">3</div>
                    </div>
                  </ProfileClickWrapper>
                </div>
                <ProfileClickWrapper userId={podiumUsers[2]._id}>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-10 hover:text-indigo-600 transition-colors text-center">{podiumUsers[2].firstName} {podiumUsers[2].lastName}</h3>
                </ProfileClickWrapper>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-3 text-center">Dept. of {podiumUsers[2].department || 'General'}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800">{podiumUsers[2].score} pts</p>
              </div>
            )}
            
          </div>
        )}

        {/* 🚀 Main Layout Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Top Contributors</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider w-12 sm:w-16 text-center">Rank</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Student</th>
                    {/* Dept is hidden on extra small screens to save space */}
                    <th className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">Dept</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-xs sm:text-sm font-medium text-slate-400 italic">
                        No additional rankings to display yet.
                      </td>
                    </tr>
                  ) : (
                    tableUsers.map((user: any, index: number) => {
                      const rank = index + 4;
                      const isMe = String(user._id) === String(currentUserId);
                      
                      return (
                        <tr key={user._id} className={`hover:bg-slate-50 transition-colors ${isMe ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-black text-slate-400 text-center">{rank}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <ProfileClickWrapper userId={user._id} className="flex items-center gap-2 sm:gap-3 w-fit">
                              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                                {/* 🚀 AI COMPRESSED (60x60) */}
                                <AvatarImage src={optimizeImage(user.avatarUrl, 60, 60)} alt='user profile image'/>
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold">{user.firstName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className={`text-xs sm:text-sm font-bold group-hover:text-indigo-600 transition-colors ${isMe ? 'text-indigo-900' : 'text-slate-800'}`}>
                                  {user.firstName} {user.lastName}
                                </span>
                                {isMe && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] sm:text-[10px] font-black rounded-md">ME</span>}
                              </div>
                            </ProfileClickWrapper>
                          </td>
                          <td className="hidden sm:table-cell px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold text-slate-500">
                            {user.department?.split(' ')[0] || 'Gen'}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-black text-slate-800 text-right">
                            {user.score}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Progress</h3>
              </div>
              
              <div className="mb-5 sm:mb-6">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2">
                  <span className="text-slate-500">Current: {displayScore} pts <span className="text-slate-500">({currentRank !== '-' ? `#${currentRank}` : '-'})</span></span>
                  <span className="text-slate-900">Target: {targetScore} pts <span className="text-slate-500">({targetRankLabel})</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 mb-2">
                  <div className="bg-indigo-900 h-1.5 sm:h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 text-right">
                  {pointsNeeded} points to {currentRank === 1 ? 'next milestone' : 'rank up'}
                </p>
              </div>

              <div className="pt-4 sm:pt-5 border-t border-slate-100">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Recent Activity</p>
                <div className="space-y-2.5 sm:space-y-3">
                  {activity.length === 0 ? (
                    <p className="text-[10px] sm:text-xs text-slate-500 italic">No recent activity found.</p>
                  ) : (
                    activity.map((act: any) => (
                      <div key={act._id} className="flex justify-between items-start gap-2">
                        <div className="flex gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-600 min-w-0">
                          {act.type === 'Resource' ? <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" /> : act.type === 'Accepted Answer' ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 shrink-0" /> : <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 shrink-0" />}
                          <span className="line-clamp-1 break-words">{act.title}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">
                          +{act.points}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Point System</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 leading-tight">Resource Upload <br/><span className="text-[8px] sm:text-[10px] font-medium text-slate-500">(Approved)</span></span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 bg-slate-200/50 px-2 py-1 rounded-lg">+10 pts</span>
                </div>
                <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 leading-tight">Helpful Reply <br/><span className="text-[8px] sm:text-[10px] font-medium text-slate-500">(Marked Correct)</span></span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 bg-slate-200/50 px-2 py-1 rounded-lg">+15 pts</span>
                </div>
                <div className="flex justify-between items-center p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600">General Reply</span>
                  <span className="text-[10px] sm:text-xs font-black text-slate-700 bg-slate-200/50 px-2 py-1 rounded-lg">+5 pts</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-900" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Top Departments</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {sortedDepartments.length === 0 ? (
                  <p className="text-[10px] sm:text-xs text-slate-500 italic">No activity registered across departments yet.</p>
                ) : (
                  sortedDepartments.map(([deptName, points], index) => {
                    const percentage = Math.max(5, (points / maxDeptPoints) * 100);
                    return (
                      <div key={deptName} className="space-y-1 sm:space-y-1.5">
                        <div className="flex justify-between text-[10px] sm:text-xs font-bold">
                          <span className="text-slate-700 truncate pr-2">{index + 1}. {deptName}</span>
                          <span className="text-slate-500 shrink-0">{points >= 1000 ? `${(points / 1000).toFixed(1)}k` : points} pts</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 sm:h-1.5">
                          <div 
                            className="bg-slate-400 h-1 sm:h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}