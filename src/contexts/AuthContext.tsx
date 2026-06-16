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
  requireAuth: (action: Function) => void; 
  logout: () => void; // 🚀 ADDED: Exported logout function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  requireAuth: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    // 1. Identify if we are on an auth page (using the pathname variable)
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        setIsLoading(false);
        return;
    }

    const fetchUser = async () => {
        // Only trigger loading state if we don't have user data yet
        if (!user) setIsLoading(true);

        try {
            const res = await api.get('/users/me');
            setUser(res.data?.data || res.data?.user || res.data);
            setIsAuthenticated(true);
        } catch (error: any) {
            // Check the status code. If it doesn't exist, it's likely a network/CORS error
            const status = error.response?.status;

            if (status === 401) {
                // 🚀 ONLY logout if the server says we are unauthorized
                console.warn("Auth check: 401 Unauthorized, clearing session.");
                setUser(null);
                setIsAuthenticated(false);
                if (typeof window !== 'undefined') {
                    // localStorage.removeItem('token'); 
                }
            } else {
                // 🚀 IGNORE CORS errors, 500 errors, or network hiccups
                // Keep the user logged in so the app doesn't flash the login screen
                console.error("Auth check: Non-401 error (CORS/Network), keeping session alive.", error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    fetchUser();
}, [pathname]); // pathname is the dependency

  // 🚀 THE MAGIC FUNCTION
  const requireAuth = (action: Function) => {
    if (isAuthenticated) {
      action(); // User is logged in, execute the action!
    } else {
      setShowModal(true); // User is a guest, show the firewall!
    }
  };

  // 🚀 NEW LOGOUT FUNCTION
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token'); // Destroy the token
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login'; // Force redirect to clear cache state
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, requireAuth, logout }}>
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