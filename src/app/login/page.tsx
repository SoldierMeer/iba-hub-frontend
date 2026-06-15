'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      if (response.data.success) {
        // 👈 CHANGED: Redirect straight to the universal Landing/Dashboard page
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans relative overflow-hidden">
      
      {/* Background ambient blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0f172a] mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-sm font-semibold text-slate-500">Log in to your IBA Hub account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-bold text-center animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-600">University Email</Label>
            <Input 
              id="email" name="email" type="email" 
              placeholder="student@iba-suk.edu.pk" required 
              value={formData.email} onChange={handleChange} 
              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-6 text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-600">Password</Label>
              <Link href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Forgot?</Link>
            </div>
            <Input 
              id="password" name="password" type="password" 
              placeholder="••••••••" required 
              value={formData.password} onChange={handleChange} 
              className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-6 text-sm font-medium"
            />
          </div>

          <Button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-md transition-all" disabled={loading}>
            {loading ? 'Authenticating...' : 'Log In to Workspace'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#0f172a] hover:underline font-black">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}