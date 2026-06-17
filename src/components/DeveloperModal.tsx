import React from 'react';
import Image from 'next/image';
import { 
  X, Code2, Github, Linkedin, Server, 
  Database, Globe, Layers, PaintBucket 
} from 'lucide-react';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeveloperModal({ isOpen, onClose }: DeveloperModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0f172a]/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Close Button (Independent of scroll) */}
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 🚀 Single Scrolling Container for Header + Content */}
        <div className="overflow-y-auto w-full flex-1">
          
          {/* Header/Banner */}
          <div className="h-20 sm:h-24 bg-gradient-to-r from-[#0f172a] to-slate-700 w-full shrink-0"></div>

          {/* Content Area */}
          <div className="px-6 sm:px-8 pb-8 relative text-center">
            
            {/* Profile Image - No longer clipped! */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto -mt-14 sm:-mt-16 mb-4 rounded-full border-[5px] border-white shadow-xl bg-slate-50 relative shrink-0 z-10 overflow-hidden">
              <Image 
                src="/meer-profile1.png" 
                alt="Meer Muhammad" 
                width={600} 
                height={400}
                quality={100} 
                priority 
                // 🚀 CHANGED: Aggressive 170% zoom and pushed down slightly
                className="w-full h-full object-cover object-top scale-[1.5] translate-y-6" 
              />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Meer Muhammad</h2>
            
            <p className="text-xs sm:text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">
              Full Stack AI Developer
            </p>
            
            <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
              Hi! I'm a Computer Science student at Sukkur IBA University specializing in AI, and a freelance web developer. I built IBA Hub to provide students with a seamless, modern platform to connect and collaborate.
            </p>

            {/* Tech Stack Section */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> Core Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">Next.js</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">TypeScript</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"><Server className="w-3 h-3"/> Node.js</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"><Layers className="w-3 h-3"/> Express.js</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"><Database className="w-3 h-3"/> MongoDB</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"><Globe className="w-3 h-3"/> Socket.io</span>
                <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"><PaintBucket className="w-3 h-3"/> Tailwind CSS</span>
              </div>
            </div>

            {/* Action Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <a 
                href="https://meer-dev.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4" /> Portfolio
              </a>
              <a 
                href="https://linkedin.com/in/meer-muhammad-ansari-678040178" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#0077b5] text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </a>
              <a 
                href="https://github.com/SoldierMeer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <Github className="w-4 h-4" /> GitHub
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}