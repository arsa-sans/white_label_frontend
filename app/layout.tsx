import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
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
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-zinc-500">
            White Label Multi-Tenant Platform &copy; 2026. Microservices &amp; High-Throughput Event Ecosystem.
          </div>
        </footer>
      </body>
    </html>
  );
}
