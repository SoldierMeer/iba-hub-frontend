'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity, Clock, CheckCircle2, XCircle, Trash2, Loader2, FileIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MyUploadsModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); // For initial load
  const [isRefreshing, setIsRefreshing] = useState(false); // 🚀 Separate state for the spin button
  const [myResources, setMyResources] = useState<any[]>([]);
  const { requireAuth } = useAuth();

  // 🚀 Added 'isManual' flag to control which loader fires
  const fetchMyUploads = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/resources/me');
      setMyResources(res.data.data);
      if (isManual) toast.success('Uploads synced successfully!');
    } catch (error) {
      toast.error('Failed to load your uploads');
    } finally {
      if (isManual) {
        // 🚀 Add a tiny artificial delay so the spin animation feels satisfying!
        setTimeout(() => setIsRefreshing(false), 500);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (open) fetchMyUploads(false);
  }, [open]);

  const handleDelete = async (id: string) => {
    const toastId = toast.loading('Deleting resource...');
    try {
      await api.delete(`/resources/${id}`);
      setMyResources(prev => prev.filter(r => r._id !== id));
      toast.success('Rejected resource cleared', { id: toastId });
    } catch (error) {
      toast.error('Failed to delete resource', { id: toastId });
    }
  };

  return (
    <>
      <Button 
        onClick={() => requireAuth(() => setOpen(true))} 
        variant="outline"
        className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
      >
        <Activity className="w-4 h-4 text-indigo-600 shrink-0" /> Track My Uploads
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-2xl rounded-3xl p-0 border-slate-200 overflow-hidden">
          
          <DialogHeader className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between w-full pr-6 sm:pr-0">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
                  <Activity className="w-5 h-5 text-indigo-600 shrink-0" /> My Upload History
                </DialogTitle>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Track admin approvals or clear rejected submissions.</p>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => fetchMyUploads(true)} // 🚀 Trigger manual refresh
                disabled={isRefreshing || loading}
                className="shrink-0 rounded-xl h-9 w-9 sm:h-10 sm:w-10 border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                title="Refresh Status"
              >
                {/* 🚀 Tied to isRefreshing state */}
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-600'}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto bg-white">
            {loading ? (
              <div className="flex justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : myResources.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm font-medium">You haven't uploaded any resources yet.</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {myResources.map(resource => (
                  <div key={resource._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors gap-3 sm:gap-0">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1 pr-2">{resource.title}</h4>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5">{new Date(resource.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
                      {resource.status === 'pending' && <span className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-[10px] sm:text-xs font-bold rounded-full border border-orange-100"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Pending</span>}
                      {resource.status === 'approved' && <span className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-100"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Approved</span>}
                      {resource.status === 'rejected' && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] sm:text-xs font-bold rounded-full border border-red-100"><XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> Rejected</span>
                          <button onClick={() => handleDelete(resource._id)} className="p-1.5 sm:p-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}