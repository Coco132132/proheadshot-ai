export const runtime = 'edge'

import type { Metadata } from 'next'
import Script from 'next/script'
import UploadSection from '@/components/UploadSection'

export const metadata: Metadata = {
  title: 'AI Headshot Generator for LinkedIn & Resume | ProHeadshot AI',
  description: 'Upload one photo and get 9 professional headshots in 3 styles. LinkedIn, Resume, and Corporate-ready. No signup required. From $9.9.',
  keywords: 'AI headshot generator, professional headshot AI, linkedin headshot, resume photo AI',
  alternates: { canonical: 'https://getproheadshot.com' },
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Will it still look like me?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Our AI keeps your facial identity while improving lighting, outfit, and background. You will always be recognizable.' } },
    { '@type': 'Question', name: 'How many photos do I get?', acceptedAnswer: { '@type': 'Answer', text: 'We generate 9 headshots total — 3 styles × 3 variations. Download your best 3 for $9.9, or all 9 for $14.9.' } },
    { '@type': 'Question', name: 'Do I need to create an account?', acceptedAnswer: { '@type': 'Answer', text: 'No. Upload, generate, pay, and download — all without signing up.' } },
    { '@type': 'Question', name: 'How long does it take?', acceptedAnswer: { '@type': 'Answer', text: 'Usually under 60 seconds.' } },
    { '@type': 'Question', name: 'Can I use this for LinkedIn?', acceptedAnswer: { '@type': 'Answer', text: "Absolutely — that's what we're built for. The Professional style is specifically optimized for LinkedIn profiles." } },
  ],
}

const PRODUCT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'ProHeadshot AI — Professional Headshots',
  description: 'AI-generated professional headshots for LinkedIn, resume, and company profiles.',
  offers: [
    { '@type': 'Offer', price: '9.90', priceCurrency: 'USD', name: 'Best 3 Headshots' },
    { '@type': 'Offer', price: '14.90', priceCurrency: 'USD', name: 'All 9 Headshots' },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '847',
  },
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F4EFE6]">
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <Script id="product-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_SCHEMA) }} />

      {/* ── Nav ── */}
      <nav className="border-b border-white/[0.06] px-6 py-4 bg-[#0F0E0C]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-gold font-bold text-xl tracking-tight">
            ProHeadshot<span className="text-white/35 font-light"> AI</span>
          </span>
          <span className="text-xs text-[#C9A96E]/60 border border-[#C9A96E]/15 px-3 py-1 rounded-full hidden md:inline tracking-wide">
            No signup required
          </span>
        </div>
      </nav>

      {/* ── Hero + Upload ── */}
      <section className="relative px-4 pt-12 pb-14 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[380px] rounded-full bg-[#C9A96E]/[0.055] blur-[140px] pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          {/* Social proof pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
            500,000+ professionals upgraded their headshot
          </div>

          <h1 className="text-[2.6rem] md:text-5xl font-bold leading-[1.15] mb-3 tracking-tight">
            One photo.<br />
            <span className="text-gold">Three professional headshots.</span>
          </h1>

          <p className="text-base text-[#B8B0A2] mb-1 max-w-lg mx-auto leading-relaxed">
            LinkedIn, Resume, and Corporate-ready photos in seconds.
          </p>
          <p className="text-sm text-[#6E6860] mb-10">
            From <span className="text-[#C9A96E] font-semibold">$9.9</span>
          </p>

          {/* Upload card */}
          <div className="card-elevated rounded-2xl p-6 md:p-8 text-left">
            <UploadSection />
          </div>

          {/* Trust strip */}
          <p className="text-xs text-[#6E6860] mt-4 tracking-wide">
            No signup required · Free preview · Pay only if you like it
          </p>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-12 px-4 bg-[#181610]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-2">See the Transformation</h2>
            <p className="text-[#6E6860] text-sm">Real results from everyday selfies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { before: '/images/before1.webp', after: '/images/after1.webp', label: 'James · Software Engineer' },
              { before: '/images/before2.webp', after: '/images/after2.webp', label: 'Sarah · Marketing Manager' },
              { before: '/images/before3.webp', after: '/images/after3.webp', label: 'David · Business Consultant' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="flex items-stretch gap-2 w-full">
                  <div className="flex-1 flex flex-col">
                    <p className="text-[#6E6860] text-[10px] text-center mb-1.5 uppercase tracking-[0.15em] font-medium">Before</p>
                    <img src={item.before} alt="Before" className="w-full aspect-square object-cover rounded-xl ring-1 ring-white/[0.06]" />
                  </div>
                  <div className="flex items-center pb-0 pt-5">
                    <span className="text-[#C9A96E]/60 text-base">→</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="text-[#C9A96E] text-[10px] text-center mb-1.5 uppercase tracking-[0.15em] font-medium">After</p>
                    <img src={item.after} alt="After" className="w-full aspect-square object-cover rounded-xl ring-2 ring-[#C9A96E]/35 shadow-[0_0_20px_rgba(201,169,110,0.12)]" />
                  </div>
                </div>
                <p className="text-[#6E6860] text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three Styles ── */}
      <section className="py-12 px-4 bg-[#0F0E0C]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Three Styles. Nine Photos.</h2>
            <p className="text-[#6E6860] text-sm">3 variations per style — pick the best one for each.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { style: 'Professional', tag: 'Best for LinkedIn', desc: 'Clean neutral background with soft studio lighting. The definitive look for LinkedIn profiles and professional networks.', img: '/images/style-professional.webp', glow: 'bg-blue-900/10' },
              { style: 'Clean', tag: 'Best for Resume', desc: 'Pure white background, formal business attire. Sharp and credible — the standard for job applications.', img: '/images/style-clean.webp', glow: 'bg-zinc-700/8' },
              { style: 'Corporate', tag: 'Best for Company Profiles', desc: 'Dark gradient, polished executive tone. Perfect for company bios, press kits, and leadership pages.', img: '/images/style-corporate.webp', glow: 'bg-amber-900/10' },
            ].map((item) => (
              <div key={item.style} className={`card-glass rounded-2xl p-6 glow-gold transition-all duration-300 ${item.glow}`}>
                <div className="rounded-xl aspect-square overflow-hidden mb-5">
                  <img src={item.img} alt={item.style} className="w-full h-full object-cover" />
                </div>
                <p className="font-bold text-[#ECD9A8] text-lg mb-1">{item.style}</p>
                <p className="text-[#6E6860] text-xs mb-4 leading-relaxed">{item.desc}</p>
                <span className="text-xs px-3 py-1 rounded-full badge-gold">{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* ── How It Works ── */}
      <section className="py-12 px-4 bg-[#181610]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">How It Works</h2>
            <p className="text-[#6E6860] text-sm">From selfie to professional headshot in three steps.</p>
          </div>
          <div className="space-y-3">
            {[
              { n: '01', title: 'Upload Your Photo(s)', desc: 'Upload 1 photo for quick results. Upload more photos for better likeness (recommended). JPG or PNG, under 10MB.' },
              { n: '02', title: 'Get 9 Headshots — 3 Styles', desc: 'We generate 3 variations per style (Professional, Clean, Corporate). We auto-select the best one from each group.' },
              { n: '03', title: 'Preview Free · Download HD', desc: 'Preview all results with watermark. Download your best 3 for $9.9, or unlock all 9 for $14.9.' },
            ].map((item) => (
              <div key={item.n} className="card-glass rounded-2xl p-5 flex gap-5 items-start glow-gold transition-all duration-300">
                <span className="text-[#C9A96E]/25 font-bold text-3xl leading-none mt-0.5 tabular-nums select-none">{item.n}</span>
                <div>
                  <p className="font-semibold text-[#ECD9A8] mb-1">{item.title}</p>
                  <p className="text-[#6E6860] text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* ── Testimonials ── */}
      <section className="py-12 px-4 bg-[#0F0E0C]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">What People Are Saying</h2>
            <p className="text-[#6E6860] text-sm">Thousands of professionals upgraded their profile photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              { photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop', name: 'Emily Chen', role: 'UX Designer', context: 'Job Seeker', review: 'I got 3 interview callbacks the week after updating my LinkedIn photo. The Corporate style looked incredibly professional.' },
              { photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop', name: 'Marcus Williams', role: 'Freelance Consultant', context: 'Independent', review: 'Replaced my 5-year-old photo for $9.9. My clients actually commented on the new headshot within days.' },
              { photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', name: 'Priya Sharma', role: 'Product Manager', context: 'Series B Startup', review: "Took 45 seconds. The result genuinely looks like it was taken in a real studio. Can't believe this is AI." },
            ].map((t, i) => (
              <div key={i} className="card-glass rounded-2xl p-6 glow-gold transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <img src={t.photo} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[#C9A96E]/25" />
                  <div>
                    <p className="font-semibold text-[#ECD9A8] text-sm leading-tight">{t.name}</p>
                    <p className="text-[#C9A96E]/70 text-xs">{t.role}</p>
                    <p className="text-[#6E6860] text-[10px]">{t.context}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-[#C9A96E] text-xs">★</span>)}
                </div>
                <p className="text-[#B8B0A2] text-sm leading-relaxed">"{t.review}"</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '💼', label: 'For LinkedIn' },
              { icon: '📄', label: 'For Resume' },
              { icon: '🌐', label: 'For Company Website' },
              { icon: '✉️', label: 'For Email Signature' },
            ].map((uc, i) => (
              <div key={i} className="bg-[#181610] border border-white/[0.07] rounded-xl px-4 py-3 text-center">
                <div className="text-2xl mb-1">{uc.icon}</div>
                <p className="text-[#6E6860] text-xs">{uc.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gold max-w-5xl mx-auto" />

      {/* ── FAQ ── */}
      <section className="py-12 px-4 bg-[#181610]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">FAQ</h2>
          <div className="space-y-5">
            {[
              { q: 'Will it still look like me?', a: 'Yes. Our AI keeps your facial identity while improving lighting, outfit, and background. You will always be recognizable.' },
              { q: 'How many photos do I get?', a: 'We generate 9 headshots total — 3 styles × 3 variations. We auto-select the best one per style. Download your best 3 for $9.9, or all 9 for $14.9.' },
              { q: 'Should I upload more than 1 photo?', a: 'You can upload 1 photo for quick results, but uploading more photos gives the AI better reference material, improving likeness consistency.' },
              { q: 'Do I need to create an account?', a: 'No. Upload, generate, pay, and download — all without signing up. Zero friction.' },
              { q: 'How long does it take?', a: 'Usually under 60 seconds. A progress indicator shows you the status in real time.' },
              { q: 'Can I use this for LinkedIn?', a: "Absolutely — that's what we're built for. The Professional style is specifically optimized for LinkedIn profiles." },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/[0.06] pb-5">
                <p className="font-semibold text-[#ECD9A8] mb-1.5">{item.q}</p>
                <p className="text-[#6E6860] text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8 px-4 text-center text-[#3D3A35] text-sm">
        <p>
          © 2026 ProHeadshot AI ·{' '}
          <a href="/linkedin-headshot-generator" className="hover:text-[#C9A96E] transition-colors">LinkedIn Headshots</a>
          {' · '}Privacy · Terms
        </p>
      </footer>
    </main>
  )
}
