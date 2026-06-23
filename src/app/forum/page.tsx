import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { MessageSquare, Flame, CheckCircle2, TrendingUp, Tag, BookOpen, Search } from 'lucide-react';
import CreatePostModal from '@/components/CreatePostModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UpvoteButton from '@/components/UpvoteButton';
import ForumFilters from '@/components/ForumFilters'; 
import ProfileClickWrapper from '@/components/ProfileClickWrapper';
import ForumSearch from '@/components/ForumSearch';
import { optimizeImage } from '@/lib/cloudinary';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// ==========================================
// 1. SHARED DATA FETCH (Next.js Caches This Automatically)
// ==========================================
async function getForumPosts(searchParams: { [key: string]: string | string[] | undefined }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('jwt')?.value || cookieStore.get('token')?.value;
    
    const params = new URLSearchParams();
    if (typeof searchParams.sort === 'string') params.append('sort', searchParams.sort);
    if (typeof searchParams.category === 'string' && searchParams.category !== 'All') params.append('category', searchParams.category);
    if (typeof searchParams.page === 'string') params.append('page', searchParams.page);
    
    if (typeof searchParams.search === 'string' && searchParams.search.trim() !== '') {
      params.append('search', searchParams.search);
    }

    if (typeof searchParams.tag === 'string' && searchParams.tag.trim() !== '') {
      params.append('tag', searchParams.tag);
    }

    const queryString = params.toString();
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum${queryString ? `?${queryString}` : ''}`, {
        cache: 'no-store',
        headers: { Cookie: token ? `jwt=${token}; token=${token}` : '' }
      });
      
      if (!res.ok) throw new Error("Failed to fetch"); 
      return await res.json(); 
    } catch (error) {
      return { 
        data: [], 
        currentUserId: null,
        pagination: { currentPage: 1, totalPages: 1 },
        stats: { activeToday: 0, trendingSidebar: [], popularTags: [] }
      }; 
    }
}

// ==========================================
// 2. MAIN LAYOUT (Renders Instantly)
// ==========================================
export default async function ForumPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  
  // Create a unique key so Suspense triggers on every filter click
  const suspenseKey = JSON.stringify(resolvedParams);

  return (
    <>
    <title>Forum | IBA Hub</title>
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Query Forum</h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1.5 sm:mt-2 font-medium">Ask questions, get answers, and help other students succeed.</p>

            {/* 🚀 SUSPENSE 1: Keeps the badges in their exact original spot */}
            <Suspense key={`stats-${suspenseKey}`} fallback={<div className="mt-3 h-6 w-56 bg-slate-200 animate-pulse rounded-full"></div>}>
              <ForumStats resolvedParams={resolvedParams} />
            </Suspense>
          </div>
          <div className="w-full md:w-auto">
            <CreatePostModal />
          </div>
        </div>

        {/* 🚀 These stay instantly interactive without freezing! */}
        <ForumSearch />
        <ForumFilters />

        {/* 🚀 SUSPENSE 2: The Main Grid */}
        <Suspense key={`main-${suspenseKey}`} fallback={<ForumSkeleton />}>
          <ForumContent resolvedParams={resolvedParams} />
        </Suspense>

      </div>
    </div>
    </>
  );
}

// ==========================================
// 3. SUB-COMPONENTS & SKELETONS
// ==========================================

async function ForumStats({ resolvedParams }: { resolvedParams: { [key: string]: string | string[] | undefined } }) {
  const { pagination, stats } = await getForumPosts(resolvedParams);
  const totalUploads = pagination?.totalItems || 0;
  const activeDiscussionsToday = stats?.activeToday || 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 animate-in fade-in duration-500">
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-indigo-50 rounded-full text-[10px] sm:text-xs font-semibold text-indigo-700 border border-indigo-100 shadow-sm">
        <BookOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {totalUploads} total discussions
      </div>
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-slate-100 rounded-full text-[10px] sm:text-xs font-semibold text-slate-600 border border-slate-200">
        <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {activeDiscussionsToday} active today
      </div>
    </div>
  );
}

function ForumSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8 items-start animate-pulse">
      <div className="w-full space-y-4 sm:space-y-5 order-2 lg:order-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-200/60 h-40 sm:h-48 rounded-2xl sm:rounded-3xl border border-slate-100"></div>
        ))}
      </div>
      <div className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-8 order-1 lg:order-2">
        <div className="bg-slate-200/60 h-64 rounded-2xl sm:rounded-3xl border border-slate-100"></div>
        <div className="bg-slate-200/60 h-48 rounded-2xl sm:rounded-3xl border border-slate-100"></div>
      </div>
    </div>
  );
}

async function ForumContent({ resolvedParams }: { resolvedParams: { [key: string]: string | string[] | undefined } }) {
  const { data: posts, currentUserId, pagination, stats } = await getForumPosts(resolvedParams);

  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.currentPage || 1;
  
  const trendingSidebar = stats?.trendingSidebar || [];
  const popularTags = stats?.popularTags || [];

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (typeof resolvedParams.category === 'string') params.append('category', resolvedParams.category);
    if (typeof resolvedParams.sort === 'string') params.append('sort', resolvedParams.sort);
    if (typeof resolvedParams.search === 'string') params.append('search', resolvedParams.search);
    if (typeof resolvedParams.tag === 'string') params.append('tag', resolvedParams.tag);
    params.append('page', pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8 items-start animate-in fade-in duration-500">
      
      <div className="w-full space-y-4 sm:space-y-5 order-2 lg:order-1">
        {posts.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">No discussions found</h3>
            <p className="text-slate-500 text-xs sm:text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          posts.map((post: any) => {
            const isSolved = post.hasAcceptedAnswer; 
            const isTrending = (post.replyCount || 0) >= 3; 
            
            const hasUpvoted = currentUserId && post.upvotes?.some((upvote: any) => {
                const idString = typeof upvote === 'object' ? (upvote._id || upvote.id) : upvote;
                return String(idString) === String(currentUserId);
            });

            return (
              <Link href={`/forum/${post._id}`} key={post._id} className="block group">
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all flex gap-3 sm:gap-6">
                  
                  <div className="shrink-0 mt-1">
                    <UpvoteButton 
                      apiUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/${post._id}/upvote`}
                      initialCount={post.upvotes?.length || 0} 
                      initialVoteState={hasUpvoted ? 'up' : 'none'} 
                    />
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-2">
                      <h2 className="text-base sm:text-[1.15rem] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug break-words pr-2">
                        {post.title}
                      </h2>
                      <div className="shrink-0 flex gap-2">
                        {isSolved ? (
                          <span className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-100 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Solved
                          </span>
                        ) : isTrending ? (
                          <span className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 bg-orange-50 text-orange-700 text-[10px] sm:text-xs font-bold rounded-full border border-orange-100 whitespace-nowrap">
                            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Trending
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3 sm:mb-4">{post.content}</p>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                      {post.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-semibold rounded-lg truncate max-w-[120px]">#{tag}</span>
                      ))}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-slate-100 gap-3">
                      <ProfileClickWrapper userId={post.author?._id} className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border border-slate-200 shrink-0">
                          <AvatarImage src={optimizeImage(post.author?.avatarUrl, 80, 80)} alt='Author Avatar'/>
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold">{post.author?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[80px] sm:max-w-[120px]">
                            {post.author?.firstName} {post.author?.lastName?.[0]}.
                          </span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="text-[10px] sm:text-xs font-medium text-slate-500 shrink-0">{timeAgo(post.createdAt)}</span>
                        </div>
                      </ProfileClickWrapper>

                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 group-hover:text-indigo-600 transition-colors ml-auto">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold">{post.replyCount || 0} Replies</span>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            );
          })
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">
            {currentPage > 1 ? (
              <Link 
                href={createPageUrl(currentPage - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              >
                &larr; Previous
              </Link>
            ) : (
              <button disabled className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-400 opacity-50 cursor-not-allowed shadow-sm">
                &larr; Previous
              </button>
            )}
            
            <span className="text-sm font-bold text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            
            {currentPage < totalPages ? (
              <Link 
                href={createPageUrl(currentPage + 1)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                Next &rarr;
              </Link>
            ) : (
              <button disabled className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl font-bold text-sm opacity-50 cursor-not-allowed shadow-sm">
                Next &rarr;
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-8 order-1 lg:order-2">
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
            <h3 className="font-bold text-slate-900 font-serif text-base sm:text-lg">Trending Queries</h3>
          </div>
          <ul className="space-y-4 sm:space-y-5">
            {trendingSidebar.length > 0 ? trendingSidebar.map((item: any) => (
              <li key={item._id} className="group cursor-pointer">
                <Link href={`/forum/${item._id}`}>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 leading-snug mb-1 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500">{item.replyCount || 0} replies</p>
                </Link>
              </li>
            )) : <p className="text-xs text-slate-500">No trending queries yet.</p>}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 shrink-0" />
            <h3 className="font-bold text-slate-900 font-serif text-base sm:text-lg">Popular Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.length > 0 ? popularTags.map((tag: string) => (
              <Link 
                key={tag} 
                href={`/forum?tag=${encodeURIComponent(tag)}`}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 text-[10px] sm:text-xs font-semibold rounded-lg cursor-pointer transition-colors block"
              >
                #{tag}
              </Link>
            )) : <p className="text-xs text-slate-500">No tags used yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}