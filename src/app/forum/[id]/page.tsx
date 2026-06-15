import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReplyForm from '@/components/ReplyForm';
import UpvoteButton from '@/components/UpvoteButton';
import DeletePostButton from '@/components/DeletePostButton';
import AcceptAnswerButton from '@/components/AcceptAnswerButton';
import ProfileClickWrapper from '@/components/ProfileClickWrapper'; // 🚀 IMPORTED WRAPPER
import { optimizeImage } from '@/lib/cloudinary';

async function getPostDetails(id: string, sort: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('jwt')?.value || cookieStore.get('token')?.value; 

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/${id}?sort=${sort}`, {
    cache: 'no-store',
    headers: { Cookie: token ? `jwt=${token}; token=${token}` : '' } 
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.data; 
}

export default async function PostDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'likes';
  
  const data = await getPostDetails(resolvedParams.id, sort);
  
  if (!data || !data.post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Post Not Found</h1>
        <p className="text-sm sm:text-base text-slate-500 mb-6">The query you are looking for does not exist.</p>
        <Link href="/forum" className="text-indigo-600 hover:underline font-medium text-sm sm:text-base">&larr; Back to Forum</Link>
      </div>
    );
  }

  const { post, replies, currentUserId } = data;
  
  const isPostAuthor = Boolean(
    currentUserId && 
    post.author?._id && 
    String(post.author._id) === String(currentUserId)
  );
  
  const hasUpvotedPost = currentUserId && post.upvotes?.some((upvote: any) => {
    const idString = typeof upvote === 'object' ? (upvote._id || upvote.id) : upvote;
    return String(idString) === String(currentUserId);
  });
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href="/forum" className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-slate-800 mb-4 sm:mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Back to Feed
      </Link>

      {/* The Original Post */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-xl border border-slate-200 shadow-sm mb-6 sm:mb-8 relative">
        {isPostAuthor && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <DeletePostButton postId={post._id} />
          </div>
        )}

        <div className="flex items-start gap-3 sm:gap-5">
          <div className="flex-shrink-0 pt-1">
            <UpvoteButton 
              apiUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/${post._id}/upvote`}
              initialCount={post.upvotes?.length || 0} 
              initialVoteState={hasUpvotedPost ? 'up' : 'none'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 pr-8 sm:pr-12 leading-snug">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-100">
              
              {/* 🚀 REFACTORED: Original Post Author Clickable Wrapper */}
              <ProfileClickWrapper userId={post.author?._id} className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer group">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 group-hover:ring-2 ring-indigo-400 ring-offset-1 transition-all">
                  <AvatarImage src={optimizeImage(post.author?.avatarUrl, 100, 100)} alt='Author Avatar'/>
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm">
                    {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 group-hover:underline transition-colors">
                    {post.author?.firstName} {post.author?.lastName}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </ProfileClickWrapper>
            </div>
            
            <div className="text-slate-700 text-sm sm:text-base whitespace-pre-wrap leading-relaxed mb-4 sm:mb-6">
              {post.content}
            </div>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {post.tags?.map((tag: string) => (
                <span key={tag} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-semibold rounded-full border border-indigo-100 truncate max-w-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Replies Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <Link 
            href={`?sort=likes`} 
            className={`flex-1 sm:flex-none text-center px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${sort === 'likes' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Most Likes
          </Link>
          <Link 
            href={`?sort=newest`} 
            className={`flex-1 sm:flex-none text-center px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all ${sort === 'newest' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Newest First
          </Link>
        </div>
      </div>

      {/* Replies Map */}
      <div className="space-y-4 sm:space-y-5 mt-4">
        {replies.length === 0 ? (
          <p className="text-slate-500 text-xs sm:text-sm italic text-center sm:text-left py-4">No answers yet. Be the first to help out!</p>
        ) : (
          [...replies]
            .sort((a, b) => (b.isAcceptedAnswer ? 1 : 0) - (a.isAcceptedAnswer ? 1 : 0))
            .map((reply: any) => {
              const hasUpvotedReply = currentUserId && reply.upvotes?.some((upvote: any) => {
                const idString = typeof upvote === 'object' ? (upvote._id || upvote.id) : upvote;
                return String(idString) === String(currentUserId);
              });
              
              return (
                <div 
                  key={reply._id} 
                  className={`p-4 sm:p-5 rounded-xl border flex items-start gap-3 sm:gap-4 transition-all relative mt-6
                    ${reply.isAcceptedAnswer ? 'bg-emerald-50/40 border-emerald-300 shadow-md' : 'bg-white border-slate-200 shadow-sm'}
                  `}
                >
                  {reply.isAcceptedAnswer && (
                    <div className="absolute -top-3 left-4 sm:left-6 bg-emerald-500 text-white text-[8px] sm:text-[10px] uppercase font-black tracking-wider px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-sm z-10 whitespace-nowrap">
                      <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Selected Answer
                    </div>
                  )}

                  <div className="flex-shrink-0 pt-1 sm:pt-2">
                    <UpvoteButton 
                      apiUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/replies/${reply._id}/upvote`}
                      initialCount={reply.upvotes?.length || 0} 
                      initialVoteState={hasUpvotedReply ? 'up' : 'none'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 pt-1 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        
                        {/* 🚀 REFACTORED: Reply Author Clickable Wrapper */}
                        <ProfileClickWrapper userId={reply.author?._id} className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer group">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-slate-200 shadow-sm shrink-0 group-hover:ring-2 ring-indigo-400 transition-all">
                            <AvatarImage src={optimizeImage(reply.author?.avatarUrl, 80, 80)} alt='Author Avatar'/>
                            <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold">
                              {reply.author?.firstName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[100px] sm:max-w-none group-hover:text-indigo-600 group-hover:underline transition-colors">
                              {reply.author?.firstName} {reply.author?.lastName}
                            </span>
                          </div>
                        </ProfileClickWrapper>

                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="text-[9px] sm:text-xs text-slate-500 font-medium shrink-0">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {isPostAuthor && (
                        <div className="self-end sm:self-auto shrink-0">
                          <AcceptAnswerButton replyId={reply._id} isAccepted={reply.isAcceptedAnswer} />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {reply.content}
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>

      <ReplyForm postId={post._id} />
    </div>
  );
}