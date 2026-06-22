'use client';

import { useState, useRef } from 'react'; // 🚀 Added useRef
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function ResourceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 🚀 FIXED: Bind the timeout to this specific component instance
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 whenever a filter changes!
    params.delete('page'); 
    router.push(`?${params.toString()}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 700); 
  };

  return (
    <div className="bg-white p-3 md:p-3 rounded-2xl shadow-sm border border-slate-200 mb-6 sm:mb-8 flex flex-col md:flex-row items-center gap-3">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search resources, subjects, or course codes..." 
          className="w-full pl-10 border-slate-200 md:border-transparent bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl transition-colors text-sm h-11"
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => {
            // 🚀 FIXED: Proper React cleanup for debouncing
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => {
              updateParams('search', e.target.value);
            }, 500); // Bumped to 500ms to protect the database from rapid typers
          }}
        />
      </div>
      
      {/* Filters Wrapper */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">
        <div className="hidden md:flex items-center gap-2 text-slate-400 pl-2 border-l border-slate-200">
          <SlidersHorizontal className="w-4 h-4" />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full md:w-auto flex-1">
          <Select defaultValue={searchParams.get('department') || 'All'} onValueChange={(val) => updateParams('department', val)}>
            <SelectTrigger aria-label='select department' className="w-full md:w-[160px] h-10 sm:h-11 rounded-xl bg-white border-slate-200 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="BBA">BBA</SelectItem>
              <SelectItem value="CSE">CSE</SelectItem>
              <SelectItem value="EE">EE</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Physical Education">Physical Education</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get('type') || 'All'} onValueChange={(val) => updateParams('type', val)}>
            <SelectTrigger aria-label='select file type' className="w-full md:w-[130px] h-10 sm:h-11 rounded-xl bg-white border-slate-200 text-xs sm:text-sm font-medium">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="ppt">PPT</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="zip">ZIP Archive</SelectItem>
              <SelectItem value="link">External Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
          <Select defaultValue={searchParams.get('sort') || 'newest'} onValueChange={(val) => updateParams('sort', val)}>
            <SelectTrigger aria-label='select sorting' className="w-full md:w-[150px] h-10 sm:h-11 rounded-xl bg-slate-900 text-white border-transparent text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="downloads">Most Downloaded</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={handleRefresh}
            className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center justify-center shrink-0"
            title="Refresh Resources"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}