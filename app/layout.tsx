import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-sans' })

const siteUrl = 'https://bridgecord.avikmukherjee.me'

export const metadata: Metadata = {
  title: {
    default: 'Bridgecord — Live Chat That Lives in Discord',
    template: '%s | Bridgecord',
  },
  description:
    'A lightweight live-chat widget that connects your website visitors to your Discord server. Reply from Discord, delight customers in real-time.',
  metadataBase: new URL(siteUrl),
  keywords: [
    'live chat',
    'Discord',
    'customer support',
    'chat widget',
    'Discord chat',
    'website chat',
    'real-time chat',
    'customer engagement',
    'Bridgecord',
  ],
  authors: [{ name: 'Avik Mukherjee' }],
  creator: 'Avik Mukherjee',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Bridgecord',
    title: 'Bridgecord — Live Chat That Lives in Discord',
    description:
      'A lightweight live-chat widget that connects your website visitors to your Discord server. Reply from Discord, delight customers in real-time.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Bridgecord — Live chat that lives in Discord',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bridgecord — Live Chat That Lives in Discord',
    description:
      'Connect your website visitors to your Discord server. Reply from Discord, delight customers in real-time.',
    images: ['/og-image.jpg'],
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
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
