import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

const FAL_KEY = process.env.FAL_KEY || '266f703a-7703-4f5a-a858-e9332747db5d:95ef83a0e521739bff4dbe73f2f65522'
const FAL_MODEL = 'fal-ai/pulid'

// ── Style prompts — gender-aware, matched to homepage reference photos ──
// Male prompts
const STYLES_MALE = {
  professional: {
    label: 'Professional',
    prompt: 'professional business headshot of a man, half body portrait from waist up, blurred modern office glass interior background with soft bokeh, wearing navy blue blazer without tie over light dress shirt, fabric has natural texture without excessive wrinkles, uniform skin tone across face and neck, warm soft lighting, friendly natural smile, relaxed expression, subtle micro expression, realistic skin texture, candid feeling, approachable and confident, natural balanced posture, photorealistic photography Canon 85mm f/1.4 shallow depth of field',
  },
  clean: {
    label: 'Clean',
    prompt: 'formal resume headshot of a man, head and upper chest framing, clean pure white studio seamless background, wearing formal well-tailored suit with crisp dress shirt and striped tie, fabric has refined texture without excessive creases, uniform skin tone across face and neck, neutral but natural expression with slight micro expression, even soft studio lighting, symmetrical face, minimal polished style, professional and calm, realistic skin texture, sharp photorealistic photography Nikon 85mm',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'corporate executive portrait of a man, half body portrait from waist up, blurred modern corporate indoor lobby or conference room background with cinematic lighting, wearing dark charcoal suit with crisp dress shirt and refined tie, fabric has luxurious texture without excessive wrinkles, uniform skin tone across face and neck, confident but relaxed smile, cinematic directional lighting, high-end professional look, natural posture, subtle expression, realistic face, photorealistic photography Sony 85mm GM f/1.4',
  },
}

// Female prompts
const STYLES_FEMALE = {
  professional: {
    label: 'Professional',
    prompt: 'professional business headshot of a woman, half body portrait from waist up, blurred modern office glass interior background with soft bokeh, wearing elegant blouse or refined innerwear such as ruffled collar blouse in soft colors not dark navy or black blazer, fabric has natural texture without excessive wrinkles, uniform skin tone across face and neck, natural professional makeup with soft shaped eyebrows light eyeshadow subtle eyeliner defined lashes and natural lipstick, small elegant earrings, refined polished hairstyle, warm soft lighting, friendly natural smile, relaxed expression, subtle micro expression, realistic skin texture, approachable and confident, natural balanced head-to-body proportion, photorealistic photography Canon 85mm f/1.4 shallow depth of field',
  },
  clean: {
    label: 'Clean',
    prompt: 'formal resume headshot of a woman, head and upper chest framing, clean pure white studio seamless background, wearing elegant blouse or refined top in neutral soft colors, minimal polished look, uniform skin tone across face and neck, natural professional makeup with light clean style shaped eyebrows soft eyeshadow defined lashes natural lipstick, subtle earrings, neat refined polished hairstyle, neutral but natural expression with slight micro expression, even soft studio lighting, professional and calm, realistic skin texture, natural balanced head-to-body proportion, sharp photorealistic photography Nikon 85mm',
  },
  corporate: {
    label: 'Corporate',
    prompt: 'corporate executive portrait of a woman, half body portrait from waist up, blurred modern corporate indoor lobby or executive office background with cinematic lighting, wearing elegant business outfit with refined blouse in refined colors not dark navy or black suit, optional subtle necklace, uniform skin tone across face and neck, natural professional makeup with polished and refined style shaped eyebrows defined eyeshadow eyeliner elegant lashes and lipstick, elegant earrings, styled professional polished hairstyle, confident but relaxed expression, cinematic directional lighting, high-end professional look, natural posture, subtle expression, realistic face, natural balanced head-to-body proportion, photorealistic photography Sony 85mm GM f/1.4',
  },
}

// Default unified prompts (gender-neutral fallback combining both)
const STYLES = STYLES_MALE

const NEGATIVE_PROMPT = 'extreme close-up, face filling frame, big head doll, oversized head, disproportionate head too large, no body visible, full body legs visible, cartoon, anime, illustration, blurry face, bad anatomy, asymmetric eyes, deformed, ugly, watermark, text, nsfw, messy hair, disheveled, fly-away hair strands, harsh lighting, flat lighting, stiff unnatural expression, blank eyes, emotionless, fake face, plastic skin, over-retouched, distorted face, extra fingers, overposed, heavy makeup, exaggerated makeup, overdone lipstick, dramatic eyeliner, unnatural accessories, oversized jewelry, mismatched skin tone between face and neck, uneven skin color, collar wrinkles, excessive fabric creases, cheap looking suit, wrinkled shirt'

const SEEDS = [42, 1337, 7777]

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
async function submitJob(faceImageUrl: string, style: keyof typeof STYLES, seed: number, gender: 'male' | 'female' | 'auto' = 'auto'): Promise<string> {
  const styleMap = gender === 'female' ? STYLES_FEMALE : STYLES_MALE
  const res = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference_images: [{ image_url: faceImageUrl }],
      prompt: styleMap[style].prompt,
      negative_prompt: NEGATIVE_PROMPT,
      num_inference_steps: 12,
      guidance_scale: 1.5,
      image_size: { width: 768, height: 1024 },  // 3:4 portrait ratio
      seed,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`fal queue submit failed: ${err}`)
  }

  const data = await res.json() as { request_id: string }
  return data.request_id
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

    // Submit 9 jobs in parallel (3 styles × 3 seeds)
    const styleKeys = Object.keys(STYLES) as (keyof typeof STYLES)[]
    const jobEntries = styleKeys.flatMap(style =>
      SEEDS.map(seed => ({ style, seed }))
    )

    const requestIds = await Promise.all(
      jobEntries.map(({ style, seed }) => submitJob(faceImageUrl, style, seed, gender))
    )

    // Build requests map
    const requests = jobEntries.map((entry, i) => ({
      style: entry.style,
      seed: entry.seed,
      requestId: requestIds[i],
      done: false,
    }))

    // Store pending job in KV
    const jobData = {
      status: 'pending',
      faceImageUrl,
      requests,
      images: null,
      selection: { professional: 0, clean: 0, corporate: 0 },
      paid: false,
      paidTier: null,
      createdAt: Date.now(),
    }

    await kv.put(jobId, JSON.stringify(jobData), { expirationTtl: 86400 })

    return NextResponse.json({ jobId })
  } catch (err) {
    console.error('Generate error:', err)
    const msg = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
