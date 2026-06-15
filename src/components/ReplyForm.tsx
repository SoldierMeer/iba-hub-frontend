'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ReplyForm({ postId }: { postId: string }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { requireAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    requireAuth(async () => {
      setLoading(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/${postId}/replies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', 
          body: JSON.stringify({ content })
        });

        if (!res.ok) throw new Error('Failed to post reply');

        setContent('');
        router.refresh();
        
      } catch (error) {
        console.error(error);
        alert('Failed to post reply. Check the console for details.');
      } finally {
        setLoading(false);
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
        <Button aria-label='reply' type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 h-10 sm:h-10 rounded-lg sm:rounded-md">
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          {loading ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </form>
  );
}