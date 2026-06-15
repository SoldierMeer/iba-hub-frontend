import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Flame } from "lucide-react";
import { cookies } from "next/headers";
import ProfileClickWrapper from "./ProfileClickWrapper"; 
import { optimizeImage } from '@/lib/cloudinary';

async function fetchTopUploaders() {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get('jwt')?.value;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/resources/top-uploaders`, {
      cache: 'no-store',
      headers: { Cookie: `jwt=${jwt}` }
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Failed to fetch top uploaders:", error);
    return [];
  }
}

export default async function TopUploaders() {
  const uploaders = await fetchTopUploaders();

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-md shrink-0" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400 drop-shadow-md shrink-0" />;
      case 2: return <Award className="w-5 h-5 text-amber-600 drop-shadow-md shrink-0" />;
      default: return <span className="text-sm font-bold text-slate-400 w-5 text-center shrink-0">{index + 1}</span>;
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          <h3 className="font-bold text-slate-900 font-serif text-base sm:text-lg">Top Contributors</h3>
        </div>
      </div>
      
      {uploaders.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50">
          <p className="text-sm font-medium text-slate-500">No contributors yet.</p>
        </div>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {uploaders.map((user: any, index: number) => (
            <li 
              key={user._id} 
              className="flex items-center justify-between group p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-3">
                <div className="flex justify-center items-center w-6 shrink-0">
                  {getRankBadge(index)}
                </div>
                
                <ProfileClickWrapper userId={user._id} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 shadow-sm group-hover:border-indigo-200 transition-colors shrink-0">
                    <AvatarImage src={optimizeImage(user.avatarUrl, 100, 100)} alt={user.firstName} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5 truncate">{user.count} uploads</p>
                  </div>
                </ProfileClickWrapper>
              </div>
              
              <div className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg shrink-0 ${index === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                {user.count}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}