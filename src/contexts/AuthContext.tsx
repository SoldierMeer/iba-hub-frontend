'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { X, ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // 🚀 TWEAKED: Now accepts both normal AND async functions perfectly!
  requireAuth: (action: Function) => void; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  requireAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true); // 🚀 Ensure loading state is active while fetching!
      try {
        const res = await api.get('/users/me', {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        setUser(res.data?.data || res.data?.user || res.data);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Don't fetch on auth pages
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        setIsLoading(false);
        return;
    }
    
    fetchUser();
  }, []); // 🚀 REMOVED pathname! Now it only checks once when the app mounts.

  // 🚀 THE MAGIC FUNCTION
  const requireAuth = (action: Function) => {
    if (isAuthenticated) {
      action(); // User is logged in, execute the action!
    } else {
      setShowModal(true); // User is a guest, show the firewall!
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, requireAuth }}>
      {children}
      
      {/* 🚀 GLOBAL GUEST INTERCEPTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-slate-100">
            
            {/* Header / Graphic */}
            <div className="h-32 bg-gradient-to-br from-[#0f172a] to-slate-800 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl z-10">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Unlock Full Access</h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
                Join the IBA Hub community to interact with posts, upload resources, and connect with thousands of peers and alumni.
              </p>
              
              <div className="flex flex-col gap-3">
                <Link href="/register" onClick={() => setShowModal(false)}>
                  <button className="w-full py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" /> Create Free Account
                  </button>
                </Link>
                <Link href="/login" onClick={() => setShowModal(false)}>
                  <button className="w-full py-3.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" /> Log In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}