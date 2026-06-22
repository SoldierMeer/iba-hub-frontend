'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';

export default function ForumFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategory = searchParams.get('category') || 'All';
  
  // 🚀 THE FIX: Background fetching state
  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== 'All') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    params.delete('page');
    
    // 🚀 Smooth background fetch!
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-6 relative">
      {/* 🚀 Tiny global spinner to show filters are applying */}
      {isPending && <Loader2 className="absolute -top-6 right-0 w-4 h-4 text-indigo-600 animate-spin" />}

      {/* Tabs - Scrollable on mobile */}
      <div className="w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
        <div className="flex bg-slate-200/50 p-1 rounded-xl min-w-max">
          {['newest', 'trending', 'unanswered'].map((sortType) => (
            <button 
              aria-label='sort'
              key={sortType}
              onClick={() => updateFilter('sort', sortType)}
              className={`flex-1 md:flex-none text-center px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all capitalize whitespace-nowrap ${
                currentSort === sortType ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {sortType}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="flex items-center gap-2 w-full md:w-auto">
      <select 
          aria-label = 'departments'
          value={currentCategory}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl h-10 px-3 sm:px-4 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-56 truncate"
        >
          <option value="All Categories">All Categories</option>
          <option value="Academics & Courses">Academics & Courses</option>
          <option value="Campus & Hostel">Campus & Hostel</option>
          <option value="Admissions & Finance">Admissions & Finance</option>
          <option value="Societies & Events">Societies & Events</option>
          <option value="Career & Internships">Career & Internships</option>
          <option value="General Discussion">General Discussion</option>
          <option value="Alumni Network">Alumni Network</option>
        </select>
        <button aria-label='filters' className="bg-white border border-slate-200 text-slate-700 h-10 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 sm:gap-2 hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
    </div>
  );
}