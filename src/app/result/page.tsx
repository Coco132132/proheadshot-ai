'use client'

export const runtime = 'edge'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface ImageGroups {
  professional: string[]
  clean: string[]
  corporate: string[]
}

interface JobData {
  status: string
  images: ImageGroups
  selection: { professional: number; clean: number; corporate: number }
  paid: boolean
  paidTier: 'basic' | 'full' | null
  createdAt: number
  error?: string
}

const STYLES = [
  { key: 'professional' as const, label: 'Professional', desc: 'LinkedIn', icon: '💼' },
  { key: 'clean' as const,        label: 'Clean',        desc: 'Resume',   icon: '📄' },
  { key: 'corporate' as const,    label: 'Corporate',    desc: 'Company',  icon: '🏢' },
]

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('jobId')
  const isDemo = searchParams.get('demo') === '1'

  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<{ professional: number; clean: number; corporate: number }>({ professional: 0, clean: 0, corporate: 0 })
  const [lightbox, setLightbox] = useState<{ style: keyof ImageGroups; idx: number } | null>(null)
  const [paying, setPaying] = useState(false)

  // Demo data
  const DEMO_JOB: JobData = {
    status: 'complete',
    images: {
      professional: [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=faces',
      ],
      clean: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop&crop=faces',
      ],
      corporate: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=600&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop&crop=faces',
      ],
    },
    selection: { professional: 0, clean: 0, corporate: 0 },
    paid: false,
    paidTier: null,
    createdAt: Date.now(),
  }

  useEffect(() => {
    if (isDemo) {
      setJob(DEMO_JOB)
      setSelection(DEMO_JOB.selection)
      setLoading(false)
      return
    }

    if (!jobId) { router.push('/'); return }

    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch(`/api/result?jobId=${jobId}`)
        if (!res.ok) throw new Error('Failed to load results')
        const data = await res.json() as JobData

        if (data.status === 'complete' && data.images) {
          setJob(data)
          setSelection(data.selection || { professional: 0, clean: 0, corporate: 0 })
          setLoading(false)
          return
        }
        if (data.error) { setError(data.error); setLoading(false); return }

        attempts++
        setPollCount(attempts)
        if (attempts >= 30) { setError('Generation timed out. Please try again.'); setLoading(false); return }
        setTimeout(poll, 3000)
      } catch {
        setError('Failed to load your headshots. Please try again.')
        setLoading(false)
      }
    }
    poll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, isDemo])

  const handlePay = async (tier: 'basic' | 'full') => {
    if (!jobId) return
    setPaying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, tier }),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setPaying(false)
    }
  }

  const handleUpgrade = async () => {
    if (!jobId) return
    setPaying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, tier: 'upgrade' }),
      })
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setPaying(false)
    }
  }

  const isUnlocked = (styleKey: keyof ImageGroups) => {
    if (!job?.paid) return false
    if (job.paidTier === 'full') return true
    return false // basic: only selected images, handled separately
  }

  const isSelectedUnlocked = () => job?.paid === true

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#ECD9A8] text-xl font-bold mb-2">Generating your headshots...</p>
          <p className="text-[#6E6860] text-sm mb-5">Creating 9 photos across 3 styles</p>
          <div className="flex justify-center gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${pollCount % 5 === i ? 'bg-[#C9A96E]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-[#B8B0A2] text-lg mb-6">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/')} className="btn-gold px-8 py-3.5 rounded-xl font-bold">Try Again</button>
        </div>
      </div>
    )
  }

  const paidTier = job.paidTier
  const isPaidFull = paidTier === 'full'
  const isPaidBasic = paidTier === 'basic'

  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F4EFE6]">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 text-xl" onClick={() => setLightbox(null)}>✕</button>
          <div className="flex flex-col items-center gap-4 px-8" onClick={e => e.stopPropagation()}>
            <div className="relative" style={{ width: 'min(72vw, 340px)', aspectRatio: '1/1' }}>
              <img
                src={job.images[lightbox.style][lightbox.idx]}
                alt="Headshot"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
              {!isPaidFull && !(isPaidBasic && lightbox.idx === selection[lightbox.style]) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="watermark-text">PROHEADSHOT.AI</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#C9A96E]/[0.04] blur-[130px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-sm mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
            Your headshots are ready
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Looks like you, just more professional.</h1>
          <p className="text-[#6E6860] text-sm">
            {isPaidFull
              ? 'All 9 photos unlocked — click any to download'
              : isPaidBasic
              ? '3 photos unlocked · Upgrade to get all 9'
              : '9 headshots generated · We selected the best one per style'}
          </p>
        </div>

        {/* Recommendation notice */}
        {!job.paid && (
          <div className="bg-[#C9A96E]/[0.06] border border-[#C9A96E]/20 rounded-2xl px-5 py-3 mb-8 text-center">
            <p className="text-[#ECD9A8] text-sm font-semibold mb-0.5">Your best results (selected for you)</p>
            <p className="text-[#6E6860] text-xs">Not what you like? Click any photo in the group to switch your selection.</p>
          </div>
        )}

        {/* 3 Style Groups */}
        <div className="space-y-10 mb-10">
          {STYLES.map((style) => {
            const styleImages = job.images[style.key]
            const selectedIdx = selection[style.key]
            const groupUnlocked = isPaidFull
            const selectedUnlocked = job.paid // basic pays for selected ones

            return (
              <div key={style.key}>
                {/* Style header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{style.icon}</span>
                  <div>
                    <p className="font-bold text-[#ECD9A8] text-base">{style.label}</p>
                    <p className="text-[#6E6860] text-xs">{style.desc} · 3 variations</p>
                  </div>
                </div>

                {/* 3 photos in a row */}
                <div className="grid grid-cols-3 gap-3">
                  {styleImages.map((img, idx) => {
                    const isSelected = idx === selectedIdx
                    const unlocked = groupUnlocked || (selectedUnlocked && isSelected)

                    return (
                      <div
                        key={idx}
                        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-[#C9A96E] shadow-[0_0_20px_rgba(201,169,110,0.3)]'
                            : 'ring-1 ring-white/[0.07] opacity-60 hover:opacity-80'
                        }`}
                        onClick={() => {
                          if (!job.paid) {
                            setSelection(prev => ({ ...prev, [style.key]: idx }))
                          } else {
                            setLightbox({ style: style.key, idx })
                          }
                        }}
                      >
                        <img
                          src={img}
                          alt={`${style.label} variation ${idx + 1}`}
                          className="w-full aspect-square object-cover object-top"
                        />
                        {/* Watermark for locked photos */}
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="watermark-text" style={{ fontSize: '7px' }}>PROHEADSHOT.AI</p>
                          </div>
                        )}
                        {/* Selected badge */}
                        {isSelected && !job.paid && (
                          <div className="absolute top-1.5 left-1.5 bg-[#C9A96E] text-[#15120A] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            ★ Selected
                          </div>
                        )}
                        {/* Unlocked badge */}
                        {unlocked && (
                          <div className="absolute top-1.5 right-1.5 bg-green-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            HD ✓
                          </div>
                        )}
                        {/* Variation number */}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white/60 text-[9px] px-1.5 py-0.5 rounded-full">
                          {idx + 1}/3
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Switch hint */}
                {!job.paid && (
                  <p className="text-[#6E6860] text-[11px] mt-2 text-center">
                    Tap any photo to switch your selection
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Pricing / CTA block ── */}
        {!isPaidFull && (
          <div
            className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #1D1A12 0%, #221D13 100%)',
              border: '1px solid rgba(201,169,110,0.28)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.45)',
            }}
          >
            <div className="absolute top-0 right-1/4 w-64 h-32 rounded-full bg-[#C9A96E]/[0.06] blur-[60px] pointer-events-none" />

            {isPaidBasic ? (
              /* ── Upsell block (already paid basic) ── */
              <div className="relative text-center">
                <h2 className="text-2xl font-bold text-[#ECD9A8] mb-2">Want more options?</h2>
                <p className="text-[#6E6860] text-sm mb-6">Unlock your remaining 6 photos with one click.</p>

                <div className="bg-[#C9A96E]/8 border border-[#C9A96E]/18 rounded-xl px-6 py-4 inline-block mb-6">
                  <p className="text-[#C9A96E]/70 text-xs font-semibold tracking-wide mb-1 uppercase">Upgrade</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-[#6E6860] text-base font-medium">$</span>
                    <span className="text-[#ECD9A8] font-black text-5xl leading-none">5</span>
                  </div>
                  <p className="text-[#6E6860] text-xs mt-1">for all 9 photos</p>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={paying}
                  className="btn-gold w-full py-[17px] rounded-xl text-lg font-bold mb-3 tracking-wide disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Unlock remaining 6 photos — $5'}
                </button>
                <p className="text-[#6E6860] text-xs">Get all your photos with one click · Secure checkout via PayPal</p>
              </div>
            ) : (
              /* ── Main pricing (not paid yet) ── */
              <div className="relative">
                <div className="text-center mb-7">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#ECD9A8] mb-2">Unlock Your HD Headshots</h2>
                  <p className="text-[#6E6860] text-sm max-w-md mx-auto">
                    Download in full HD, no watermark — ready for LinkedIn, resume, and business profiles.
                  </p>
                </div>

                {/* Two options side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">

                  {/* Option 1: Basic $9.9 */}
                  <div className="rounded-xl p-5 text-center" style={{ background: '#1A1710', border: '1px solid rgba(201,169,110,0.15)' }}>
                    <p className="text-[#B8B0A2] text-sm font-semibold mb-1">Best 3 Photos</p>
                    <p className="text-[#6E6860] text-xs mb-4">Your selected photo per style</p>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-[#6E6860] text-base">$</span>
                      <span className="text-[#ECD9A8] font-black text-4xl leading-none">9</span>
                      <span className="text-[#ECD9A8] font-black text-2xl leading-none">.9</span>
                    </div>
                    <ul className="space-y-1.5 text-left mb-5 max-w-[160px] mx-auto">
                      {['3 HD headshots', 'No watermark', 'Instant download', 'One-time payment'].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-[#B8B0A2]">
                          <span className="text-[#C9A96E] font-bold flex-shrink-0">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePay('basic')}
                      disabled={paying}
                      className="w-full py-3 rounded-xl font-bold text-sm border border-[#C9A96E]/40 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors disabled:opacity-50"
                    >
                      {paying ? 'Processing...' : 'Download best 3 — $9.9'}
                    </button>
                  </div>

                  {/* Option 2: Full $14.9 */}
                  <div className="rounded-xl p-5 text-center relative" style={{ background: 'linear-gradient(160deg, #221D10 0%, #1D1A0E 100%)', border: '1px solid rgba(201,169,110,0.35)' }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A96E] text-[#15120A] text-[10px] font-black px-3 py-1 rounded-full tracking-wide">
                      MOST POPULAR
                    </div>
                    <p className="text-[#ECD9A8] text-sm font-semibold mb-1 mt-2">All 9 Photos</p>
                    <p className="text-[#6E6860] text-xs mb-4">Every variation, every style</p>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-[#6E6860] text-base">$</span>
                      <span className="text-[#ECD9A8] font-black text-4xl leading-none">14</span>
                      <span className="text-[#ECD9A8] font-black text-2xl leading-none">.9</span>
                    </div>
                    <ul className="space-y-1.5 text-left mb-5 max-w-[160px] mx-auto">
                      {['9 HD headshots', 'No watermark', 'All variations', 'More options to pick from', 'One-time payment'].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-[#B8B0A2]">
                          <span className="text-[#C9A96E] font-bold flex-shrink-0">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePay('full')}
                      disabled={paying}
                      className="btn-gold w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      {paying ? 'Processing...' : 'Unlock all 9 — $14.9'}
                    </button>
                    <p className="text-[#C9A96E]/60 text-[10px] mt-2">Most users choose this for more options</p>
                  </div>
                </div>

                <p className="text-[#6E6860] text-xs text-center">
                  One-time payment · No subscription · Secure checkout via PayPal
                </p>

                <div className="flex justify-center mt-5">
                  <button onClick={() => router.push('/')} className="text-[#6E6860] hover:text-[#C9A96E] text-sm transition-colors">
                    📷 Upload Another Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All paid full — link save reminder */}
        {isPaidFull && (
          <div className="mt-6 bg-[#1A1710] border border-[#C9A96E]/15 rounded-2xl px-5 py-4 text-center">
            <p className="text-[#C9A96E] text-xs font-semibold mb-1">📌 Save this link to access your photos anytime</p>
            <p className="text-[#6E6860] text-[11px] break-all">{typeof window !== 'undefined' ? window.location.href : ''}</p>
          </div>
        )}

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
