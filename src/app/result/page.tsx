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
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!jobId) { router.push('/'); return }

    let attempts = 0
    const maxAttempts = 30 // 30 × 3s = 90s timeout

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

        // Still pending — keep polling
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

  if (loading) {
    const seconds = pollCount * 3
    return (
      <div className="min-h-screen bg-[#12110F] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#E8D5A3] text-xl font-semibold mb-2">Generating your headshots...</p>
          <p className="text-white/30 text-sm mb-5">
            {seconds < 10 ? 'Starting up AI model...' :
             seconds < 30 ? 'Processing your photo...' :
             seconds < 60 ? 'Almost there...' : 'This is taking a bit longer than usual...'}
          </p>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  pollCount % 5 === i ? 'bg-[#C9A96E]' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
          <p className="text-white/15 text-xs mt-4">{seconds}s elapsed</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#12110F] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-white/60 text-lg mb-6">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/')} className="btn-gold px-8 py-3 rounded-xl">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#12110F] text-[#F0EBE1]">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[#C9A96E]/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Headshots Are Ready ✨</h1>
          <p className="text-white/30 text-sm">Select your favourite · Unlock HD to download</p>
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
                  : 'opacity-60 hover:opacity-85'
              }`}
            >
              <img src={img} alt={`Headshot ${i + 1}`} className="w-full aspect-square object-cover" />
              {/* Watermark overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/20 text-sm font-semibold rotate-[-30deg] select-none tracking-widest">
                  PROHEADSHOT.AI
                </p>
              </div>
              {selected === i && (
                <div className="absolute top-2 right-2 bg-[#C9A96E] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Conversion block */}
        <div className="bg-[#1A1916] border border-white/[0.07] rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-white/20 text-xs mb-1">Studio photo</p>
              <p className="text-white/30 font-bold text-xl line-through">$150+</p>
            </div>
            <div className="text-white/15 text-sm">vs</div>
            <div className="text-center">
              <p className="text-[#C9A96E]/60 text-xs uppercase tracking-widest mb-1">ProHeadshot AI</p>
              <p className="text-[#E8D5A3] font-bold text-3xl">$9.99</p>
            </div>
          </div>

          <button onClick={handleUnlock} className="btn-gold w-full py-4 rounded-xl text-lg mb-5">
            🔓 Unlock HD Headshots — $9.99
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/35">
            {['✓ HD 1024px+', '✓ No watermark', '✓ Instant download', '✓ All 4 images'].map((item, i) => (
              <div key={i} className="bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">{item}</div>
            ))}
          </div>

          <p className="text-white/18 text-xs mt-4">
            One-time · No subscription · Secure checkout via PayPal
          </p>
        </div>

        <div className="text-center mt-6">
          <button onClick={() => router.push('/')} className="text-white/22 hover:text-[#C9A96E] text-sm transition-colors">
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
      <div className="min-h-screen bg-[#12110F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
