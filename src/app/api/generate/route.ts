import { NextRequest, NextResponse } from 'next/server'

// POST /api/generate
// Accepts: multipart/form-data with `photo` and `style`
// Returns: { jobId }
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File | null
    const style = formData.get('style') as string

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY
    if (!ASTRIA_API_KEY) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }

    // Style → Astria prompt mapping
    const stylePrompts: Record<string, string> = {
      professional: 'professional headshot, light neutral background, business attire, soft natural lighting, LinkedIn profile photo, high quality portrait',
      clean: 'professional headshot, white background, formal attire, clean sharp look, resume photo, studio quality',
      corporate: 'corporate headshot, dark gradient background, executive look, polished professional, company bio photo, high quality',
    }

    const prompt = stylePrompts[style] || stylePrompts.professional

    // Step 1: Upload photo to Astria to create a tune (fine-tune)
    const astriaFormData = new FormData()
    astriaFormData.append('tune[title]', `headshot-${Date.now()}`)
    astriaFormData.append('tune[name]', 'person')
    astriaFormData.append('tune[base_tune_id]', '690204') // Astria's base portrait model
    astriaFormData.append('tune[image_urls][]', `data:${photo.type};base64,${Buffer.from(await photo.arrayBuffer()).toString('base64')}`)

    const tuneRes = await fetch('https://api.astria.ai/tunes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ASTRIA_API_KEY}` },
      body: astriaFormData,
    })

    if (!tuneRes.ok) {
      const err = await tuneRes.text()
      console.error('Astria tune error:', err)
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
    }

    const tune = await tuneRes.json()
    const tuneId = tune.id

    // Step 2: Create a prompt (generate images)
    const promptRes = await fetch(`https://api.astria.ai/tunes/${tuneId}/prompts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ASTRIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: prompt,
          num_images: 4,
          w: 1024,
          h: 1024,
        },
      }),
    })

    if (!promptRes.ok) {
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
    }

    const promptData = await promptRes.json()
    const jobId = `${tuneId}_${promptData.id}`

    // Store job info in Cloudflare KV (or env-based simple store for now)
    // In production: use KV.put(jobId, JSON.stringify({ tuneId, promptId, style, status: 'pending' }))

    return NextResponse.json({ jobId })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
