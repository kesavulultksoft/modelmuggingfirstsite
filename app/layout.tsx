import type { Metadata } from 'next'
import { Playfair_Display, Poppins } from 'next/font/google'
import JsonLd from '@/components/site/JsonLd'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://modelmugging.org'

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: 'Model Mugging® | Full-Force Self Defense Classes',
    template: '%s | Model Mugging',
  },
  description:
    'Original full-force self defense since 1971. Weekend courses, small classes, padded-assailant training — learn to fight back with confidence.',
  keywords: [
    'self defense for women',
    'Model Mugging',
    'full force self defense',
    'women self defense class',
  ],
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Model Mugging' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/favicon-logo.jpg', type: 'image/jpeg', sizes: 'any' }],
    apple: [{ url: '/apple-touch-logo.jpg', type: 'image/jpeg' }],
  },
}

const orgJson = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Model Mugging',
  url: site,
  description: 'Full-force self defense training since 1971.',
  sameAs: [],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${poppins.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <JsonLd data={orgJson} />
        {children}
      </body>
    </html>
  )
}
