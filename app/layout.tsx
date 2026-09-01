import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import GoogleProvider from '@/components/GoogleProvider';
import { ConfirmProvider } from '@/context/ConfirmContext';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
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
    <html lang="id" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F8F9FA] text-[#09090B] selection:bg-zinc-900 selection:text-white overflow-x-hidden">
        <GoogleProvider>
          <ConfirmProvider>
            <AuthGuard>
              <Navbar />
              <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
              <footer className="border-t border-zinc-200 py-8 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center text-white font-black text-[10px]">
                      WL
                    </div>
                    <span>White Label Multi-Tenant Ecosystem &copy; 2026.</span>
                  </div>
                  <div className="flex items-center gap-6 text-zinc-400">
                    <span>Gate Access Control</span>
                    <span>&bull;</span>
                    <span>Distributed Seat Lock</span>
                    <span>&bull;</span>
                    <span>Cashless POS</span>
                  </div>
                </div>
              </footer>
            </AuthGuard>
          </ConfirmProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}

