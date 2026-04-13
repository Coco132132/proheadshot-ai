import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY || '266f703a-7703-4f5a-a858-e9332747db5d:95ef83a0e521739bff4dbe73f2f65522'
const FAL_MODEL = 'fal-ai/flux-pro/kontext'
const FAL_SUBMIT_URL = `https://queue.fal.run/${FAL_MODEL}`

// ── Style prompts (Kontext instruction-style: edit the photo, preserve the face) ──
// Male prompts
const STYLES_MALE = {
  professional: {
    label: 'Professional',
    prompt: 'Transform this photo into a professional business headshot. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a modern office interior with blurred glass windows and soft warm bokeh. Dress the person in a well-fitted blazer in charcoal gray or navy blue tone without a tie, over a crisp light dress shirt — fabric should look refined and smooth with no excessive wrinkles. Adjust the lighting to warm soft ambient light. The expression should be a friendly natural smile, relaxed and approachable. Maintain uniform skin tone across face and neck. Crop to half body from waist up, natural balanced posture. Photorealistic quality, Canon 85mm f/1.4 shallow depth of field.',
  },
  clean: {
    label: 'Clean',
    prompt: 'Transform this photo into a formal resume headshot. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a clean pure white seamless studio backdrop. Dress the person in a well-tailored formal suit in charcoal gray or navy blue with a crisp dress shirt and a coordinated patterned tie in a complementary color — fabric should look luxurious and smooth. Adjust the lighting to even soft studio light. The expression should be neutral, calm, and natural with a slight micro expression. Crop to head and upper chest. Symmetrical and polished look. Photorealistic quality, Nikon 85mm.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'Transform this photo into a corporate executive portrait. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a blurred modern corporate indoor lobby or executive conference room with cinematic directional lighting. Dress the person in a premium dark charcoal or deep navy suit with a crisp dress shirt and an elegant patterned tie in a coordinated matching color — fabric should look high-end and refined with no wrinkles. The expression should be confident but relaxed with a subtle smile. Crop to half body from waist up, natural posture. Cinematic high-end professional look. Photorealistic quality, Sony 85mm GM f/1.4.',
  },
}

// Female prompts
const STYLES_FEMALE = {
  professional: {
    label: 'Professional',
    prompt: 'Transform this photo into a professional business headshot. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a modern office interior with blurred glass windows and soft warm bokeh. Dress the person in an elegant blouse or refined top in soft neutral colors — not dark navy or black blazer — fabric smooth and polished. Apply natural professional makeup: softly shaped eyebrows, light eyeshadow, subtle eyeliner, defined lashes, natural lipstick. Add small elegant earrings. Style the hair in a refined polished professional look. Adjust the lighting to warm soft ambient light. The expression should be a friendly natural smile, relaxed and approachable. Maintain uniform skin tone across face and neck. Crop to half body from waist up. Photorealistic quality, Canon 85mm f/1.4.',
  },
  clean: {
    label: 'Clean',
    prompt: 'Transform this photo into a formal resume headshot. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a clean pure white seamless studio backdrop. Dress the person in an elegant blouse or refined top in neutral soft colors — minimal and polished. Apply light clean natural professional makeup: shaped eyebrows, soft eyeshadow, defined lashes, natural lipstick. Add subtle earrings. Style the hair in a neat refined polished look. Adjust the lighting to even soft studio light. The expression should be neutral and calm with a slight natural micro expression. Crop to head and upper chest. Professional and elegant. Photorealistic quality, Nikon 85mm.',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'Transform this photo into a corporate executive portrait. Keep the person\'s face, identity, and skin tone exactly the same. Change the background to a blurred modern corporate indoor lobby or executive office with cinematic directional lighting. Dress the person in an elegant business outfit with a refined blouse in polished colors — not dark navy or black suit. Optionally add a subtle necklace. Apply polished professional makeup: shaped eyebrows, defined eyeshadow, eyeliner, elegant lashes, refined lipstick. Add elegant earrings. Style the hair in a professional polished updo or styled look. The expression should be confident but relaxed. Crop to half body from waist up. Cinematic high-end professional look. Photorealistic quality, Sony 85mm GM f/1.4.',
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
  const payload = {
    image_url: faceImageUrl,
    prompt,
    guidance_scale: 3.5,
    num_inference_steps: 28,
    seed,
    output_format: 'jpeg',
    safety_tolerance: '2',
  }

  const debugBase: DebugSubmitLog = {
    style,
    seed,
    endpoint: FAL_SUBMIT_URL,
    apiType: 'image-to-image',
    model: FAL_MODEL,
    prompt,
    imageUrl: faceImageUrl,
  }

  console.log('[generate] submitting kontext request', JSON.stringify(debugBase))

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

    console.log('[generate] uploaded source image', JSON.stringify({ jobId, faceImageUrl, fileCount: allPhotos.length, gender, model: FAL_MODEL, apiType: 'image-to-image' }))

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
        pollBase: 'fal-ai/flux-pro',
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
