import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const runtime = 'edge'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ProHeadshot AI — Professional AI Headshot Generator',
  description: 'Generate studio-quality professional headshots with AI. Upload a selfie, choose a style, get LinkedIn-ready photos in minutes.',
  keywords: 'AI headshot generator, professional headshot AI, LinkedIn headshot generator',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
