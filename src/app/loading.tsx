import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 w-full">
      <Loader2 className="w-10 h-10 text-[#0f172a] animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse tracking-wide">Loading workspace...</p>
    </div>
  );
}