'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AcceptAnswerButton({ replyId, isAccepted }: { replyId: string, isAccepted: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      // 🔐 CRITICAL: withCredentials ensures your auth cookie is sent!
      const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/replies/${replyId}/accept`, {}, {
        withCredentials: true 
      });
      
      toast.success(isAccepted ? 'Answer un-selected' : 'Answer marked as solved!');
      router.refresh();
      
    } catch (error: any) {
      console.error(error);
      // This will pop up the exact backend error on your screen instead of a generic one
      toast.error(error.response?.data?.message || 'Failed to accept answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
        isAccepted 
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
          : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-emerald-600'
      } ${loading && 'opacity-50 cursor-not-allowed'}`}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      {isAccepted ? 'Selected Answer' : 'Mark as Answer'}
    </button>
  );
}