import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProHeadshot AI — Professional AI Headshot Generator',
  description: 'Generate studio-quality professional headshots with AI. Upload a selfie, choose a style, get LinkedIn-ready photos in minutes.',
  keywords: 'AI headshot generator, professional headshot AI, LinkedIn headshot generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
