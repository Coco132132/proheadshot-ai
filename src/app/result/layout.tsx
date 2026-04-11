import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Your Headshots — ProHeadshot AI',
}

export default function ResultLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
