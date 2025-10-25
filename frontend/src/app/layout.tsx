import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/user-context'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { PWAInstallBanner } from '@/components/pwa/pwa-install-banner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'GreenThumb - Discover Your Style',
    template: '%s | GreenThumb',
  },
  description: 'Discover products that match your unique style with AI-powered recommendations',
  keywords: ['fashion', 'style', 'discovery', 'recommendations', 'sustainable'],
  authors: [{ name: 'GreenThumb Team' }],
  creator: 'GreenThumb',
  publisher: 'GreenThumb',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://greenthumb.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://greenthumb.app',
    title: 'GreenThumb - Discover Your Style',
    description: 'Discover products that match your unique style with AI-powered recommendations',
    siteName: 'GreenThumb',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GreenThumb - Discover Your Style',
    description: 'Discover products that match your unique style with AI-powered recommendations',
    creator: '@greenthumb',
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
  verification: {
    google: 'google-site-verification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          <UserProvider>
            <AnalyticsProvider>
              <div className="relative flex min-h-full flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <Toaster />
              <PWAInstallBanner />
            </AnalyticsProvider>
          </UserProvider>
        </Providers>
      </body>
    </html>
  )
}
