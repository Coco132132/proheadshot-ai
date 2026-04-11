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
  images: ImageGroups
  selection: { professional: number; clean: number; corporate: number }
  paid: boolean
  paidTier: 'basic' | 'full' | null
}

const STYLE_LABELS = [
  { key: 'professional' as const, icon: '💼', label: 'Professional' },
  { key: 'clean' as const,        icon: '📄', label: 'Clean' },
  { key: 'corporate' as const,    icon: '🏢', label: 'Corporate' },
]

function CopyLinkBanner({ jobId }: { jobId: string }) {
  const [copied, setCopied] = useState(false)
  const downloadLink = typeof window !== 'undefined'
    ? `${window.location.origin}/success?jobId=${jobId}`
    : `https://getproheadshot.com/success?jobId=${jobId}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(downloadLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = downloadLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 mb-8"
      style={{
        background: 'linear-gradient(135deg, #1D1A0E 0%, #221D10 100%)',
        border: '1px solid rgba(201,169,110,0.3)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0 text-base mt-0.5">
          🔗
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#ECD9A8] font-bold text-sm mb-0.5">Save your download link</p>
          <p className="text-[#6E6860] text-xs mb-3 leading-relaxed">
            Accidentally close this page? Come back with this link to re-download anytime within <span className="text-[#C9A96E]">7 days</span> — no login needed.
          </p>
          <div className="flex items-center gap-2 bg-[#15120A] border border-[#C9A96E]/15 rounded-xl px-3 py-2 mb-3">
            <p className="text-[#6E6860] text-[11px] truncate flex-1 font-mono">{downloadLink}</p>
          </div>
          <button
            onClick={copy}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'btn-gold text-[#15120A]'
            }`}
          >
            {copied ? '✓ Link copied!' : '📋 Copy download link'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('token') // PayPal return param
  const jobId = searchParams.get('jobId')
  const tier = searchParams.get('tier') || 'basic'

  const [status, setStatus] = useState<'capturing' | 'done' | 'error'>('capturing')
  const [job, setJob] = useState<JobData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState('')

  useEffect(() => {
    if (!jobId) { router.push('/'); return }

    const run = async () => {
      try {
        // ── Case 1: No PayPal token → check if already paid (returning user) ──
        if (!orderId) {
          const res = await fetch(`/api/result?jobId=${jobId}`)
          if (!res.ok) throw new Error('Failed to load job')
          const data = await res.json() as JobData
          if (data.paid) {
            setJob(data)
            setStatus('done')
          } else {
            router.push(`/result?jobId=${jobId}`)
          }
          return
        }

        // ── Case 2: Coming from PayPal → capture payment ──
        const captureRes = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, jobId, tier }),
        })
        const captureData = await captureRes.json() as { success?: boolean; error?: string }

        // If capture fails but job is already paid (double-tap / retry), load anyway
        if (!captureData.success) {
          const checkRes = await fetch(`/api/result?jobId=${jobId}`)
          const checkData = await checkRes.json() as JobData
          if (checkData.paid) {
            setJob(checkData)
            setStatus('done')
            return
          }
          setErrorMsg(captureData.error || 'Payment capture failed')
          setStatus('error')
          return
        }

        // Load job data
        const resultRes = await fetch(`/api/result?jobId=${jobId}`)
        const result = await resultRes.json() as JobData
        setJob(result)
        setStatus('done')
      } catch {
        setErrorMsg('Something went wrong. Please use your download link to try again.')
        setStatus('error')
      }
    }
    run()
  }, [orderId, jobId, tier, router])

  // Determine which images to show based on tier
  const getUnlockedImages = () => {
    if (!job) return []
    const effectiveTier = job.paidTier || tier
    if (effectiveTier === 'full' || effectiveTier === 'upgrade') {
      return STYLE_LABELS.flatMap(s =>
        job.images[s.key].map((img, idx) => ({
          url: img,
          label: `${s.icon} ${s.label}`,
          filename: `proheadshot-${s.key}-${idx + 1}.jpg`,
          isSelected: idx === job.selection[s.key],
        }))
      )
    }
    return STYLE_LABELS.map(s => ({
      url: job.images[s.key][job.selection[s.key]],
      label: `${s.icon} ${s.label}`,
      filename: `proheadshot-${s.key}.jpg`,
      isSelected: true,
    }))
  }

  // ── Single image download (blob, no new tab) ──
  const downloadOne = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // ── ZIP download — one dialog, all files ──
  const downloadZip = async (images: { url: string; filename: string }[]) => {
    setDownloading(true)
    setDownloadProgress('Preparing your photos...')
    try {
      // Dynamic import so JSZip isn't in the initial bundle
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder('proheadshot-ai') ?? zip

      for (let i = 0; i < images.length; i++) {
        setDownloadProgress(`Fetching photo ${i + 1} of ${images.length}...`)
        const res = await fetch(images[i].url)
        const blob = await res.blob()
        const arrayBuf = await blob.arrayBuffer()
        folder.file(images[i].filename, arrayBuf)
      }

      setDownloadProgress('Zipping files...')
      const content = await zip.generateAsync({ type: 'blob' })
      const blobUrl = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `proheadshot-ai-headshots.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
      setDownloadProgress('Done!')
    } catch (e) {
      console.error(e)
      setDownloadProgress('Download failed. Try individual buttons below.')
    } finally {
      setTimeout(() => { setDownloading(false); setDownloadProgress('') }, 2000)
    }
  }

  /* ── Capturing ── */
  if (status === 'capturing') {
    return (
      <main className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin mx-auto mb-6" />
          <p className="text-[#ECD9A8] text-xl font-bold mb-2">Confirming your payment...</p>
          <p className="text-[#6E6860] text-sm">Just a moment</p>
        </div>
      </main>
    )
  }

  /* ── Error ── */
  if (status === 'error') {
    return (
      <main className="min-h-screen bg-[#0F0E0C] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-[#B8B0A2] text-lg mb-2">Something went wrong</p>
          <p className="text-[#6E6860] text-sm mb-6">{errorMsg}</p>
          {jobId && (
            <button onClick={() => router.push(`/success?jobId=${jobId}`)} className="btn-gold px-8 py-3 rounded-xl font-bold mb-4 block w-full">
              Try loading my photos
            </button>
          )}
          <p className="text-[#6E6860] text-xs">
            Still stuck?{' '}
            <a href="mailto:support@getproheadshot.com" className="text-[#C9A96E] underline">
              support@getproheadshot.com
            </a>
          </p>
        </div>
      </main>
    )
  }

  const unlockedImages = getUnlockedImages()
  const effectiveTier = job?.paidTier || tier
  const isFullTier = effectiveTier === 'full' || effectiveTier === 'upgrade'

  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F4EFE6] px-4 py-12">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-[#C9A96E]/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full badge-gold text-sm mb-5">
            <span className="text-[#C9A96E]">✓</span>
            Payment confirmed
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            {isFullTier ? 'All 9 HD Headshots Ready! 🎉' : 'Your 3 HD Headshots Are Ready! 🎉'}
          </h1>
          <p className="text-[#6E6860] text-sm">
            {isFullTier
              ? 'Download as a single ZIP file or individually below.'
              : 'Download your best 3 photos as ZIP or individually.'}
          </p>
        </div>

        {/* ── Save link banner (PROMINENT, TOP) ── */}
        {jobId && <CopyLinkBanner jobId={jobId} />}

        {/* ── Download all as ZIP (primary CTA) ── */}
        <button
          onClick={() => downloadZip(unlockedImages)}
          disabled={downloading}
          className="btn-gold w-full py-4 rounded-xl font-bold text-base mb-2 disabled:opacity-60 disabled:cursor-wait transition-all"
        >
          {downloading
            ? `⏳ ${downloadProgress}`
            : `⬇ Download all ${unlockedImages.length} photos as ZIP`}
        </button>
        <p className="text-[#6E6860] text-xs text-center mb-7">One ZIP file · No repeated dialogs</p>

        {/* ── Image grid with individual download ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {unlockedImages.map((img, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="relative rounded-xl overflow-hidden ring-1 ring-[#C9A96E]/30">
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full aspect-square object-cover object-top"
                />
                {img.isSelected && isFullTier && (
                  <div className="absolute top-1.5 left-1.5 bg-[#C9A96E] text-[#15120A] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    ★ Best
                  </div>
                )}
              </div>
              <p className="text-[#ECD9A8] text-xs font-semibold text-center">{img.label}</p>
              <button
                onClick={() => downloadOne(img.url, img.filename)}
                className="border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                ⬇ Download
              </button>
            </div>
          ))}
        </div>

        {/* ── Upsell if basic ── */}
        {!isFullTier && jobId && (
          <div
            className="rounded-2xl p-5 text-center mb-8"
            style={{ background: '#1A1710', border: '1px solid rgba(201,169,110,0.2)' }}
          >
            <p className="text-[#ECD9A8] font-semibold mb-1">Want more options?</p>
            <p className="text-[#6E6860] text-sm mb-4">Unlock your remaining 6 photos for just $5</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ jobId, tier: 'upgrade' }),
                })
                const data = await res.json() as { url?: string }
                if (data.url) window.open(data.url, '_blank')
              }}
              className="btn-gold px-8 py-3 rounded-xl font-bold"
            >
              Unlock remaining 6 photos — $5
            </button>
          </div>
        )}

        {/* ── Usage tips ── */}
        <div className="rounded-2xl p-5 text-left mb-8 text-sm" style={{ background: '#1A1710', border: '1px solid rgba(201,169,110,0.15)' }}>
          <p className="text-[#C9A96E] font-semibold mb-3">💡 Best use for each style</p>
          <ul className="space-y-1.5 text-[#8A8070]">
            <li><span className="text-[#B8B0A2]">💼 Professional</span> — LinkedIn profile, professional networks</li>
            <li><span className="text-[#B8B0A2]">📄 Clean</span> — Resume, job applications</li>
            <li><span className="text-[#B8B0A2]">🏢 Corporate</span> — Company bio, press kit, email signature</li>
          </ul>
        </div>

        <div className="text-center">
          <a href="/" className="text-[#6E6860] hover:text-[#C9A96E] text-sm transition-colors">
            📷 Generate another headshot →
          </a>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0E0C] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/20 border-t-[#C9A96E] animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
