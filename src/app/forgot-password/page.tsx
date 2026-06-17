'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Lock, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // STEP 1: Send the OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      toast.success('Check your email for the reset code!');
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP and Update Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', formData);
      toast.success('Password updated successfully!');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0f172a] mb-2 tracking-tight">Reset Password</h1>
          <p className="text-sm font-semibold text-slate-500">
            {step === 1 ? 'Enter your university email to get a reset code.' : 'Enter the code and your new password.'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-600">University Email</Label>
              <Input 
                id="email" name="email" type="email" placeholder="student@iba-suk.edu.pk" required 
                value={formData.email} onChange={handleChange} 
                className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-6 text-sm font-medium"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-md transition-all">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-xs font-black uppercase tracking-wider text-slate-600">Verification Code</Label>
              <Input 
                id="otp" name="otp" type="text" maxLength={6} placeholder="000000" required 
                value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})} 
                className="bg-slate-50 border-slate-200 text-center tracking-[1em] text-2xl font-black rounded-xl px-4 py-6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-wider text-slate-600">New Password</Label>
              <Input 
                id="newPassword" name="newPassword" type="password" placeholder="••••••••" required 
                value={formData.newPassword} onChange={handleChange} 
                className="bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#0f172a] rounded-xl px-4 py-6 text-sm font-medium"
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={() => setStep(1)} variant="outline" className="flex-1 rounded-xl font-bold border-slate-200 py-6">Back</Button>
              <Button type="submit" disabled={isLoading} className="flex-[2] bg-[#0f172a] text-white rounded-xl py-6 font-bold">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}