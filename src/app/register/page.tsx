'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; 
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Computer Science',
    semester: '1st',
    section: 'A',
    isAlumni: false,
    currentPosition: '',
    otp: '' // 🚀 Added OTP field
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 🚀 STEP 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🚀 New Regex Pattern for student emails
    const studentEmailRegex = /^[a-zA-Z0-9_.-]+\.[a-z]+(f|s)\d{2,3}[a-z]*@iba-suk\.edu\.pk$/i;
    
    if (!studentEmailRegex.test(formData.email)) {
      return toast.error('Invalid student email format. Please check your credentials.');
    }
  
    setIsLoading(true);
    try {
      await api.post('/auth/send-otp', { email: formData.email, isAlumni: formData.isAlumni });
      toast.success('Verification code sent!');
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 STEP 2: Verify OTP and Register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.otp.length !== 6) {
      return toast.error('Please enter a valid 6-digit OTP.');
    }

    setIsLoading(true);
    try {
      // Send all formData including alumni and OTP fields
      await api.post('/auth/register', formData);
      toast.success('Registration successful! Welcome to the Hub.');
      router.push('/login'); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
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
          <p className="text-sm font-semibold text-slate-500">
            {step === 1 ? 'Create your campus digital account' : 'Check your university email.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
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

            <Button type="submit" disabled={isLoading} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-md transition-all mt-4">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Official Email <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 text-lg">Enter Verification Code</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                We sent a 6-digit code to <br />
                <span className="font-bold text-indigo-600 text-sm">{formData.email}</span>
              </p>
            </div>

            <input 
              required 
              type="text" 
              maxLength={6}
              placeholder="000000" 
              value={formData.otp} 
              onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})} 
              className="w-full text-center tracking-[1em] text-2xl bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-black text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" 
            />

            <div className="flex gap-3">
              <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-xl font-bold border-slate-200 text-slate-600 py-6">
                Back
              </Button>
              <Button disabled={isLoading || formData.otp.length !== 6} type="submit" className="flex-[2] bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold py-6">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
              </Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="mt-8 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0f172a] hover:underline font-black">
                Sign In here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}