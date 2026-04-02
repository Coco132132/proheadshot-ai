import type { Metadata } from 'next'
import UploadSection from '@/components/UploadSection'

export const metadata: Metadata = {
  title: 'AI Headshot Generator — Professional Photos in Minutes | ProHeadshot AI',
  description: 'Upload your selfie and get a studio-quality professional headshot powered by AI. Perfect for LinkedIn, resumes, and company profiles.',
  keywords: 'AI headshot generator, professional headshot AI, linkedin headshot, resume photo AI',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#12110F] text-[#F0EBE1]">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4 bg-[#12110F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-gold font-bold text-xl tracking-tight">ProHeadshot<span className="text-white/40 font-light"> AI</span></span>
          <a href="/linkedin-headshot-generator" className="text-sm text-white/40 hover:text-[#C9A96E] transition-colors">
            LinkedIn Headshots →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-16 text-center overflow-hidden">
        {/* Ambient glow — warm gold, softer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#C9A96E]/6 blur-[120px] pointer-events-none" />
        {/* Subtle warm radial from center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#8B6914]/5 blur-[80px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/5 text-[#C9A96E] text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
            500,000+ professionals upgraded their headshot
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Your Next Opportunity<br />
            Starts With a{' '}
            <span className="text-gold">Great Photo</span>
          </h1>

          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
            Upload a selfie. Get a studio-quality professional headshot in under 60 seconds.
            No photographer. No studio. Just results.
          </p>

          {/* Price anchor */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-10">
            <span className="line-through text-white/30">Studio photo: $150+</span>
            <span className="w-px h-4 bg-white/20" />
            <span className="text-[#C9A96E] font-semibold">ProHeadshot AI: $9.99</span>
          </div>

          {/* Upload box */}
          <UploadSection />
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* Style previews */}
      <section className="py-20 px-4 bg-[#1A1916]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Three Styles. One Upload.</h2>
            <p className="text-white/40">Every style is optimized for a specific professional context.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { style: 'Professional', desc: 'Best for LinkedIn', hint: 'Light neutral background · Business feel', icon: '💼' },
              { style: 'Clean', desc: 'Best for Resumes', hint: 'White background · Formal & sharp', icon: '📄' },
              { style: 'Corporate', desc: 'Best for Company bios', hint: 'Dark gradient · Executive tone', icon: '🏢' },
            ].map((item) => (
              <div key={item.style} className="card-glass rounded-2xl p-6 glow-gold transition-all duration-300">
                <div className="bg-white/5 rounded-xl h-40 flex items-center justify-center mb-5 text-4xl">
                  {item.icon}
                </div>
                <p className="font-semibold text-[#E8D5A3] mb-1">{item.style}</p>
                <p className="text-xs text-white/30 mb-2">{item.hint}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* How it works */}
      <section className="py-20 px-4 bg-[#12110F]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-white/40">From selfie to professional headshot in three steps.</p>
          </div>
          <div className="space-y-4">
            {[
              { n: '01', title: 'Upload Your Photo', desc: 'Any selfie or portrait works. JPG or PNG, under 10MB. Your face clearly visible.' },
              { n: '02', title: 'Choose Your Style', desc: 'Pick Professional, Clean, or Corporate. Each is designed for a different use case.' },
              { n: '03', title: 'Download in HD', desc: 'Get 4 AI-generated headshots at 1024px+. One-time payment of $9.99. No subscription.' },
            ].map((item) => (
              <div key={item.n} className="card-glass rounded-2xl p-6 flex gap-5 items-start">
                <span className="text-[#C9A96E]/30 font-bold text-3xl leading-none mt-1 tabular-nums">{item.n}</span>
                <div>
                  <p className="font-semibold text-[#E8D5A3] mb-1">{item.title}</p>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* FAQ */}
      <section className="py-20 px-4 bg-[#1A1916]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">FAQ</h2>
          <div className="space-y-6">
            {[
              { q: 'Is this free to use?', a: 'Preview all 4 headshots for free (with watermark). Download HD versions for $9.99 — one-time, no subscription.' },
              { q: 'Do I need to create an account?', a: 'No. Upload, generate, pay, and download — all without signing up. Zero friction.' },
              { q: 'What photo should I upload?', a: 'A clear selfie or portrait. Face clearly visible, decent lighting. The AI handles the rest.' },
              { q: 'How long does it take?', a: 'Usually 20–60 seconds. A progress bar will show you the status in real time.' },
              { q: 'Can I use this for LinkedIn?', a: 'Absolutely — that\'s what we\'re built for. The Professional style is specifically optimized for LinkedIn profiles.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/5 pb-6">
                <p className="font-medium text-[#E8D5A3] mb-2">{item.q}</p>
                <p className="text-white/40 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-white/25 text-sm">
        <p>
          © 2024 ProHeadshot AI ·{' '}
          <a href="/linkedin-headshot-generator" className="hover:text-[#C9A96E] transition-colors">LinkedIn Headshots</a>
          {' · '}Privacy · Terms
        </p>
      </footer>
    </main>
  )
}
