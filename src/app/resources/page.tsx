import ResourceCard from '@/components/ResourceCard';
import { cookies } from 'next/headers'; 
import AddResourceModal from '@/components/AddResourceModal';
import ResourceFilters from '@/components/ResourceFilters';
import TopUploaders from '@/components/TopUploaders';
import MyUploadsModal from '@/components/MyUploadsModal';
import { BookOpen, Users, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link'; // 🚀 Added for Next.js Server-Side Pagination

async function getResources(searchParams: { [key: string]: string | string[] | undefined }) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get('jwt')?.value || cookieStore.get('token')?.value; 
  
  const params = new URLSearchParams();
  if (typeof searchParams.search === 'string') params.append('search', searchParams.search);
  if (typeof searchParams.department === 'string') params.append('department', searchParams.department);
  if (typeof searchParams.type === 'string') params.append('type', searchParams.type);
  if (typeof searchParams.sort === 'string') params.append('sort', searchParams.sort);
  // 🚀 Pass the requested page to the backend
  if (typeof searchParams.page === 'string') params.append('page', searchParams.page);
  
  const queryString = params.toString();
  const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/resources${queryString ? `?${queryString}` : ''}`;
  
  try {
    const res = await fetch(endpoint, { 
      cache: 'no-store',
      headers: { Cookie: jwt ? `jwt=${jwt}; token=${jwt}` : '' }
    });
    
    if (!res.ok) {
      return { data: [], count: 0, pagination: { currentPage: 1, totalPages: 1 } };
    }
    
    return res.json();
  } catch (error) {
    console.error("Fetch failed completely:", error);
    return { data: [], count: 0, pagination: { currentPage: 1, totalPages: 1 } };
  }
}

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const data = await getResources(resolvedSearchParams);
  const resources = data.data || []; 

  // 🚀 Safely extract pagination variables
  const totalPages = data.pagination?.totalPages || 1;
  const currentPage = data.pagination?.currentPage || 1;

  // Use totalItems from pagination to show the true total across all pages, 
  // falling back to local array length if pagination is missing.
  const totalUploads = data.pagination?.totalItems || data.count || resources.length || 0;
  
  // Note: unique contributors only calculates based on the current page's resources.
  const uniqueContributors = new Set(resources.map((r: any) => r.uploader?._id)).size || 0;

  // 🚀 Helper to generate pagination URLs while keeping other filters intact
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (typeof resolvedSearchParams.search === 'string') params.append('search', resolvedSearchParams.search);
    if (typeof resolvedSearchParams.department === 'string') params.append('department', resolvedSearchParams.department);
    if (typeof resolvedSearchParams.type === 'string') params.append('type', resolvedSearchParams.type);
    if (typeof resolvedSearchParams.sort === 'string') params.append('sort', resolvedSearchParams.sort);
    params.append('page', pageNumber.toString());
    return `?${params.toString()}`;
  };
  
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header & Stats Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6 sm:mb-8">
          <div className="w-full xl:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 shrink-0" /> Resource Hub
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">Discover, download, and share academic materials.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full xl:w-auto flex-wrap justify-end">
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Stat Card 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Resources</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 leading-none mt-1">{totalUploads}</p>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Uploaders</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 leading-none mt-1">{uniqueContributors}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-auto"><MyUploadsModal /></div>
              <div className="w-full sm:w-auto"><AddResourceModal /></div>
            </div>
          </div>
        </div>
  
        {/* Filters Component */}
        <ResourceFilters />
  
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Resources Grid */}
          <div className="w-full order-2 lg:order-1">
            {resources.length === 0 ? (
              <div className="text-center py-16 sm:py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">No resources found</h3>
                <p className="text-slate-500 text-xs sm:text-sm">Try adjusting your filters or be the first to upload one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {resources.map((resource: any) => (
                  <ResourceCard key={resource._id} resource={resource} />
                ))}
              </div>
            )}
            
            {/* 🚀 URL-BASED NEXT.JS PAGINATION UI */}
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
  
          {/* Right Column: Sidebar */}
          <div className="w-full space-y-6 lg:sticky lg:top-8 order-1 lg:order-2">
            <TopUploaders />
            
            {/* Upload Guidelines Card */}
            <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden hidden md:block">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-0 opacity-50 pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-slate-900 font-serif text-lg">Upload Guidelines</h3>
              </div>
              
              <ul className="space-y-3 relative z-10">
                <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Upload clear, legible PDFs, documents or images.</span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Always include the correct <strong>Course Name</strong>.</span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Keep file sizes under 10MB when possible.</span>
                </li>
              </ul>
            </section>
          </div>
          
        </div>
      </div>
    </div>
  );
}