'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadSection() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [gender, setGender] = useState<'male' | 'female'>('male')

  const validateAndAddFiles = useCallback((newFiles: File[]) => {
    const valid: File[] = []
    for (const f of newFiles) {
      if (!['image/jpeg', 'image/png'].includes(f.type)) {
        setError('Please upload JPG or PNG files only.')
        return
      }
      if (f.size > 10 * 1024 * 1024) {
        setError('Each photo must be under 10MB.')
        return
      }
      valid.push(f)
    }
    setError(null)
    setFiles(prev => {
      const combined = [...prev, ...valid].slice(0, 5)
      setPreviews(combined.map(f => URL.createObjectURL(f)))
      return combined
    })
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) validateAndAddFiles(selected)
  }, [validateAndAddFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length > 0) validateAndAddFiles(dropped)
  }, [validateAndAddFiles])

  const removeFile = (index: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== index)
      setPreviews(next.map(f => URL.createObjectURL(f)))
      return next
    })
  }

  const handleGenerate = async () => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      const formData = new FormData()
      files.forEach(f => formData.append('photos', f))
      formData.append('photo', files[0])
      formData.append('gender', gender)

      setProgress(30)
      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      setProgress(70)

      if (!res.ok) throw new Error('Generation failed. Please try again.')
      const data = await res.json() as { jobId: string }
      setProgress(100)

      router.push(`/result?jobId=${data.jobId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Gender Selector */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className="text-[#6E6860] text-sm">I am:</span>
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
              gender === g
                ? 'bg-[#C9A96E]/20 border-[#C9A96E]/60 text-[#C9A96E]'
                : 'bg-[#181610] border-white/10 text-[#6E6860] hover:border-[#C9A96E]/30 hover:text-[#B8B0A2]'
            }`}
          >
            {g === 'male' ? '👨 Male' : '👩 Female'}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-5"
      >
        <label
          htmlFor="photo-upload"
          className={`block rounded-2xl p-7 cursor-pointer transition-all duration-200 ${
            previews.length > 0
              ? 'border border-[#C9A96E]/40 bg-[#211E18]'
              : 'border-2 border-dashed border-[#C9A96E]/25 hover:border-[#C9A96E]/55 bg-[#181610] hover:bg-[#1D1A13]'
          }`}
        >
          {previews.length > 0 ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-[#C9A96E]/40 shadow-[0_0_20px_rgba(201,169,110,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeFile(i) }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white text-[10px] flex items-center justify-center hover:bg-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#C9A96E]/25 flex items-center justify-center text-[#C9A96E]/50 text-xl">
                    +
                  </div>
                )}
              </div>
              <p className="text-[#B8B0A2] text-sm font-medium">{files.length} photo{files.length > 1 ? 's' : ''} selected</p>
              <p className="text-[#C9A96E]/55 text-xs mt-1">Click to add more (up to 5)</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/25 flex items-center justify-center mx-auto mb-4 text-2xl shadow-[0_0_20px_rgba(201,169,110,0.08)]">
                📷
              </div>
              <p className="text-[#F4EFE6] font-semibold mb-1">Upload your photo(s)</p>
              <p className="text-[#6E6860] text-sm mb-3">Drop here or click to select</p>
              <div className="space-y-1">
                <p className="text-[#B8B0A2] text-xs">Upload 1 photo for quick results</p>
                <p className="text-[#C9A96E]/70 text-xs font-medium">Upload more for better likeness (recommended)</p>
              </div>
            </div>
          )}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-red-400/80 text-sm mt-2 text-center">{error}</p>}
      </div>

      {/* More photos hint */}
      {previews.length === 1 && (
        <div className="mb-4 bg-[#C9A96E]/[0.06] border border-[#C9A96E]/15 rounded-xl px-4 py-2.5 text-center">
          <p className="text-[#C9A96E]/80 text-xs">💡 More photos = better identity consistency</p>
        </div>
      )}

      {/* Style badges */}
      {files.length > 0 && (
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

      {/* Progress */}
      {loading && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-[#6E6860] mb-2">
            <span>Generating 9 headshots...</span>
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

      {/* CTA Button */}
      <button
        onClick={files.length > 0 ? handleGenerate : undefined}
        disabled={loading}
        className={`w-full py-[15px] rounded-xl font-bold text-base tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
          files.length > 0
            ? 'btn-gold text-[#15120A]'
            : 'bg-[#181610] text-[#6E6860] border border-white/[0.08] cursor-default'
        }`}
      >
        {loading
          ? 'Generating your headshots...'
          : files.length > 0
          ? `Generate my headshots →`
          : 'Upload Photo & Generate Headshot'}
      </button>

      <p className="text-[#6E6860] text-xs mt-3 text-center leading-relaxed">
        9 headshots generated · 3 styles × 3 variations · From $9.9
      </p>
    </div>
  )
}
