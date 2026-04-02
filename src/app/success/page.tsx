'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')

  // Could verify payment here via API
  useEffect(() => {
    if (!sessionId) {
      router.push('/')
    }
  }, [sessionId, router])

  const handleDownload = async () => {
    const res = await fetch(`/api/download?session_id=${sessionId}`)
    const data = await res.json()
    if (data.urls) {
      data.urls.forEach((url: string, i: number) => {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = url
          a.download = `proheadshot-${i + 1}.jpg`
          a.click()
        }, i * 500)
      })
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-3">Your headshots are ready!</h1>
        <p className="text-slate-400 mb-8">
          Download your HD professional headshots below. Links are valid for 24 hours.
        </p>

        <button
          onClick={handleDownload}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl transition-colors mb-4"
        >
          ⬇️ Download All HD Headshots
        </button>

        <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-400 mb-6">
          <p>💡 <strong className="text-white">Pro tip:</strong> Use a light neutral background version for LinkedIn, the white background for your resume, and the corporate version for your company bio.</p>
        </div>

        <p className="text-slate-500 text-xs mb-4">
          Download links expire in 24 hours. Having trouble?{' '}
          <a href="mailto:support@proheadshot.ai" className="text-blue-400 underline">
            Contact support
          </a>
        </p>

        <a href="/" className="text-slate-400 hover:text-white text-sm underline">
          Generate another headshot →
        </a>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
