import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY
const FAL_MODEL = 'fal-ai/instantid'
const FAL_SUBMIT_URL = `https://queue.fal.run/${FAL_MODEL}`

// ── Style prompts (Kontext instruction-style: edit the photo, preserve the face) ──
const STYLES_MALE = {
  professional: {
    label: 'Professional',
    prompt: 'A realistic premium business headshot of the same man from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. He is wearing a tailored charcoal gray or navy blazer over a crisp light dress shirt with no tie. Professional studio/business portrait, modern office background with soft blurred glass and subtle warm bokeh, soft flattering studio lighting, natural skin texture, matte natural hair texture, clean grooming, realistic fabric detail, approachable confident expression, half body crop from waist up, sharp eyes, premium LinkedIn headshot, photorealistic.',
  },
  clean: {
    label: 'Clean',
    prompt: 'A realistic formal resume headshot of the same man from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. He is wearing a refined charcoal gray or navy formal suit, crisp dress shirt, and tasteful tie. Pure white seamless studio background, soft even studio lighting, clean symmetrical composition, natural skin texture, matte tidy hair, realistic professional portrait, head and upper chest crop, photorealistic resume photo.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'A realistic executive corporate portrait of the same man from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. He is wearing a premium dark charcoal or deep navy executive suit, crisp shirt, elegant tie. Upscale corporate lobby or executive office background with soft cinematic blur, polished but natural studio lighting, realistic skin texture, matte natural hair, confident relaxed expression, premium executive headshot, half body crop, photorealistic.',
  },
}

const STYLES_FEMALE = {
  professional: {
    label: 'Professional',
    prompt: 'A realistic premium business headshot of the same woman from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. She is wearing an elegant refined blouse or polished professional top in soft neutral tones. Professional studio/business portrait, modern office background with soft blurred glass and subtle warm bokeh, flattering studio lighting, natural skin texture, matte natural hair, subtle polished makeup, approachable confident expression, half body crop from waist up, premium LinkedIn headshot, photorealistic.',
  },
  clean: {
    label: 'Clean',
    prompt: 'A realistic formal resume headshot of the same woman from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. She is wearing an elegant refined blouse or polished studio-ready professional top in neutral tones. Pure white seamless studio background, soft even studio lighting, natural skin texture, matte tidy hair, subtle polished makeup, clean symmetrical composition, head and upper chest crop, photorealistic professional resume photo.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'A realistic executive corporate portrait of the same woman from the reference face photo. Keep the same identity, same face structure, same age impression, and same skin tone. She is wearing an elegant business outfit or refined blouse in polished professional tones. Upscale corporate lobby or executive office background with soft cinematic blur, polished but natural lighting, realistic skin texture, matte natural hair, subtle refined makeup, confident relaxed expression, premium executive headshot, half body crop, photorealistic.',
  },
}

const STYLES = STYLES_MALE
const SEEDS = [42, 1337, 7777]
const MAX_INPUT_PHOTOS = 5

interface DebugSubmitLog {
  style: keyof typeof STYLES
  seed: number
  photoIndex: number
  endpoint: string
  apiType: 'identity-to-image'
  model: string
  prompt: string
  imageUrl: string
  guidanceScale: number
  numInferenceSteps: number
  identityStrength: number
  ipAdapterScale: number
  requestId?: string
  error?: string
}

function ensureFalKey() {
  if (!FAL_KEY) {
    throw new Error('FAL_KEY is not configured')
  }
  return FAL_KEY
}

async function uploadToFal(fileBuffer: ArrayBuffer, contentType: string, fileName: string): Promise<string> {
  const falKey = ensureFalKey()
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: fileName, content_type: contentType }),
  })

  if (!initRes.ok) {
    const err = await initRes.text()
    throw new Error(`fal storage initiate failed: ${err}`)
  }

  const { upload_url, file_url } = await initRes.json() as { upload_url: string; file_url: string }

  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fileBuffer,
  })

  if (!uploadRes.ok) throw new Error(`fal storage upload failed: ${uploadRes.status}`)

  return file_url
}

async function submitJob(faceImageUrl: string, style: keyof typeof STYLES, seed: number, photoIndex: number, gender: 'male' | 'female' | 'auto' = 'auto'): Promise<{ requestId: string; debug: DebugSubmitLog }> {
  const falKey = ensureFalKey()
  const styleMap = gender === 'female' ? STYLES_FEMALE : STYLES_MALE
  const prompt = styleMap[style].prompt
  const guidanceScale = 1.8
  const numInferenceSteps = 8
  const identityStrength = 0.95
  const ipAdapterScale = 0.9
  const payload = {
    face_image_url: faceImageUrl,
    prompt,
    style: 'Headshot',
    negative_prompt: 'lowres, blurry, bad anatomy, deformed face, different person, different identity, cartoon, illustration, painting, extra fingers, duplicate face, ugly, distorted features, oversmoothed skin, oily hair, wet hair, harsh sharpening, casual clothing, selfie, phone photo, low quality',
    num_inference_steps: numInferenceSteps,
    guidance_scale: guidanceScale,
    controlnet_selection: 'pose',
    controlnet_conditioning_scale: 0.5,
    ip_adapter_scale: ipAdapterScale,
    identity_controlnet_conditioning_scale: identityStrength,
    enhance_face_region: true,
    seed,
    enable_lcm: true,
  }

  const debugBase: DebugSubmitLog = {
    style,
    seed,
    photoIndex,
    endpoint: FAL_SUBMIT_URL,
    apiType: 'identity-to-image',
    model: FAL_MODEL,
    prompt,
    imageUrl: faceImageUrl,
    guidanceScale,
    numInferenceSteps,
    identityStrength,
    ipAdapterScale,
  }

  console.log('[generate] submitting instantid request', JSON.stringify(debugBase))

  const res = await fetch(FAL_SUBMIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[generate] fal queue submit failed', JSON.stringify({ ...debugBase, error: err }))
    throw new Error(`fal queue submit failed: ${err}`)
  }

  const data = await res.json() as { request_id: string }
  const debug = { ...debugBase, requestId: data.request_id }
  console.log('[generate] fal request accepted', JSON.stringify(debug))
  return { requestId: data.request_id, debug }
}

export async function POST(request: NextRequest) {
  try {
    ensureFalKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS
    if (!kv) return NextResponse.json({ error: 'Storage not available' }, { status: 500 })

    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]
    const photo = formData.get('photo') as File | null
    const allPhotos = (photos.length > 0 ? photos : (photo ? [photo] : [])).slice(0, MAX_INPUT_PHOTOS)
    const genderParam = (formData.get('gender') as string | null) ?? 'auto'
    const gender = (genderParam === 'female' || genderParam === 'male') ? genderParam : 'auto'

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 })
    }

    for (const file of allPhotos) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Use JPG or PNG.' }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Each photo must be under 10MB.' }, { status: 400 })
      }
    }

    const jobId = crypto.randomUUID()

    const uploadedPhotos = await Promise.all(
      allPhotos.map(async (inputPhoto, photoIndex) => {
        const buf = await inputPhoto.arrayBuffer()
        const ext = inputPhoto.type.includes('png') ? 'png' : 'jpg'
        const faceImageUrl = await uploadToFal(buf, inputPhoto.type, `face-${jobId}-${photoIndex}.${ext}`)
        return { photoIndex, faceImageUrl, fileName: inputPhoto.name || `photo-${photoIndex + 1}` }
      })
    )

    console.log('[generate] uploaded source images', JSON.stringify({
      jobId,
      uploadedCount: uploadedPhotos.length,
      fileCount: allPhotos.length,
      gender,
      model: FAL_MODEL,
      apiType: 'identity-to-image',
      strategy: 'multi-photo-best-of',
      uploadedFaceImageUrls: uploadedPhotos.map(({ photoIndex, faceImageUrl, fileName }) => ({ photoIndex, faceImageUrl, fileName })),
    }))

    const styleKeys = Object.keys(STYLES) as (keyof typeof STYLES)[]
    const jobEntries = uploadedPhotos.flatMap(({ photoIndex, faceImageUrl }) =>
      styleKeys.flatMap(style =>
        SEEDS.map(seed => ({ style, seed, photoIndex, faceImageUrl }))
      )
    )

    const submitted = await Promise.all(
      jobEntries.map(({ faceImageUrl, style, seed, photoIndex }) => submitJob(faceImageUrl, style, seed, photoIndex, gender))
    )

    const requests = jobEntries.map((entry, i) => ({
      style: entry.style,
      seed: entry.seed,
      photoIndex: entry.photoIndex,
      sourceImageUrl: entry.faceImageUrl,
      requestId: submitted[i].requestId,
      done: false,
    }))

    const now = Date.now()
    const jobData = {
      jobId,
      status: 'pending',
      model: FAL_MODEL,
      submitUrl: FAL_SUBMIT_URL,
      pollBase: FAL_MODEL,
      apiType: 'identity-to-image',
      inputKind: 'face_image_url',
      faceImageUrl: uploadedPhotos[0]?.faceImageUrl,
      faceImageUrls: uploadedPhotos.map(({ faceImageUrl }) => faceImageUrl),
      requests,
      images: null,
      selection: { professional: 0, clean: 0, corporate: 0 },
      paid: false,
      paidTier: null,
      createdAt: now,
      updatedAt: now,
      cacheBust: now,
      debug: {
        generatedAt: new Date(now).toISOString(),
        model: FAL_MODEL,
        submitUrl: FAL_SUBMIT_URL,
        pollBase: FAL_MODEL,
        apiType: 'identity-to-image',
        inputKind: 'face_image_url',
        uploadedFaceImageUrl: uploadedPhotos[0]?.faceImageUrl,
        uploadedFaceImageUrls: uploadedPhotos,
        fileCount: allPhotos.length,
        uploadedCount: uploadedPhotos.length,
        gender,
        prompts: Object.fromEntries(submitted.map(({ debug }) => [`photo${debug.photoIndex}-${debug.style}-${debug.seed}`, debug.prompt])),
        submitLogs: submitted.map(({ debug }) => debug),
        pollLogs: [],
        returnedImageUrls: [],
      },
    }

    await kv.put(jobId, JSON.stringify(jobData), { expirationTtl: 86400 })

    return NextResponse.json({ jobId })
  } catch (err) {
    console.error('Generate error:', err)
    const msg = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
