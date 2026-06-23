'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api'; // 🚀 IMPORT YOUR CUSTOM API INSTANCE

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this query? This cannot be undone.')) return;
    setLoading(true);

    try {
      // 🚀 THE FIX 1 & 2: Use custom API and correct the endpoint to just the postId
      await api.delete(`/forum/${postId}`);

      toast.success('Query deleted successfully');
      router.push('/forum'); // Redirect back to feed
      router.refresh(); // Refresh the feed data
    } catch (error: any) {
      console.error(error);
      // 🚀 THE FIX 3: Clean error handling
      toast.error(error.response?.data?.message || 'Error deleting post');
      setLoading(false); // Only set to false on error, let the redirect handle success state
    }
  };

  return (
    <button 
      aria-label='delete'
      onClick={handleDelete}
      disabled={loading}
      className={`text-slate-500 hover:text-red-500 transition-colors p-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Delete Query"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}