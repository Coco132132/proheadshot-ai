import type { Metadata } from 'next'
import UploadSection from '@/components/UploadSection'

export const metadata: Metadata = {
  title: 'AI Headshot Generator — Professional Photos in Minutes | ProHeadshot AI',
  description: 'Upload your selfie and get a studio-quality professional headshot powered by AI. Perfect for LinkedIn, resumes, and company profiles. Try free today.',
  keywords: 'AI headshot generator, professional headshot AI, linkedin headshot, resume photo AI',
  openGraph: {
    title: 'AI Headshot Generator — Professional Photos in Minutes',
    description: 'Upload your selfie and get a studio-quality professional headshot powered by AI.',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI Headshot Generator —{' '}
            <span className="text-blue-400">Professional Photos in Minutes</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Upload your selfie. Get a studio-quality professional headshot powered by AI.
            Perfect for LinkedIn, resumes, and company bios.
          </p>

          {/* Price anchor */}
          <div className="inline-flex items-center gap-3 bg-slate-700 rounded-full px-6 py-2 mb-10 text-sm">
            <span className="line-through text-slate-400">Studio photo: $150+</span>
            <span className="text-green-400 font-semibold">ProHeadshot AI: $9.99</span>
          </div>

          {/* Upload CTA */}
          <UploadSection />
        </div>
      </section>

      {/* Before/After Examples */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            From Selfie to Professional in Seconds
          </h2>
          <p className="text-slate-600 mb-10">Join 500,000+ professionals who upgraded their headshot with AI</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { style: 'Professional', desc: 'Best for LinkedIn' },
              { style: 'Clean', desc: 'Best for Resumes' },
              { style: 'Corporate', desc: 'Best for Company Bios' },
            ].map((item) => (
              <div key={item.style} className="rounded-xl overflow-hidden shadow-md border border-slate-100">
                <div className="bg-slate-100 h-48 flex items-center justify-center text-slate-400">
                  Example — {item.style}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{item.style}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10 text-slate-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload Your Photo', desc: 'Upload any selfie or portrait photo. JPG or PNG, under 10MB.' },
              { step: '2', title: 'Choose Your Style', desc: 'Select Professional, Clean, or Corporate. Each style is optimized for different use cases.' },
              { step: '3', title: 'Download Your Headshot', desc: 'Get 4 AI-generated headshots in HD. Pay once, download instantly.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center text-slate-900">Frequently Asked Questions</h2>
          {[
            { q: 'Is this free to use?', a: 'You can preview all 4 generated headshots for free. Download the HD versions for $9.99 (one-time, no subscription).' },
            { q: 'How does AI headshot generation work?', a: 'We use Astria.ai\'s fine-tuned portrait model to transform your photo into professional headshots. The AI adjusts lighting, background, and styling automatically.' },
            { q: 'What photo should I upload?', a: 'A clear selfie or portrait works best. Face should be clearly visible, well-lit, and looking roughly at the camera.' },
            { q: 'How long does generation take?', a: 'Usually 20–60 seconds. We\'ll show a progress bar while your headshots are being created.' },
            { q: 'Do I need to create an account?', a: 'No account needed. Upload, generate, pay, and download — all without signing up.' },
          ].map((item, i) => (
            <div key={i} className="mb-6 border-b border-slate-100 pb-6">
              <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
              <p className="text-slate-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-sm">
        <p>© 2024 ProHeadshot AI · <a href="/linkedin-headshot-generator" className="hover:text-white">LinkedIn Headshot Generator</a> · Privacy Policy · Terms</p>
      </footer>
    </main>
  )
}
