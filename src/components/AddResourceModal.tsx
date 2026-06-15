'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Plus, Link as LinkIcon, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import JSZip from 'jszip'; 

const extractDriveId = (url: string) => {
  const match = url.match(/\/d\/(.+?)\/|id=(.+?)(&|$)/);
  return match ? (match[1] || match[2]) : null;
};

export default function AddResourceModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { requireAuth } = useAuth();

  const [uploadMethod, setUploadMethod] = useState<'file' | 'link' | 'google_drive'>('file');
  const [externalUrl, setExternalUrl] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState(''); 
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({ title: '', description: '', courseCode: '', department: '' });

  // 🚀 NEW STATE FOR THE OVERLAY
  const [isDriveOverlayOpen, setIsDriveOverlayOpen] = useState(false);
  const [driveLinkInput, setDriveLinkInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const totalSizeMB = selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024);
    setFileSizeStr(`${totalSizeMB.toFixed(1)} MB`);

    // 🚨 HEAVY FILE INTERCEPTOR
    if (totalSizeMB > 10) {
      setIsDriveOverlayOpen(true); // Open the overlay!
      setFiles([]); 
      if (e.target) e.target.value = ''; 
      return;
    }

    if (selectedFiles.length > 1) {
      const hasNonImage = selectedFiles.some(f => !f.type.toLowerCase().includes('image'));
      if (hasNonImage) {
        toast.error("You can only upload multiple files at once if they are ALL images.");
        if (e.target) e.target.value = ''; 
        setFiles([]);
        return;
      }
    }

    setUploadMethod('file');
    setFiles(selectedFiles);
  };

  // 🚀 OVERLAY CONFIRM HANDLER
  const handleConfirmDriveLink = () => {
    if (!driveLinkInput) return toast.error("Please paste the Drive link first.");
    const extractedId = extractDriveId(driveLinkInput);
    if (!extractedId) return toast.error("Invalid Google Drive link format.");

    setExternalUrl(driveLinkInput);
    setUploadMethod('google_drive');
    setIsDriveOverlayOpen(false); // Close overlay, return to main modal
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department) return toast.error("Please select a department.");
    if (uploadMethod === 'file' && files.length === 0) return toast.error("Please select a file.");
    if (uploadMethod === 'link' && !externalUrl) return toast.error("Please provide a valid link.");
    if (uploadMethod === 'google_drive' && !externalUrl) return toast.error("Please attach the Drive link.");

    setLoading(true);
    const toastId = toast.loading('Preparing submission...');

    try {
      if (uploadMethod === 'google_drive') {
        toast.loading('Saving Google Drive link...', { id: toastId });
        const extractedId = extractDriveId(externalUrl);
        
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('courseCode', formData.courseCode); 
        data.append('department', formData.department);
        data.append('externalUrl', externalUrl); // 🚀 FIXED: Sent as externalUrl to satisfy backend
        data.append('fileName', formData.title); 
        data.append('fileSize', fileSizeStr); 
        data.append('fileType', 'link'); 
        data.append('storageProvider', 'google_drive'); 
        if (extractedId) data.append('driveId', extractedId); 
        
        await api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } 
      else if (uploadMethod === 'link') {
        toast.loading('Submitting external link...', { id: toastId });
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('courseCode', formData.courseCode); 
        data.append('department', formData.department);
        data.append('externalUrl', externalUrl); 
        data.append('storageProvider', 'legacy');
        
        await api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } 
      else {
        if (files.length > 1) {
          toast.loading(`Compressing ${files.length} images into a ZIP folder...`, { id: toastId });
          const zip = new JSZip();
          files.forEach(f => zip.file(f.name, f));
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const safeTitleName = formData.title.replace(/[^a-zA-Z0-9]/g, '_'); 
          const zipFile = new File([zipBlob], `${safeTitleName}_Images.zip`, { type: 'application/zip' });

          toast.loading('Uploading compiled ZIP...', { id: toastId });
          const data = new FormData();
          data.append('title', formData.title);
          data.append('description', formData.description);
          data.append('courseCode', formData.courseCode); 
          data.append('department', formData.department);
          data.append('file', zipFile);
          data.append('fileName', zipFile.name);
          data.append('fileSize', `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB`);
          data.append('fileType', 'zip'); 
          data.append('storageProvider', 'cloudinary'); 

          await api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          toast.loading('Uploading resource...', { id: toastId });
          const file = files[0];
          const data = new FormData();
          data.append('title', formData.title);
          data.append('description', formData.description);
          data.append('courseCode', formData.courseCode); 
          data.append('department', formData.department);
          data.append('file', file);
          data.append('fileName', file.name);
          data.append('fileSize', `${(file.size / (1024 * 1024)).toFixed(2)} MB`);
          data.append('storageProvider', 'cloudinary'); 
          
          let fileType = 'document';
          if (file.type.toLowerCase().includes('pdf')) fileType = 'pdf';
          else if (file.type.toLowerCase().includes('image')) fileType = 'image';
          else if (file.name.toLowerCase().endsWith('.zip')) fileType = 'zip';
          else if (file.name.toLowerCase().includes('.ppt')) fileType = 'ppt';
          else if (file.name.toLowerCase().includes('.doc')) fileType = 'document';
          else if (file.name.toLowerCase().endsWith('.txt')) fileType = 'txt';
          data.append('fileType', fileType);

          await api.post('/resources', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }

      toast.success('Resource Submitted for Review!', { id: toastId });
      setOpen(false);
      setFiles([]);
      setExternalUrl('');
      setUploadMethod('file'); 
      setDriveLinkInput('');
      setFormData({ title: '', description: '', courseCode: '', department: '' }); 
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Upload failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => requireAuth(() => setOpen(true))} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm h-11 sm:h-12 px-6">
        <Plus className="w-4 h-4 mr-2" /> Upload Resource
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* 🚀 max-h-[90vh] overflow-y-auto ensures it never gets cut off on mobile screens */}
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 border-slate-200">
          
          {/* ========================================= */}
          {/* 🚀 OVERLAY VIEW (Shows only when heavy file is selected) */}
          {/* ========================================= */}
          {isDriveOverlayOpen ? (
            <div className="animate-in slide-in-from-right-4 duration-300 fade-in">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  Heavy File Detected
                </DialogTitle>
                <p className="text-sm text-slate-500 font-medium text-left mt-1">
                  Your file is <strong className="text-slate-800">{fileSizeStr}</strong>. To keep the app lightning fast, please link it via Google Drive.
                </p>
              </DialogHeader>

              <div className="space-y-3 mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm font-medium text-slate-700">
                <p>1. Upload the file to your Google Drive.</p>
                <p>2. Share ➔ Change access to <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded shadow-sm">Anyone with link</span>.</p>
                <p>3. Paste the copied link below:</p>
              </div>

              <Input 
                required type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={driveLinkInput}
                onChange={(e) => setDriveLinkInput(e.target.value)}
                className="w-full bg-white border border-blue-200 rounded-xl h-11 text-sm font-semibold focus:ring-2 focus:ring-blue-500 mb-6"
              />

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDriveOverlayOpen(false)}
                  className="flex-1 h-11 rounded-xl font-bold border-slate-200 text-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleConfirmDriveLink}
                  className="flex-1 h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Attach Link
                </Button>
              </div>
            </div>
          ) : (
            
            /* ========================================= */
            /* 🚀 MAIN FORM VIEW (Normal state) */
            /* ========================================= */
            <div className="animate-in slide-in-from-left-4 duration-300 fade-in">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" /> Share Material
                </DialogTitle>
              </DialogHeader>

              {/* Hide top tabs if a Google Drive link is already securely attached */}
              {uploadMethod !== 'google_drive' && (
                <div className="flex bg-slate-100 p-1 rounded-xl mt-2 sm:mt-4">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${uploadMethod === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileUp className="w-4 h-4" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('link')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${uploadMethod === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <LinkIcon className="w-4 h-4" /> Paste Link
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
                <Input 
                  required placeholder="Document Title (e.g., Midterm Notes)" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="rounded-xl bg-slate-50 border-slate-200 h-11 font-medium text-sm"
                />
                
                
                  <Input 
                    required placeholder="Course Name" 
                    value={formData.courseCode}
                    onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-medium text-sm py-2.5"
                  />
                  <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})} required>
                    <SelectTrigger className="w-full rounded-xl bg-slate-50 border-slate-200 h-11 font-medium text-sm">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="All">All Departments</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                      <SelectItem value="BBA">BBA</SelectItem>
                      <SelectItem value="Accounting & Finance">Accounting & Finance</SelectItem>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="EE">EE</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Physical Education">Physical Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                

                <textarea 
                  required placeholder="Brief description..." rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                
                {/* 🚀 DROPZONE */}
                {uploadMethod === 'file' && (
                  <div>
                    <Input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange}
                      className="rounded-xl bg-white border-slate-200 cursor-pointer file:mr-4 file:py-1 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-xs sm:text-sm"
                    />
                    <p className="text-[10px] text-slate-400 font-medium px-1 mt-1.5 leading-tight">
                      Files under 10MB upload instantly.
                    </p>
                  </div>
                )}

                {/* 🚀 LINK INPUT */}
                {uploadMethod === 'link' && (
                  <Input 
                    required type="url" 
                    placeholder="Paste external link here..." 
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="rounded-xl bg-slate-50 border-slate-200 h-11 font-medium text-sm"
                  />
                )}

                {/* 🚀 DRIVE LINK CONFIRMATION CARD (Shows on main form) */}
                {uploadMethod === 'google_drive' && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-bold text-blue-900">Drive Link Attached</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setUploadMethod('file'); setExternalUrl(''); }}
                      className="text-xs font-bold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 sm:h-12 rounded-xl mt-2">
                  {loading ? 'Processing...' : 'Submit Resource'}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}