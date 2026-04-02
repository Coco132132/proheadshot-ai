import { NextRequest, NextResponse } from 'next/server'

// Style → prompt mapping
const STYLE_PROMPTS: Record<string, string> = {
  professional: 'professional headshot photo, light neutral gray background, business casual attire, soft natural studio lighting, sharp focus, LinkedIn profile photo quality, photorealistic',
  clean: 'professional headshot photo, pure white background, formal business attire, clean crisp look, resume photo quality, sharp focus, photorealistic',
  corporate: 'corporate executive headshot, dark gradient background, professional suit, polished look, company profile photo, dramatic studio lighting, photorealistic',
}

// POST /api/generate
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File | null
    const style = formData.get('style') as string || 'professional'

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
    if (!REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }

    // Convert file to base64 data URI
    const bytes = await photo.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${photo.type};base64,${base64}`

    const prompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.professional

    // Call Replicate — photomaker model
    const response = await fetch('https://api.replicate.com/v1/models/tencentarc/photomaker/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60', // wait up to 60s for result
      },
      body: JSON.stringify({
        input: {
          prompt: `img ${prompt}`,
          input_image: dataUri,
          num_outputs: 4,
          num_inference_steps: 30,
          style_strength_ratio: 35,
          guidance_scale: 7.5,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Replicate error:', err)
      return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
    }

    const prediction = await response.json()

    // If still processing, return jobId for polling
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return NextResponse.json({ jobId: prediction.id, status: 'pending' })
    }

    // If completed immediately (Prefer: wait)
    if (prediction.status === 'succeeded' && prediction.output) {
      return NextResponse.json({
        jobId: prediction.id,
        status: 'complete',
        images: prediction.output.slice(0, 4),
      })
    }

    return NextResponse.json({ jobId: prediction.id, status: 'pending' })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
