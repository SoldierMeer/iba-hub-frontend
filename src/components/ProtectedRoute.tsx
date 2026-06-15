'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Show a clear loading state to prevent flickering
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-slate-500 font-bold animate-pulse">Verifying Access...</div>
      </div>
    );
  }

  // 2. HARD STOP: No silent redirects. Show exactly what is happening.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-center p-4">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 font-medium mb-6">You need to be securely logged in to view this page.</p>
        <Link href="/login" className="px-6 py-3 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all">
          Go to Login
        </Link>
      </div>
    );
  }

  // 3. User is verified, render the page content!
  return <>{children}</>;
}