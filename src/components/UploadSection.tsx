'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadSection() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Please upload a JPG or PNG file.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Please upload a photo under 10MB.')
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    const fakeEvent = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileChange(fakeEvent)
  }, [handleFileChange])

  const handleGenerate = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      setProgress(30)
      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      setProgress(70)

      if (!res.ok) throw new Error('Generation failed. Please try again.')
      const data = await res.json()
      setProgress(100)

      sessionStorage.setItem('jobId', data.jobId)
      router.push(`/result?jobId=${data.jobId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* ── Drop Zone ── */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-5"
      >
        <label
          htmlFor="photo-upload"
          className={`block rounded-2xl p-7 cursor-pointer transition-all duration-200 ${
            preview
              ? 'border border-[#C9A96E]/40 bg-[#211E18]'
              : 'border-2 border-dashed border-[#C9A96E]/25 hover:border-[#C9A96E]/55 bg-[#181610] hover:bg-[#1D1A13]'
          }`}
        >
          {preview ? (
            <div className="text-center">
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 ring-2 ring-[#C9A96E]/40 shadow-[0_0_20px_rgba(201,169,110,0.15)]"
              />
              <p className="text-[#B8B0A2] text-sm font-medium">{file?.name}</p>
              <p className="text-[#C9A96E]/55 text-xs mt-1">Click to change photo</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/25 flex items-center justify-center mx-auto mb-4 text-2xl shadow-[0_0_20px_rgba(201,169,110,0.08)]">
                📷
              </div>
              <p className="text-[#F4EFE6] font-semibold mb-1">Drop your photo here, or click to upload</p>
              <p className="text-[#6E6860] text-sm">JPG or PNG · Max 10MB · Face clearly visible</p>
            </div>
          )}
        </label>
        <input id="photo-upload" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
        {error && <p className="text-red-400/80 text-sm mt-2 text-center">{error}</p>}
      </div>

      {/* ── What you'll get ── */}
      {file && (
        <div className="mb-5 flex items-center justify-center gap-4">
          {[
            { icon: '💼', label: 'Professional' },
            { icon: '📄', label: 'Clean' },
            { icon: '🏢', label: 'Corporate' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-[#6E6860] text-xs">
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Progress ── */}
      {loading && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-[#6E6860] mb-2">
            <span>Generating 3 styles...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-[#181610] rounded-full h-1.5 overflow-hidden">
            <div
              className="progress-gold h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── CTA Button ── */}
      <button
        onClick={file ? handleGenerate : undefined}
        disabled={loading}
        className={`w-full py-[15px] rounded-xl font-bold text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          file
            ? 'btn-gold text-[#15120A]'
            : 'bg-[#181610] text-[#6E6860] border border-white/[0.08] cursor-default'
        }`}
      >
        {loading
          ? 'Generating your headshots...'
          : file
          ? 'Generate All 3 Styles →'
          : 'Upload Photo & Generate Headshot'}
      </button>

      <p className="text-[#6E6860] text-xs mt-3 text-center leading-relaxed">
        3 styles generated automatically · Free preview · $9.99 to unlock HD
      </p>
    </div>
  )
}
