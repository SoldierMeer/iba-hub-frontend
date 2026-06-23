'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast'; // 🚀 Added toast
import api from '@/lib/api'; // 🚀 Import your configured Axios instance

export default function ReplyForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('');
  const router = useRouter();
  const { requireAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    requireAuth(async () => {
      // 🚀 1. CAPTURE DATA LOCALLY
      const payload = content;

      // 🚀 2. INSTANT UI RESET
      setContent('');
      toast.success("Sending reply...");

      // 🚀 3. BACKGROUND FETCH
      // 🚀 3. BACKGROUND FETCH
      try {
        // Swapped raw fetch for your custom api instance!
        await api.post(`/forum/${postId}/replies`, { 
          content: payload 
        });

        // 🚀 4. SILENT DATA REFRESH
        router.refresh();
        
      } catch (error) {
        console.error(error);
        toast.error('Failed to post reply. Please try again.');
        setContent(payload); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-lg border border-slate-200 shadow-sm">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">Add your perspective</h3>
      <textarea
        onClick={() => requireAuth(() => {})} 
        className="w-full min-h-[100px] sm:min-h-[120px] p-3 border border-slate-200 rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-xs sm:text-sm mb-3 bg-white"
        placeholder="Type your answer, solution, or follow-up question here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="flex justify-end">
        {/* Button no longer needs 'disabled={loading}' */}
        <Button aria-label='reply' type="submit" disabled={!content.trim()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 h-10 sm:h-10 rounded-lg sm:rounded-md">
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          Post Reply
        </Button>
      </div>
    </form>
  );
}