'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api'; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Download, FileText, Calendar, HardDrive, DownloadCloud, Maximize, Minimize, FileIcon, Share2, ExternalLink, Presentation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserProfileModal from '@/components/UserProfileModal';
import { optimizeImage } from '@/lib/cloudinary';

export default function ResourceCard({ resource }: { resource: any }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloads, setDownloads] = useState(resource.downloads || 0); 
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // 🚀 Normalized File Types
  const fileTypeStr = (resource.fileType || 'document').toLowerCase();
  const isLink = fileTypeStr === 'link';
  const isZip = fileTypeStr === 'zip';
  const isPPT = fileTypeStr === 'ppt';
  const isTxt = fileTypeStr === 'txt';
  const isPdf = fileTypeStr === 'pdf';
  const isDoc = fileTypeStr === 'document' || fileTypeStr === 'doc' || fileTypeStr === 'docx';
  const isImage = fileTypeStr === 'image' || fileTypeStr.includes('image');

  // 🚀 Safe URL Formatter
  const getValidUrl = (url: string) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const fixedUrl = getValidUrl(resource.fileUrl);

  // 🚀 SMART PREVIEW ROUTER
  const getPreviewUrl = () => {
    if (!fixedUrl) return '';
    const isGoogleDrive = fixedUrl.includes('drive.google.com');

    if (isImage || isTxt) {
      return fixedUrl; 
    } else if (isGoogleDrive) {
      return fixedUrl.replace(/\/view.*$/, '/preview'); 
    } else if (isPPT) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fixedUrl)}`; 
    } else {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fixedUrl)}&embedded=true`; 
    }
  };

  const previewUrl = getPreviewUrl();

  const handleDownload = async () => {
    if (!fixedUrl) return toast.error("Resource URL is missing!");
    
    setIsDownloading(true);

    try {
      // 1. Update counter in the background
      api.put(`/resources/${resource._id}/download`)
        .then(() => setDownloads((prev: number) => prev + 1))
        .catch((err) => console.warn("Counter update failed", err));

      // 2. 🚀 THE BLOB FETCH METHOD (Perfect Filenames & Formats)
      // We use vanilla fetch without JWT headers so Cloudinary allows the cross-origin request
      const response = await fetch(fixedUrl);
      if (!response.ok) throw new Error("Network fetch failed");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // 🚀 Force the exact original filename and extension!
      link.setAttribute('download', resource.fileName || `iba_hub_resource.${resource.fileType || 'pdf'}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Download complete!');
    } catch (error) {
      console.error("Blob download failed, falling back:", error);
      
      // 🚀 FALLBACK: If strict browsers block the fetch, fallback to Cloudinary URL
      let fallbackUrl = fixedUrl;
      const isCloudinary = fallbackUrl.includes('cloudinary.com');
      const isRawFile = fallbackUrl.includes('/raw/upload/');
      
      if (isCloudinary && !isRawFile && !fallbackUrl.includes('fl_attachment')) {
        // Strip the extension from the name to prevent Cloudinary 400 Errors
        const nameWithoutExt = (resource.fileName || 'document').replace(/\.[^/.]+$/, "");
        const safeName = encodeURIComponent(nameWithoutExt.replace(/[^a-zA-Z0-9_\-]/g, '_'));
        fallbackUrl = fallbackUrl.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
      }

      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.target = '_blank';
      link.download = resource.fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    const cleanSearchQuery = resource.title.trim().replace(/\s+/g, '+');
    const appLink = `${window.location.origin}/resources?search=${cleanSearchQuery}`;
    const message = encodeURIComponent(`🎓 Check out this academic resource on IBA Hub!\n\n*${resource.title}*\n_${resource.courseCode || 'General'}_\n\nLink: ${appLink}`);
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  const uploaderName = resource.uploader ? `${resource.uploader.firstName} ${resource.uploader.lastName}`.trim() : 'Unknown';
  const uploaderInitials = resource.uploader ? `${resource.uploader.firstName?.[0] || ''}${resource.uploader.lastName?.[0] || ''}` : '?';
  const formattedDate = new Date(resource.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <UserProfileModal isOpen={!!selectedUserId} onClose={() => setSelectedUserId(null)} userId={selectedUserId} />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col justify-between overflow-hidden group">
        
        <div className="p-4 sm:p-5 pb-0">
          <div className="flex justify-between items-start mb-3">
            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-transparent text-[9px] sm:text-[10px] uppercase tracking-wider font-bold truncate max-w-[150px]">
              {resource.fileType || 'Document'}
            </Badge>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full shrink-0">
              <DownloadCloud className="w-3 h-3" /> {downloads}
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1.5 sm:mb-2">
            {resource.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3 sm:mb-4 h-8 sm:h-10">
            {resource.description || 'No description provided.'}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
              <FileText className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[80px] sm:max-w-[100px]">{resource.courseCode || 'General'}</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-500 px-1 shrink-0">
              <HardDrive className="w-3 h-3" /> {resource.fileSize || 'Unknown Size'}
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-500 px-1 shrink-0">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 p-3 sm:p-4 bg-slate-50/50">
          <div 
            className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 cursor-pointer hover:opacity-80 transition-opacity w-full overflow-hidden"
            onClick={() => resource.uploader?._id && setSelectedUserId(resource.uploader._id)}
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-slate-200 shadow-sm shrink-0">
              <AvatarImage src={optimizeImage(resource.uploader?.avatarUrl, 100, 100)} alt={uploaderName} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">{uploaderInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">Uploaded By</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight mt-0.5 flex items-center gap-2 group-hover/name:text-indigo-600 transition-colors truncate">
                <span className="truncate">{uploaderName}</span>
                {resource.uploader?.isAlumni && (
                  <span className="bg-indigo-100 text-indigo-700 text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-black shrink-0">
                    Alumni
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              aria-label="Share Resource"
              variant="outline" 
              size="icon"
              onClick={handleShare}
              className="shrink-0 rounded-xl h-9 w-9 sm:h-10 sm:w-10 border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
              title="Share to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>

            {(!isLink && !isZip && !isTxt && !isPPT) && (
              <Button 
                aria-label="Preview Button"
                variant="outline"
                size="icon"
                onClick={() => setIsPreviewOpen(true)}
                className="shrink-0 rounded-xl h-9 w-9 sm:h-10 sm:w-10 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Preview Resource"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              </Button>
            )}

            {isLink ? (
              <a 
                href={fixedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  api.put(`/resources/${resource._id}/download`)
                     .then(() => setDownloads(prev => prev + 1)).catch(() => {});
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold transition-colors text-xs sm:text-sm px-2 overflow-hidden"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap truncate">Open Link</span>
                <span className="sm:hidden">Open</span>
              </a>
            ) : (
              <Button 
                aria-label="Download Resource"
                onClick={handleDownload} 
                disabled={isDownloading}
                className="flex-1 rounded-xl h-9 sm:h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold transition-colors text-xs sm:text-sm px-2 overflow-hidden"
              >
                {isDownloading ? '...' : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap truncate">{isPPT ? 'Download PPT' : isZip ? 'Download ZIP' : 'Download'}</span>
                    <span className="sm:hidden">Save</span>
                  </div>
                )}
              </Button>
            )}

          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={(open) => { setIsPreviewOpen(open); if (!open) setIsFullscreen(false); }}>
        <DialogContent className={`p-0 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? '!max-w-none !w-screen !h-screen !m-0 !rounded-none !border-0' : '!w-[95vw] !max-w-5xl h-[85vh] rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-2xl'}`}>
          <DialogHeader className="p-3 sm:p-4 border-b border-slate-100 bg-white shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-800 flex items-center justify-between pr-6 sm:pr-8">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                  {isPPT ? <Presentation className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="truncate flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-black leading-none truncate">{resource.title}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 sm:mt-1 truncate">{resource.fileName || 'document'}</p>
                </div>
              </div>
              <button 
                aria-label="Set Full Screen" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden sm:flex p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors items-center gap-2 text-sm font-bold border border-slate-200 shrink-0"
              >
                {isFullscreen ? <><Minimize className="w-4 h-4" /> Exit Fullscreen</> : <><Maximize className="w-4 h-4" /> Maximize</>}
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 bg-slate-100 relative">
            {isImage ? (
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-6">
                <img src={fixedUrl} alt={resource.title} className="max-w-full max-h-full object-contain rounded-lg sm:rounded-xl shadow-sm" />
              </div>
            ) : isPdf ? (
              <object data={fixedUrl} type="application/pdf" className="w-full h-full">
                <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview Fallback" />
              </object>
            ) : (
              <iframe src={previewUrl} className="w-full h-full border-0" title="Resource Preview" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}