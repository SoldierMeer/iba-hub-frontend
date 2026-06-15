'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CreateAnnouncement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    priority: 'General'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/announcements', formData);
      toast.success('Announcement posted successfully!');
      router.push('/'); // Go back to dashboard
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Post Announcement</h1>
              <p className="text-sm text-slate-500">Broadcast a message to all IBA Hub students.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['General', 'Department', 'Urgent'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: level })}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      formData.priority === level
                        ? level === 'Urgent' 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {level === 'Urgent' && <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" />}
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your announcement here... Keep it clear and concise."
                className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 resize-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-2 text-right">{formData.message.length}/200 characters</p>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-base shadow-md transition-all"
            >
              {loading ? 'Posting...' : <><Send className="w-4 h-4 mr-2" /> Broadcast Announcement</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}