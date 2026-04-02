'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STYLES = [
  {
    id: 'professional',
    label: 'Professional',
    desc: 'Light neutral background. Best for LinkedIn.',
    icon: '💼',
  },
  {
    id: 'clean',
    label: 'Clean',
    desc: 'White background, formal look. Best for resumes.',
    icon: '📄',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    desc: 'Dark/gradient background. Best for company bios.',
    icon: '🏢',
  },
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

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      setProgress(70)

      if (!res.ok) {
        throw new Error('Generation failed. Please try again.')
      }

      const data = await res.json()
      setProgress(100)

      // Store job ID and redirect to result page
      sessionStorage.setItem('jobId', data.jobId)
      router.push(`/result?jobId=${data.jobId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* File upload area */}
      <div className="mb-6">
        <label
          htmlFor="photo-upload"
          className="block border-2 border-dashed border-slate-500 hover:border-blue-400 rounded-xl p-8 cursor-pointer transition-colors"
        >
          {preview ? (
            <div className="text-center">
              <img src={preview} alt="Preview" className="w-32 h-32 rounded-full object-cover mx-auto mb-3" />
              <p className="text-slate-300 text-sm">{file?.name} · Click to change</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-white font-semibold mb-1">Upload your photo</p>
              <p className="text-slate-400 text-sm">JPG or PNG · Max 10MB · Your face clearly visible</p>
            </div>
          )}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Style selection */}
      {file && (
        <div className="mb-6">
          <p className="text-white font-semibold mb-3 text-left">Choose your style</p>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedStyle === s.id
                    ? 'border-blue-400 bg-blue-900/30'
                    : 'border-slate-600 hover:border-slate-400'
                }`}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-white text-sm font-semibold">{s.label}</p>
                <p className="text-slate-400 text-xs">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Generating your headshots...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!file || loading}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white"
      >
        {loading ? 'Generating...' : file ? 'Generate My Headshots →' : 'Upload a Photo to Start'}
      </button>

      <p className="text-slate-500 text-xs mt-3 text-center">
        Free preview · $9.99 to unlock HD download · No subscription
      </p>
    </div>
  )
}
