export const runtime = 'edge'

import type { Metadata } from 'next'
import UploadSection from '@/components/UploadSection'

export const metadata: Metadata = {
  title: 'LinkedIn Headshot Generator — AI Professional Photos | ProHeadshot AI',
  description: 'Generate a professional LinkedIn headshot with AI. Upload your photo and get studio-quality results in under 60 seconds. No photographer needed.',
  keywords: 'linkedin headshot generator, linkedin profile photo, professional linkedin photo AI',
}

export default function LinkedInHeadshotPage() {
  return (
    <main className="min-h-screen bg-[#12110F] text-[#F0EBE1]">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#C9A96E]/5 blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="/" className="text-gold font-bold text-xl tracking-tight">ProHeadshot<span className="text-white/40 font-light"> AI</span></a>
          <span className="text-xs text-white/20 border border-white/10 px-3 py-1 rounded-full">LinkedIn Headshot Generator</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/5 text-[#C9A96E] text-sm mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
            Optimized for LinkedIn profiles
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5 tracking-tight">
            LinkedIn Headshot Generator —{' '}
            <span className="text-gold">AI-Powered</span>
          </h1>
          <p className="text-white/40 text-lg mb-4 max-w-xl mx-auto leading-relaxed">
            Profiles with professional headshots get <strong className="text-[#C9A96E]">14x more views</strong>.
            Upload your selfie and get a photo that makes recruiters stop scrolling.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-10">
            <span className="line-through text-white/25">Photographer: $150+</span>
            <span className="w-px h-4 bg-white/15" />
            <span className="text-[#C9A96E] font-semibold">ProHeadshot AI: $9.99</span>
          </div>
          <UploadSection />
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { stat: '14x', desc: 'More profile views', sub: 'with a professional headshot' },
              { stat: '36x', desc: 'More messages', sub: 'received from recruiters' },
              { stat: '9x', desc: 'More connections', sub: 'accepted' },
            ].map((item) => (
              <div key={item.stat} className="card-glass rounded-2xl p-6 text-center">
                <p className="text-4xl font-bold text-gold mb-1">{item.stat}</p>
                <p className="text-[#E8D5A3] font-medium text-sm">{item.desc}</p>
                <p className="text-white/25 text-xs mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* Tips */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">What Makes a Great LinkedIn Headshot?</h2>
          <div className="space-y-3">
            {[
              { tip: 'Clean, neutral background (light gray or white)', note: 'Our AI applies this automatically' },
              { tip: 'Face fills 60–70% of the frame', note: 'Upload a close-up portrait for best results' },
              { tip: 'Business casual or professional attire', note: 'Corporate and Professional styles add this context' },
              { tip: 'Natural, approachable expression', note: 'Smile slightly — approachable beats stiff' },
              { tip: 'No sunglasses, hats, or distracting backgrounds', note: 'AI removes distractions automatically' },
            ].map((item, i) => (
              <div key={i} className="card-glass rounded-xl p-4 flex items-start gap-4">
                <span className="text-[#C9A96E] mt-0.5 text-sm">✓</span>
                <div>
                  <p className="text-white/80 text-sm font-medium">{item.tip}</p>
                  <p className="text-white/25 text-xs mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">FAQ</h2>
          <div className="space-y-6">
            {[
              { q: 'What size should my LinkedIn headshot be?', a: 'LinkedIn recommends 400×400px minimum. Our AI generates at 1024px+ — well above the requirement.' },
              { q: 'Can I use an AI-generated headshot on LinkedIn?', a: 'Yes. Many professionals do. What matters is that it looks professional and represents you accurately.' },
              { q: 'How many headshots do I get?', a: '4 headshot variations. Preview all for free, then pay $9.99 to download all in HD — no watermark.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/5 pb-6">
                <p className="font-medium text-[#E8D5A3] mb-2">{item.q}</p>
                <p className="text-white/35 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4 text-center text-white/20 text-sm">
        <p>© 2026 ProHeadshot AI · <a href="/" className="hover:text-[#C9A96E] transition-colors">AI Headshot Generator</a> · Privacy · Terms</p>
      </footer>
    </main>
  )
}
