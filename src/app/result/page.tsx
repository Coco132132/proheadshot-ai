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
    if (!jobId) {
      router.push('/')
      return
    }

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
    if (data.url) {
      window.location.href = data.url
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl font-semibold mb-2">Generating your headshots...</p>
          <p className="text-slate-400">This usually takes 20–60 seconds</p>
          <div className="mt-6 w-48 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.push('/')} className="bg-blue-600 px-6 py-3 rounded-xl">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-2">Your AI Headshots Are Ready!</h1>
        <p className="text-slate-400 text-center mb-8">Preview below · Unlock HD to download without watermark</p>

        {/* Image grid (watermarked) */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {result.images.map((img, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                selected === i ? 'border-blue-400' : 'border-transparent'
              }`}
            >
              <img src={img} alt={`Headshot ${i + 1}`} className="w-full aspect-square object-cover" />
              {/* Watermark overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/30 text-lg font-bold rotate-[-30deg] select-none pointer-events-none">
                  ProHeadshot AI
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Conversion block */}
        <div className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <span className="text-slate-400 line-through">Studio photo: $150+</span>
            <span className="text-green-400 font-bold text-lg">ProHeadshot AI: $9.99</span>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xl rounded-xl transition-colors mb-4"
          >
            🔓 Unlock HD Headshots — $9.99
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-300">
            {[
              '✓ HD resolution (1024px+)',
              '✓ No watermark',
              '✓ Instant download',
              '✓ All 4 images included',
            ].map((item, i) => (
              <div key={i} className="bg-slate-700 rounded-lg p-2 text-center">{item}</div>
            ))}
          </div>

          <p className="text-slate-500 text-xs mt-4">
            One-time payment · No subscription · Secure checkout via Stripe
          </p>
        </div>

        <div className="text-center mt-6">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white text-sm underline">
            ← Try a different photo
          </button>
        </div>
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <ResultContent />
    </Suspense>
  )
}
