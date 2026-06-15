import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/providers/query-provider';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext'; // 👈 IMPORT ADDED
import GraduationModal from '@/components/GraduationModal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IBA Hub',
  description: 'The central campus platform for university students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <QueryProvider>
          {/* 🚀 WRAP THE APP IN AUTH PROVIDER */}
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <GraduationModal />
            <Navbar />
            
            <main className="flex-grow">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}