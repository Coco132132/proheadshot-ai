'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface ResultData {
  images: string[]
  jobId: string
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('jobId')
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!jobId) { router.push('/'); return }

    let attempts = 0
    const maxAttempts = 30

    const poll = async () => {
      try {
        const res = await fetch(`/api/result?jobId=${jobId}`)
        if (!res.ok) throw new Error('Failed to load results')
        const data = await res.json()

        if (data.status === 'complete' && data.images?.length > 0) {
          setResult(data)
          setLoading(false)
          return
        }

        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }

        attempts++
        setPollCount(attempts)
        if (attempts >= maxAttempts) {
          setError('Generation timed out. Please try again.')
          setLoading(false)
          return
        }
        setTimeout(poll, 3000)
      } catch {
        setError('Failed to load your headshots. Please try again.')
        setLoading(false)
      }
    }

    poll()
  }, [jobId, router])

  const handleUnlock = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  /* ── Loading state ── */
  if (loading) {
    const seconds = pollCount * 3
    return (
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#ECD9A8] text-xl font-bold mb-2">Generating your headshots...</p>
          <p className="text-[#6E6860] text-sm mb-5">
            {seconds < 10 ? 'Starting up AI model...' :
             seconds < 30 ? 'Processing your photo...' :
             seconds < 60 ? 'Almost there...' : 'This is taking a bit longer than usual...'}
          </p>
          <div className="flex justify-center gap-1.5 mb-4">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  pollCount % 5 === i ? 'bg-[#C9A96E]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="text-[#3D3A35] text-xs">{seconds}s elapsed</p>
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-[#B8B0A2] text-lg mb-6">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/')} className="btn-gold px-8 py-3.5 rounded-xl font-bold">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const [featured, ...rest] = result.images

  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F4EFE6]">

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-xl transition-all"
            onClick={() => setLightbox(null)}
          >✕</button>

          {lightbox > 0 && (
            <button
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-lg transition-all"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
            >‹</button>
          )}
          {lightbox < result.images.length - 1 && (
            <button
              className="absolute right-16 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white text-lg transition-all"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
            >›</button>
          )}

          <div
            className="flex flex-col items-center gap-4 px-16"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={result.images[lightbox]}
              alt="Enlarged headshot"
              className="max-w-[85vw] max-h-[80vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.85)]"
            />
            <p className="text-[#6E6860] text-sm">{lightbox + 1} / {result.images.length} · Click outside to close</p>
          </div>
        </div>
      )}

      {/* ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#C9A96E]/[0.04] blur-[130px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-10 md:py-14">

        {/* ── Page header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-sm mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
            Your headshots are ready
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Looks like you, just more professional.
          </h1>
          <p className="text-[#6E6860] text-sm">
            Click any image to enlarge · Unlock HD to download without watermark
          </p>
        </div>

        {/* ── 1 large + 3 small grid ── */}
        <div className="mb-8 space-y-3">

          {/* Featured image */}
          <div
            onClick={() => setLightbox(0)}
            className="relative cursor-zoom-in rounded-2xl overflow-hidden ring-2 ring-[#C9A96E]/25 shadow-[0_0_40px_rgba(201,169,110,0.1)] group"
          >
            <img
              src={featured}
              alt="Featured headshot"
              className="w-full aspect-[4/3] object-cover object-top group-hover:scale-[1.01] transition-transform duration-400"
            />
            {/* watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="watermark-text">PROHEADSHOT.AI</p>
            </div>
            {/* Best Match badge */}
            <div className="absolute top-3 left-3 bg-[#C9A96E] text-[#15120A] text-xs font-bold px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              ✦ Best Match
            </div>
            {/* zoom hint */}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white/60 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              Click to enlarge
            </div>
          </div>

          {/* 3 supporting images */}
          <div className="grid grid-cols-3 gap-3">
            {rest.map((img, i) => (
              <div
                key={i}
                onClick={() => setLightbox(i + 1)}
                className="relative cursor-zoom-in rounded-xl overflow-hidden opacity-65 hover:opacity-95 transition-opacity ring-1 ring-white/[0.07] hover:ring-[#C9A96E]/30"
              >
                <img
                  src={img}
                  alt={`Headshot ${i + 2}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="watermark-text" style={{ fontSize: '9px' }}>PROHEADSHOT.AI</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust line */}
        <p className="text-center text-[#6E6860] text-sm mb-8">
          Same face, better lighting, better style. — Watermark removed after unlock.
        </p>

        {/* ── Unlock / Conversion block ── */}
        <div
          className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1D1A12 0%, #221D13 100%)',
            border: '1px solid rgba(201,169,110,0.28)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.45), 0 0 60px rgba(201,169,110,0.07)',
          }}
        >
          {/* subtle decorative glow inside card */}
          <div className="absolute top-0 right-1/4 w-64 h-32 rounded-full bg-[#C9A96E]/[0.06] blur-[60px] pointer-events-none" />

          <div className="relative text-center mb-7">
            <h2 className="text-2xl md:text-3xl font-bold text-[#ECD9A8] mb-2">
              Unlock Your HD Headshots
            </h2>
            <p className="text-[#6E6860] text-sm leading-relaxed max-w-md mx-auto">
              Get all 4 HD headshots with no watermark — ready for LinkedIn, resume, and business profiles.
            </p>
          </div>

          {/* Price block */}
          <div className="relative text-center mb-7">
            {/* Comparison */}
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-[#6E6860] text-xs mb-0.5">Studio photo</p>
                <p className="text-[#6E6860] text-sm line-through">$150+</p>
              </div>
              <div className="text-[#6E6860]/40 text-lg">vs</div>
              <div className="text-center">
                <p className="text-[#C9A96E] text-xs mb-0.5 font-semibold">ProHeadshot AI</p>
                <p className="text-[#ECD9A8] text-sm font-bold">$9.99</p>
              </div>
            </div>
            {/* Big price */}
            <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/18 rounded-xl px-6 py-4 inline-block">
              <p className="text-[#C9A96E]/70 text-xs font-semibold tracking-wide mb-1 uppercase">Today Only</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-[#6E6860] text-base font-medium">$</span>
                <span className="text-[#ECD9A8] font-black text-5xl leading-none">9</span>
                <span className="text-[#ECD9A8] font-black text-3xl leading-none">.99</span>
              </div>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-2 gap-2 mb-7 max-w-xs mx-auto">
            {[
              '4 HD headshots',
              'No watermark',
              'Instant download',
              '24-hour access',
              'One-time payment',
              'No subscription',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-[#B8B0A2]">
                <span className="text-[#C9A96E] text-xs font-bold flex-shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <button
            onClick={handleUnlock}
            className="btn-gold w-full py-[17px] rounded-xl text-lg font-bold mb-3 tracking-wide"
          >
            🔓 Unlock My Headshots — $9.99
          </button>

          <p className="text-[#6E6860] text-xs text-center mb-6">
            One-time payment · No subscription · Secure checkout via PayPal
          </p>

          {/* Secondary actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-[#6E6860] hover:text-[#C9A96E] text-sm transition-colors"
            >
              ↩ Try Another Style
            </button>
            <span className="text-[#3D3A35] hidden sm:block">·</span>
            <button
              onClick={() => router.push('/')}
              className="text-[#6E6860] hover:text-[#C9A96E] text-sm transition-colors"
            >
              📷 Upload Another Photo
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
