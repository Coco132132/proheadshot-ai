import type { Metadata } from 'next'
import UploadSection from '@/components/UploadSection'

export const metadata: Metadata = {
  title: 'LinkedIn Headshot Generator — AI Professional Photos | ProHeadshot AI',
  description: 'Generate a professional LinkedIn headshot with AI. Upload your photo and get studio-quality results in under 60 seconds. No photographer needed.',
  keywords: 'linkedin headshot generator, linkedin profile photo, professional linkedin photo AI',
  openGraph: {
    title: 'LinkedIn Headshot Generator — AI Professional Photos',
    description: 'Generate a professional LinkedIn headshot with AI. Upload and get results in 60 seconds.',
    type: 'website',
  },
}

export default function LinkedInHeadshotPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            LinkedIn Headshot Generator —{' '}
            <span className="text-blue-400">AI-Powered Professional Photos</span>
          </h1>
          <p className="text-xl text-slate-300 mb-6 max-w-2xl mx-auto">
            A great LinkedIn headshot gets 14x more profile views. Upload your selfie and
            get a studio-quality photo that makes the right first impression.
          </p>
          <div className="inline-flex items-center gap-3 bg-slate-700 rounded-full px-6 py-2 mb-10 text-sm">
            <span className="line-through text-slate-400">Photographer: $150+</span>
            <span className="text-green-400 font-semibold">ProHeadshot AI: $9.99</span>
          </div>

          <UploadSection />
        </div>
      </section>

      {/* Why LinkedIn headshot matters */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-slate-900">
            Why Your LinkedIn Headshot Matters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { stat: '14x', desc: 'More profile views with a professional headshot' },
              { stat: '36x', desc: 'More messages received' },
              { stat: '9x', desc: 'More connection requests accepted' },
            ].map((item) => (
              <div key={item.stat} className="p-6 bg-blue-50 rounded-xl">
                <p className="text-4xl font-bold text-blue-600 mb-2">{item.stat}</p>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best practices */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">
            What Makes a Great LinkedIn Headshot?
          </h2>
          <ul className="space-y-3 text-slate-700">
            {[
              'Clean, neutral background (light gray or white)',
              'Face fills 60–70% of the frame',
              'Business casual or professional attire',
              'Natural, approachable expression',
              'Good lighting — avoid harsh shadows',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-slate-500 text-sm">
            Our AI automatically handles background, lighting, and style — just upload a clear photo of your face.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-slate-900">FAQ</h2>
          {[
            { q: 'What size should my LinkedIn headshot be?', a: 'LinkedIn recommends 400x400px minimum. Our AI generates headshots at 1024px+ which exceeds LinkedIn requirements.' },
            { q: 'Can I use an AI-generated headshot on LinkedIn?', a: 'Yes. Many professionals use AI-generated headshots on LinkedIn. What matters is that it looks professional and represents you accurately.' },
            { q: 'How many headshots do I get?', a: 'You get 4 AI-generated headshot variations. Preview all for free, then pay $9.99 to download HD versions.' },
          ].map((item, i) => (
            <div key={i} className="mb-6 border-b border-slate-100 pb-6">
              <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
              <p className="text-slate-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>© 2024 ProHeadshot AI · <a href="/" className="hover:text-white">AI Headshot Generator</a> · Privacy Policy · Terms</p>
      </footer>
    </main>
  )
}
