import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import GoogleProvider from '@/components/GoogleProvider';
import { ConfirmProvider } from '@/context/ConfirmContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'White Label — Multi-Tenant Event Ticketing & Cashless Platform',
  description: 'Enterprise White-Label Event Ticketing, Gate Access Control, and Cashless Venue Ecosystem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <GoogleProvider>
          <ConfirmProvider>
            <AuthGuard>
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="border-t border-slate-200 py-6 bg-white shadow-inner">
                <div className="max-w-7xl mx-auto px-4 text-center text-xs font-medium text-slate-500">
                  White Label Multi-Tenant Platform &copy; 2026. Microservices &amp; High-Throughput Event Ecosystem.
                </div>
              </footer>
            </AuthGuard>
          </ConfirmProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}

