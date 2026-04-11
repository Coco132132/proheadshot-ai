import { MetadataRoute } from 'next'

export const runtime = 'edge'

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = 'https://getproheadshot.com'
  const now = new Date()

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/linkedin-headshot-generator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]
}
