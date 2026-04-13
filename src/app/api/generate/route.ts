import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY || '266f703a-7703-4f5a-a858-e9332747db5d:95ef83a0e521739bff4dbe73f2f65522'
const FAL_MODEL = 'fal-ai/flux/dev/image-to-image'
const FAL_SUBMIT_URL = `https://queue.fal.run/${FAL_MODEL}`

// ── Style prompts (Kontext instruction-style: edit the photo, preserve the face) ──
// Male prompts
const STYLES_MALE = {
  professional: {
    label: 'Professional',
    prompt: 'Create a new professional business headshot from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any wall, room, furniture, home interior, outdoor scenery, or any elements from the source photo. Replace the original clothing entirely with a clean, well-fitted charcoal gray or navy blazer over a crisp light dress shirt, no tie. This must look like a newly photographed professional portrait, not the original casual photo. Use a modern office background with soft blurred glass and warm subtle bokeh. Use soft flattering studio lighting, natural skin texture, matte hair texture, clean grooming, and realistic fabric detail. Avoid oily hair shine, wet look hair, over-sharpening, harsh skin smoothing, excessive contrast, and phone selfie look. Friendly natural smile, relaxed and approachable. Half body crop from waist up, balanced posture. Photorealistic, premium but natural, shallow depth of field, Canon 85mm f/1.4.',
  },
  clean: {
    label: 'Clean',
    prompt: 'Create a new formal resume headshot from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any part of the source environment. Replace the original clothing entirely with a refined charcoal gray or navy formal suit, crisp dress shirt, and tasteful coordinated tie. This must look like a freshly shot studio resume portrait, not an edited selfie. Use a pure white seamless studio background with even soft studio light. Keep skin realistic and natural, hair matte and tidy, with no oily shine, no wet hair look, no oversharpened strands, no harsh retouching, and no exaggerated facial contrast. Neutral calm expression with a slight natural micro-expression. Head and upper chest crop. Symmetrical, polished, premium, realistic Nikon 85mm studio portrait.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'Create a new high-end corporate executive portrait from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any original room, wall, decoration, or casual setting. Replace the original clothing entirely with a premium dark charcoal or deep navy executive suit, crisp dress shirt, and elegant coordinated tie. This must look like a newly shot corporate campaign portrait, not the original photo. Use a blurred upscale corporate lobby or executive conference space background with cinematic but soft directional lighting. Keep skin texture natural, hair texture matte and realistic, with no oily shine, no wet look, no oversharpening, no crunchy hair detail, and no heavy beauty retouching. Confident but relaxed expression with a subtle smile. Half body crop from waist up. High-end, realistic, polished, Sony 85mm GM portrait.',
  },
}

// Female prompts
const STYLES_FEMALE = {
  professional: {
    label: 'Professional',
    prompt: 'Create a new professional business headshot from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any wall, room, furniture, home interior, outdoor scenery, or source-photo elements. Replace the original clothing entirely with an elegant refined blouse or polished professional top in soft neutral tones, not a casual outfit and not the original clothing. This must look like a newly photographed professional portrait, not an edited selfie. Use a modern office background with softly blurred glass and warm subtle bokeh. Apply soft flattering studio lighting, realistic skin texture, matte natural hair texture, clean grooming, subtle polished makeup, and delicate elegant accessories only if natural. Avoid oily hair shine, wet look hair, crunchy sharp strands, oversharpening, harsh beauty retouching, excessive contrast, and phone selfie look. Friendly natural smile, relaxed and approachable. Half body crop from waist up. Premium, realistic, natural Canon 85mm portrait.',
  },
  clean: {
    label: 'Clean',
    prompt: 'Create a new formal resume headshot from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any part of the source environment. Replace the original clothing entirely with an elegant refined blouse or polished studio-ready professional top in clean neutral tones. This must look like a freshly shot studio resume portrait, not the original casual photo. Use a pure white seamless studio backdrop with even soft studio light. Keep skin natural and realistic, hair matte and tidy, makeup subtle and polished, with no oily shine, no wet hair look, no oversharpened hair detail, no aggressive smoothing, and no over-processed glamour effect. Neutral calm expression with a slight natural micro-expression. Head and upper chest crop. Clean, symmetrical, premium, realistic Nikon 85mm studio portrait.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'Create a new high-end corporate executive portrait from this person. Preserve only the person\'s face identity, facial structure, skin tone, and overall likeness. Completely remove the original background and do not keep any original room, wall, decoration, or casual setting. Replace the original clothing entirely with an elegant business outfit or refined blouse in polished professional tones, not the original clothing and not casual wear. This must look like a newly shot corporate campaign portrait, not an edited phone photo. Use a blurred upscale corporate lobby or executive office setting with cinematic but soft directional lighting. Keep skin texture natural, hair texture matte and realistic, makeup polished but restrained, with no oily shine, no wet look, no oversharpening, no crunchy hair detail, and no heavy beauty retouching. Confident but relaxed expression. Half body crop from waist up. High-end, realistic, polished Sony 85mm portrait.',
  },
}

// Default unified prompts (gender-neutral fallback)
const STYLES = STYLES_MALE

const SEEDS = [42, 1337, 7777]

interface DebugSubmitLog {
  style: keyof typeof STYLES
  seed: number
  endpoint: string
  apiType: 'image-to-image'
  model: string
  prompt: string
  imageUrl: string
  strength: number
  guidanceScale: number
  numInferenceSteps: number
  requestId?: string
  error?: string
}

// ── Upload photo to fal.ai storage → returns hosted URL ──
async function uploadToFal(fileBuffer: ArrayBuffer, contentType: string, fileName: string): Promise<string> {
  // Step 1: get upload URL
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: fileName, content_type: contentType }),
  })

  if (!initRes.ok) {
    const err = await initRes.text()
    throw new Error(`fal storage initiate failed: ${err}`)
  }

  const { upload_url, file_url } = await initRes.json() as { upload_url: string; file_url: string }

  // Step 2: upload actual file
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fileBuffer,
  })

  if (!uploadRes.ok) throw new Error(`fal storage upload failed: ${uploadRes.status}`)

  return file_url
}

// ── Submit one async job to fal.ai queue ──
async function submitJob(faceImageUrl: string, style: keyof typeof STYLES, seed: number, gender: 'male' | 'female' | 'auto' = 'auto'): Promise<{ requestId: string; debug: DebugSubmitLog }> {
  const styleMap = gender === 'female' ? STYLES_FEMALE : STYLES_MALE
  const prompt = styleMap[style].prompt
  const strength = 0.9
  const guidanceScale = 7
  const numInferenceSteps = 40
  const payload = {
    image_url: faceImageUrl,
    prompt,
    strength,
    guidance_scale: guidanceScale,
    num_inference_steps: numInferenceSteps,
    seed,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'jpeg',
    acceleration: 'none',
  }

  const debugBase: DebugSubmitLog = {
    style,
    seed,
    endpoint: FAL_SUBMIT_URL,
    apiType: 'image-to-image',
    model: FAL_MODEL,
    prompt,
    imageUrl: faceImageUrl,
    strength,
    guidanceScale,
    numInferenceSteps,
  }

  console.log('[generate] submitting image-to-image request', JSON.stringify(debugBase))

  const res = await fetch(FAL_SUBMIT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kv = (getRequestContext().env as any).JOBS
    if (!kv) return NextResponse.json({ error: 'Storage not available' }, { status: 500 })

    const formData = await request.formData()
    const photos = formData.getAll('photos') as File[]
    const photo = formData.get('photo') as File | null
    const allPhotos = photos.length > 0 ? photos : (photo ? [photo] : [])
    const genderParam = (formData.get('gender') as string | null) ?? 'auto'
    const gender = (genderParam === 'female' || genderParam === 'male') ? genderParam : 'auto'

    if (allPhotos.length === 0) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 })
    }

    const primaryPhoto = allPhotos[0]

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(primaryPhoto.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPG or PNG.' }, { status: 400 })
    }
    if (primaryPhoto.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
    }

    const jobId = crypto.randomUUID()

    // Upload primary photo to fal.ai storage
    const buf = await primaryPhoto.arrayBuffer()
    const ext = primaryPhoto.type.includes('png') ? 'png' : 'jpg'
    const faceImageUrl = await uploadToFal(buf, primaryPhoto.type, `face-${jobId}.${ext}`)

    console.log('[generate] uploaded source image', JSON.stringify({ jobId, faceImageUrl, fileCount: allPhotos.length, gender, model: FAL_MODEL, apiType: 'image-to-image', strategy: 'strong-transform' }))

    // Submit 9 jobs in parallel (3 styles × 3 seeds)
    const styleKeys = Object.keys(STYLES) as (keyof typeof STYLES)[]
    const jobEntries = styleKeys.flatMap(style =>
      SEEDS.map(seed => ({ style, seed }))
    )

    const submitted = await Promise.all(
      jobEntries.map(({ style, seed }) => submitJob(faceImageUrl, style, seed, gender))
    )

    // Build requests map
    const requests = jobEntries.map((entry, i) => ({
      style: entry.style,
      seed: entry.seed,
      requestId: submitted[i].requestId,
      done: false,
    }))

    // Store pending job in KV
    const now = Date.now()
    const jobData = {
      jobId,
      status: 'pending',
      model: FAL_MODEL,
      submitUrl: FAL_SUBMIT_URL,
      pollBase: 'fal-ai/flux',
      apiType: 'image-to-image',
      inputKind: 'image_url',
      faceImageUrl,
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
        pollBase: 'fal-ai/flux',
        apiType: 'image-to-image',
        inputKind: 'image_url',
        uploadedFaceImageUrl: faceImageUrl,
        fileCount: allPhotos.length,
        gender,
        prompts: Object.fromEntries(submitted.map(({ debug }) => [`${debug.style}-${debug.seed}`, debug.prompt])),
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
