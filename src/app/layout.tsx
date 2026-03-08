import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { PWAProvider } from '@/components/common/PWAProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hill-Haat | Farm to Highway Marketplace',
  description: 'Connecting farmers from Northeast India\'s hilly regions with buyers across the nation. Fresh produce, fair prices, direct connection.',
  keywords: ['Northeast India', 'Farmers', 'Marketplace', 'Organic', 'Spices', 'Tea', 'Agriculture'],
  authors: [{ name: 'Hill-Haat Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hill-Haat',
  },
  applicationName: 'Hill-Haat',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Hill-Haat | Farm to Highway Marketplace',
    description: 'Connecting farmers from Northeast India\'s hilly regions with buyers across the nation.',
    type: 'website',
    siteName: 'Hill-Haat',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hill-Haat | Farm to Highway Marketplace',
    description: 'Connecting farmers from Northeast India\'s hilly regions with buyers across the nation.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
          <meta name="msapplication-TileColor" content="#059669" />
          <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="format-detection" content="telephone=no" />
        </head>
        <body className={`${inter.className} antialiased`}>
          <PWAProvider>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </PWAProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
