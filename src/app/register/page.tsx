'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react'; // 👈 Added for visual flair

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Computer Science',
    semester: '1st',
    section: 'A',
    // 🚀 NEW ALUMNI FIELDS
    isAlumni: false,
    currentPosition: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);

      if (response.data.success) {
        window.location.href = '/'; 
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans relative overflow-hidden py-12">
      
      {/* Background ambient blur */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0f172a] mb-2 tracking-tight">Join IBA Hub</h1>
          <p className="text-sm font-semibold text-slate-500">Create your campus digital account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-sm font-bold text-center animate-in fade-in">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-wider text-slate-600">First Name</Label>
              <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-5 text-sm font-medium" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-wider text-slate-600">Last Name</Label>
              <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-5 text-sm font-medium" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-600">University Email</Label>
            <Input id="email" name="email" type="email" placeholder="student@iba-suk.edu.pk" required value={formData.email} onChange={handleChange} className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-5 text-sm font-medium" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-600">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-5 text-sm font-medium" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-xs font-black uppercase tracking-wider text-slate-600">Department</Label>
            <select
              id="department" name="department" value={formData.department} onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0f172a] outline-none transition-all cursor-pointer"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Computer Systems Engineering">Computer Systems Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Education">Education</option>
              <option value="Media & Communications">Media & Communications</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </div>

          {/* 🚀 ALUMNI TOGGLE */}
          <label 
            htmlFor="isAlumni" 
            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
              formData.isAlumni ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              id="isAlumni"
              name="isAlumni"
              checked={formData.isAlumni}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <GraduationCap className={`w-5 h-5 ${formData.isAlumni ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-bold ${formData.isAlumni ? 'text-indigo-900' : 'text-slate-600'}`}>
                I have already graduated (Alumni)
              </span>
            </div>
          </label>

          {/* 🚀 CONDITIONAL RENDERING */}
          {!formData.isAlumni ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-xs font-black uppercase tracking-wider text-slate-600">Semester</Label>
                <select
                  id="semester" name="semester" value={formData.semester} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0f172a] outline-none transition-all cursor-pointer"
                >
                  {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="section" className="text-xs font-black uppercase tracking-wider text-slate-600">Section</Label>
                <select
                  id="section" name="section" value={formData.section} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0f172a] outline-none transition-all cursor-pointer"
                >
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <Label htmlFor="currentPosition" className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                Current Position <span className="text-slate-400 normal-case font-medium">(Company / Role)</span>
              </Label>
              <Input 
                id="currentPosition" 
                name="currentPosition" 
                placeholder="e.g. Software Engineer at Systems Ltd" 
                required={formData.isAlumni} 
                value={formData.currentPosition} 
                onChange={handleChange} 
                className="bg-indigo-50/30 border-indigo-100 focus:ring-2 focus:ring-indigo-600 rounded-xl px-4 py-5 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium" 
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-md transition-all mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0f172a] hover:underline font-black">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}