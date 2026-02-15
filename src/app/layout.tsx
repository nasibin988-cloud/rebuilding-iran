import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { AuthProvider } from '@/lib/supabase/auth-context';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { getSections } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Rebuilding Iran: The Statesman\'s Education',
  description: 'A comprehensive educational curriculum for understanding Iran\'s past, present, and future. Covering origins, philosophy, governance, economics, and the blueprint for transformation.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rebuilding Iran',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c0c10',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sections = getSections('en');

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* PWA Icons */}
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-dark-50 dark:bg-dark-950 text-dark-900 dark:text-dark-100 transition-colors duration-200">
        <AuthProvider>
          <Providers>
            <ServiceWorkerRegistration />
            <OfflineIndicator />
            <div className="flex h-screen overflow-hidden">
              {/* Desktop Sidebar */}
              <div className="hidden md:block">
                <Sidebar sections={sections} />
              </div>
              {/* Mobile Navigation */}
              <MobileNav sections={sections} />
              <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
