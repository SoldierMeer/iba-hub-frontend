'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this query? This cannot be undone.')) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum/${postId}/replies`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete');
      router.push('/forum'); // Redirect back to feed
      router.refresh(); // Refresh the feed data
    } catch (error) {
      console.error(error);
      alert('Error deleting post');
      setLoading(false);
    }
  };

  return (
    <button 
      aria-label='delete'
      onClick={handleDelete}
      disabled={loading}
      className="text-slate-500 hover:text-red-500 transition-colors p-2"
      title="Delete Query"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}