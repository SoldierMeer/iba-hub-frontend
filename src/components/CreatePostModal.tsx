'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast'; // 🚀 Added toast for better UX

export default function CreatePostModal() {
  const [isOpen, setIsOpen] = useState(false);
  // We can safely remove the 'loading' state since the UI closes instantly now!
  const { requireAuth } = useAuth();

  const [formData, setFormData] = useState({
    title: '', content: '', category: 'General', tags: '' 
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return toast.error('Title and content are required');
    
    // 🚀 1. CAPTURE DATA LOCALLY
    const payload = { ...formData };
    const processedTags = payload.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    // 🚀 2. INSTANT UI RESET (Non-blocking)
    setFormData({ title: '', content: '', category: 'General', tags: '' });
    setIsOpen(false);
    toast.success("Posting your query..."); // Let the user know it's happening in the background

    // 🚀 3. BACKGROUND FETCH
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: payload.title,
          content: payload.content,
          category: payload.category, 
          tags: processedTags
        })
      });

      if (!res.ok) throw new Error('Failed to create post');

      // 🚀 4. SILENT DATA REFRESH
      // This fetches the new data from the server and magically pops it onto the screen
      router.refresh(); 
      
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Could not save post.');
    }
  };

  return (
    <>
      <Button 
        aria-label='ask question'
        onClick={() => requireAuth(() => setIsOpen(true))} 
        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-11 font-medium shadow-sm transition-colors"
      >
        Ask Question
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">Create a New Query</h2>
              <button aria-label='close modal' onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 sm:p-2 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1 sm:mb-1.5">Title</label>
                <Input 
                  placeholder="What is your question?" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={150}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1 sm:mb-1.5">Category</label>
                <select 
                  aria-label='category'
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl h-10 sm:h-11 px-3 sm:px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="General Discussion">General Discussion</option>
                  <option value="Academics & Courses">Academics & Courses</option>
                  <option value="Campus & Hostel">Campus & Hostel</option>
                  <option value="Admissions & Finance">Admissions & Finance</option>
                  <option value="Societies & Events">Societies & Events</option>
                  <option value="Career & Internships">Career & Internships</option>
                  <option value="Alumni Network">Alumni Network</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1 sm:mb-1.5">Details</label>
                <textarea 
                  className="w-full min-h-[120px] sm:min-h-[140px] p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-xs sm:text-sm"
                  placeholder="Provide more context so others can help you..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1 sm:mb-1.5">Tags <span className="text-slate-500 font-normal">(Comma separated)</span></label>
                <Input 
                  placeholder="e.g., ComputerScience, FYP, Midterms" 
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="h-10 sm:h-11 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                <Button aria-label='cancel' type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-10 sm:h-11 w-full sm:w-auto px-6 border-slate-200">
                  Cancel
                </Button>
                <Button aria-label='submit' type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 sm:h-11 w-full sm:w-auto px-6 shadow-sm">
                  Post Query
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}