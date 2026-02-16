import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'

const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Bridgecord — Live Chat for Discord Teams',
  description: 'A lightweight live chat widget that connects your website visitors to your Discord server. Reply from Discord, delight customers in real-time.',
}

export const viewport: Viewport = {
  themeColor: '#5865F2',
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
