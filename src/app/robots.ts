import { MetadataRoute } from 'next'

export const runtime = 'edge'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/result', '/success'],
      },
    ],
    sitemap: 'https://getproheadshot.com/sitemap.xml',
  }
}
