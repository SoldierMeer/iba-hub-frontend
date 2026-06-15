'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  TrendingUp, Users, MessageSquare, Star, ArrowRight, Activity, BookOpen
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [trendingComplaints, setTrendingComplaints] = useState<any[]>([]);
  const [onlinePeers, setOnlinePeers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Current User
        const userRes = await api.get('/users/me');
        const userData = userRes.data?.data || userRes.data?.user || userRes.data;
        setUser(userData);

        // 2. Fetch Trending Voice Issues (Grab all, sort by upvotes, take top 3)
        const voiceRes = await api.get('/complaints');
        const sortedComplaints = voiceRes.data.data
          .sort((a: any, b: any) => b.upvotes.length - a.upvotes.length)
          .slice(0, 3);
        setTrendingComplaints(sortedComplaints);

        // 3. Fetch Online Peers (From our chat directory)
        const chatRes = await api.get('/chat/users');
        const activeUsers = chatRes.data.data
          .filter((u: any) => u.isOnline)
          .slice(0, 4); // Just show up to 4 online peers
        setOnlinePeers(activeUsers);

      } catch (error) {
        console.error("Dashboard failed to load", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading your command center...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-slate-500 mt-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> {user?.department} • {user?.semester} Semester
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Contributor Points</p>
            <h3 className="text-2xl font-bold text-slate-900">{user?.contributorPoints || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Network Status</p>
            <h3 className="text-2xl font-bold text-slate-900">Active</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Your Role</p>
            <h3 className="text-2xl font-bold text-slate-900 capitalize">{user?.role || 'Student'}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Trending & Peers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Trending on Voice (Takes up 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Trending on IBA Voice
            </h2>
            <Link href="/voice" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {trendingComplaints.length === 0 ? (
              <p className="p-6 text-slate-500 text-center">No active issues at the moment.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {trendingComplaints.map((complaint) => (
                  <div key={complaint._id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{complaint.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{complaint.description}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg text-center shrink-0">
                        <span className="block text-sm font-bold text-blue-700">{complaint.upvotes.length}</span>
                        <span className="block text-[10px] font-medium text-blue-600 uppercase tracking-wider">Votes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Online Peers (Takes up 1/3 width) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> Online Now
            </h2>
            <Link href="/chat" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Open Chat
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2">
            {onlinePeers.length === 0 ? (
              <p className="p-4 text-slate-500 text-center text-sm">No peers currently online.</p>
            ) : (
              onlinePeers.map((peer) => (
                <Link 
                  key={peer._id} 
                  href="/chat"
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 border border-slate-200">
                      <AvatarImage src={peer.avatarUrl} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">{peer.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{peer.firstName} {peer.lastName}</h4>
                    <p className="text-xs text-slate-500 truncate">{peer.department}</p>
                  </div>
                  <MessageSquare className="w-4 h-4 text-slate-300" />
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}