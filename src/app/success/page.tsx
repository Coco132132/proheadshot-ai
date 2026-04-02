'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id')
  const jobId = searchParams.get('job_id')

  useEffect(() => {
    if (!orderId || !jobId) {
      router.push('/')
    }
  }, [orderId, jobId, router])

  const handleDownload = async () => {
    const res = await fetch(`/api/download?order_id=${orderId}&job_id=${jobId}`)
    const data = await res.json()

    if (data.urls && data.urls.length > 0) {
      data.urls.forEach((url: string, i: number) => {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = url
          a.download = `proheadshot-${i + 1}.jpg`
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }, i * 600)
      })
    } else {
      alert('Download failed. Please contact support@proheadshot.ai')
    }
  }

  return (
    <main className="min-h-screen bg-[#12110F] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
        <p className="text-slate-400 mb-8">
          Your HD professional headshots are ready to download.
          Links are valid for <strong className="text-white">24 hours</strong>.
        </p>

        <button
          onClick={handleDownload}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl transition-colors mb-4"
        >
          ⬇️ Download All HD Headshots
        </button>

        <div className="bg-slate-800 rounded-xl p-4 text-sm text-slate-400 mb-6 text-left">
          <p className="font-semibold text-white mb-2">💡 Quick usage guide:</p>
          <ul className="space-y-1">
            <li>• <strong className="text-slate-300">LinkedIn:</strong> Use the Professional style (light background)</li>
            <li>• <strong className="text-slate-300">Resume:</strong> Use the Clean style (white background)</li>
            <li>• <strong className="text-slate-300">Company bio:</strong> Use the Corporate style (dark background)</li>
          </ul>
        </div>

        <p className="text-slate-500 text-xs mb-6">
          Download links expire in 24 hours. Need help?{' '}
          <a href="mailto:support@proheadshot.ai" className="text-blue-400 underline">
            support@proheadshot.ai
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#12110F] flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
