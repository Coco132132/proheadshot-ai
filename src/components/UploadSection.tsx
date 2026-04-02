'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STYLES = [
  { id: 'professional', label: 'Professional', desc: 'LinkedIn · Light background', icon: '💼' },
  { id: 'clean', label: 'Clean', desc: 'Resume · White background', icon: '📄' },
  { id: 'corporate', label: 'Corporate', desc: 'Company bio · Dark tone', icon: '🏢' },
]

export default function UploadSection() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('professional')
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
      formData.append('style', selectedStyle)

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
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-5"
      >
        <label
          htmlFor="photo-upload"
          className="block border border-dashed border-[#C9A96E]/25 hover:border-[#C9A96E]/50 bg-[#1A1916]/80 hover:bg-[#221F1B] rounded-2xl p-8 cursor-pointer transition-all duration-200"
        >
          {preview ? (
            <div className="text-center">
              <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto mb-3 ring-2 ring-[#C9A96E]/30" />
              <p className="text-white/50 text-sm">{file?.name}</p>
              <p className="text-[#C9A96E]/60 text-xs mt-1">Click to change photo</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mx-auto mb-4 text-2xl">
                📷
              </div>
              <p className="text-white/80 font-medium mb-1">Drop your photo here, or click to upload</p>
              <p className="text-white/30 text-sm">JPG or PNG · Max 10MB · Face clearly visible</p>
            </div>
          )}
        </label>
        <input id="photo-upload" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
        {error && <p className="text-red-400/80 text-sm mt-2 text-center">{error}</p>}
      </div>

      {/* Style selector */}
      {file && (
        <div className="mb-5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3 text-left">Choose style</p>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  selectedStyle === s.id
                    ? 'border-[#C9A96E]/60 bg-[#C9A96E]/10 shadow-[0_0_15px_rgba(201,169,110,0.15)]'
                    : 'border-white/10 hover:border-white/20 bg-[#1A1916]/80'
                }`}
              >
                <div className="text-xl mb-1">{s.icon}</div>
                <p className={`text-sm font-medium ${selectedStyle === s.id ? 'text-[#E8D5A3]' : 'text-white/70'}`}>{s.label}</p>
                <p className="text-xs text-white/30">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/30 mb-2">
            <span>Generating your headshots...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-[#1A1916] rounded-full h-1.5">
            <div
              className="progress-gold h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={file ? handleGenerate : undefined}
        disabled={loading}
        className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          file
            ? 'btn-gold'
            : 'bg-[#1A1916] text-white/30 border border-white/10 cursor-default'
        }`}
      >
        {loading ? 'Generating your headshots...' : file ? 'Generate My Headshots →' : 'Upload a photo to get started'}
      </button>

      <p className="text-white/20 text-xs mt-3 text-center">
        Free preview · $9.99 to unlock HD · No subscription · No account needed
      </p>
    </div>
  )
}
