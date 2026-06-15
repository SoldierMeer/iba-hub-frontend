'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ForumSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, setIsPending] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 🚀 THE INFINITE LOOP BLOCKER
    const currentUrlSearch = searchParams.get('search') || '';
    if (searchTerm === currentUrlSearch) {
      setIsPending(false);
      return;
    }

    setIsPending(true);
    
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm);
      } else {
        params.delete('search');
      }
      
      params.delete('page'); 
      
      router.push(`?${params.toString()}`);
      setIsPending(false);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, router, searchParams]); // 🚀 Restored the array so React doesn't crash during Hot Reloads!

  return (
    <div className="relative w-full mb-6 group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
      <input 
        type="text" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for existing queries before asking..." 
        className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm transition-all text-slate-800 placeholder:font-medium placeholder:text-slate-400"
      />
      {isPending && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 animate-spin" />
      )}
    </div>
  );
}