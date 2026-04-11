import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Download Your Headshots — ProHeadshot AI',
}

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
