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
  metadataBase: new URL('https://hillhaat.com'),
  title: {
    default: 'Hill-Haat - Farm to Highway | NE India Marketplace',
    template: '%s | Hill-Haat',
  },
  description: 'Farm-to-Highway Marketplace connecting farmers from Northeast India\'s hilly regions with buyers across the nation. Fresh organic produce, exotic spices, traditional crafts - directly from Arunachal, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura.',
  keywords: [
    'Northeast India',
    'Farmers',
    'Marketplace',
    'Organic',
    'Spices',
    'Tea',
    'Agriculture',
    'Farm fresh',
    'Local produce',
    'Sikkim',
    'Assam tea',
    'Arunachal',
    'Meghalaya',
    'Nagaland',
    'Manipur',
    'Mizoram',
    'Tripura',
    'Farm to Highway',
    'Hill Haat',
  ],
  authors: [{ name: 'Hill-Haat Team' }],
  creator: 'Hill-Haat',
  publisher: 'Hill-Haat',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hill-Haat',
    startupImage: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/icon-512x512.png', media: '(device-width: 414px)' },
    ],
  },
  applicationName: 'Hill-Haat',
  formatDetection: {
    telephone: false,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'Hill-Haat',
    title: 'Hill-Haat - Farm to Highway Marketplace',
    description: 'Connecting farmers from Northeast India\'s hilly regions with buyers across the nation.',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Hill-Haat Logo',
      },
    ],
    locale: 'en_IN',
    alternateLocale: ['en_US', 'hi_IN'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hillhaat',
    creator: '@hillhaat',
    title: 'Hill-Haat - Farm to Highway Marketplace',
    description: 'Connecting farmers from Northeast India\'s hilly regions with buyers across the nation.',
    images: ['/icons/icon-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/icons/icon-32x32.png',
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icons/icon-512x512.png', color: '#059669' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Hill-Haat',
    'application-name': 'Hill-Haat',
    'msapplication-TileColor': '#059669',
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#059669',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#059669' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' },
  ],
  colorScheme: 'light dark',
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
          {/* PWA Meta Tags */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Hill-Haat" />
          
          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
          
          {/* Favicon Icons */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
          <link rel="shortcut icon" href="/favicon.ico" />
          
          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#059669" />
          <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
          <meta name="msapplication-notification" content="frequency=30;polling-uri=https://hillhaat.com/notifications;cycle=1" />
          
          {/* Additional PWA Tags */}
          <meta name="format-detection" content="telephone=no" />
          <meta name="format-detection" content="address=no" />
          
          {/* Theme Color for browsers */}
          <meta name="theme-color" content="#059669" />
          
          {/* Preconnect to external resources */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Splash screens for iOS */}
          <meta name="apple-touch-fullscreen" content="yes" />
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
