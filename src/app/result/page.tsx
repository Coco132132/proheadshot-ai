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
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!jobId) { router.push('/'); return }
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/result?jobId=${jobId}`)
        if (!res.ok) throw new Error('Failed to load results')
        const data = await res.json()
        setResult(data)
      } catch {
        setError('Failed to load your headshots. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#E8D5A3] text-xl font-semibold mb-2">Generating your headshots...</p>
          <p className="text-white/30 text-sm">This usually takes 20–60 seconds</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-xl mb-6">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/')} className="btn-gold px-8 py-3 rounded-xl">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-[#F5F0E8]">
      {/* Ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#C9A96E]/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Headshots Are Ready</h1>
          <p className="text-white/30 text-sm">Unlock HD to download without watermark</p>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {result.images.map((img, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 ${
                selected === i
                  ? 'ring-2 ring-[#C9A96E]/60 shadow-[0_0_25px_rgba(201,169,110,0.2)]'
                  : 'opacity-70 hover:opacity-90'
              }`}
            >
              <img src={img} alt={`Headshot ${i + 1}`} className="w-full aspect-square object-cover" />
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/20 text-sm font-semibold rotate-[-30deg] select-none pointer-events-none tracking-widest">
                  PROHEADSHOT.AI
                </p>
              </div>
              {/* Selected badge */}
              {selected === i && (
                <div className="absolute top-2 right-2 bg-[#C9A96E] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Conversion block */}
        <div className="card-glass rounded-2xl p-8 text-center">
          {/* Value prop */}
          <div className="flex items-center justify-center gap-4 mb-6 text-sm">
            <div className="text-center">
              <p className="text-white/25 line-through">Studio photo</p>
              <p className="text-white/40 font-bold text-xl">$150+</p>
            </div>
            <div className="text-white/20">vs</div>
            <div className="text-center">
              <p className="text-[#C9A96E]/60 text-xs uppercase tracking-widest">ProHeadshot AI</p>
              <p className="text-[#E8D5A3] font-bold text-3xl">$9.99</p>
            </div>
          </div>

          <button
            onClick={handleUnlock}
            className="btn-gold w-full py-4 rounded-xl text-lg mb-5"
          >
            🔓 Unlock HD Headshots — $9.99
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/40">
            {['✓ HD resolution (1024px+)', '✓ No watermark', '✓ Instant download', '✓ All 4 images'].map((item, i) => (
              <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">{item}</div>
            ))}
          </div>

          <p className="text-white/20 text-xs mt-4">
            One-time payment · No subscription · Secure checkout via PayPal
          </p>
        </div>

        <div className="text-center mt-6">
          <button onClick={() => router.push('/')} className="text-white/25 hover:text-[#C9A96E] text-sm transition-colors">
            ← Try a different photo
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
