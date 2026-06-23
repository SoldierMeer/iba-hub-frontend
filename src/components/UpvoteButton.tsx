'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api'; // 🚀 IMPORT YOUR CUSTOM API INSTANCE

interface UpvoteButtonProps {
  apiUrl: string;
  initialCount: number;
  initialVoteState?: 'up' | 'none';
}

export default function UpvoteButton({ apiUrl, initialCount, initialVoteState = 'none' }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voteState, setVoteState] = useState<'none' | 'up'>(initialVoteState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const { requireAuth } = useAuth();

  useEffect(() => {
    setVoteState(initialVoteState);
    setCount(initialCount);
  }, [initialVoteState, initialCount]);

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    requireAuth(async () => {
      if (loading || voteState === 'up') return;
      
      setLoading(true);
      try {
        // 🚀 THE FIX: Swapped raw axios for your custom 'api' instance
        const res = await api.put(apiUrl);
        setCount(res.data.data.length); 
        setVoteState('up'); 
        router.refresh();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to upvote'); 
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    
    requireAuth(async () => {
      if (loading || voteState === 'none') return; 
      
      setLoading(true);
      try {
        // 🚀 THE FIX: Swapped raw axios for your custom 'api' instance
        const res = await api.put(apiUrl);
        setCount(res.data.data.length); 
        setVoteState('none'); 
        router.refresh();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to remove upvote');
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
      <button 
        onClick={handleUpvote}
        disabled={loading || voteState === 'up'}
        className={`p-1 sm:p-1.5 rounded-full transition-colors ${
          voteState === 'up' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
        } ${loading && 'opacity-50 cursor-not-allowed'}`}
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
      </button>
      
      <span className={`text-sm sm:text-lg font-black ${count >= 10 ? 'text-emerald-600' : 'text-slate-700'}`}>
        {count}
      </span>
      
      <button 
        onClick={handleDownvote}
        disabled={loading || voteState === 'none'}
        className={`p-1 sm:p-1.5 rounded-full transition-colors ${
          voteState === 'none' ? 'text-slate-300 cursor-not-allowed opacity-50' : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
        } ${loading && 'opacity-50 cursor-not-allowed'}`}
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}