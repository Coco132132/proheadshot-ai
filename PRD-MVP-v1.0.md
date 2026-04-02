# ProHeadshot AI — MVP Product Requirements Document

**Version:** v1.0  
**Date:** 2026-04-02  
**Status:** Final

---

## 1. Project Goal

**Problem Statement:**  
Most professionals lack a high-quality headshot for LinkedIn, resumes, and company profiles. Traditional photography is expensive ($150+) and time-consuming. ProHeadshot AI lets users upload a selfie and receive a studio-quality professional headshot in minutes.

**Target Users:**  
Job seekers, professionals, and employees (25–45) in the US and Europe who need a polished headshot for LinkedIn or job applications but won't pay for a photographer.

**Core Value (v1):**  
Upload a selfie → get a professional headshot → pay once → download instantly. No account required. Under 5 minutes.

---

## 2. MVP Scope

### ✅ Must-Have (v1)

- Photo upload (JPG/PNG, ≤10MB)
- Style selection (3 options)
- AI headshot generation via Astria.ai API
- Low-res / watermarked preview (4 images)
- One-time payment via Stripe ($9.99)
- HD download page with 24h expiry link
- 5 core pages deployed on Cloudflare Pages

### ❌ Out of Scope (v1)

| Feature | Reason |
|---|---|
| User registration / login | Adds friction, not needed for one-time purchase |
| Subscription model | Requires account system, complex billing |
| Image editor (crop, retouch, BG swap) | Scope creep, not core value |
| Self-trained AI model | High cost, long timeline |
| Mobile app | Web-first for MVP |
| Batch upload / team plans | Second phase |
| Multi-language | Second phase |
| Blog content | Second phase |
| History / re-download | Not needed without accounts |

---

## 3. User Flow

```
[ Homepage / Tool Page ]
        ↓
  Upload a photo
  (JPG/PNG ≤10MB)
        ↓
  Select a style
  (Professional / Clean / Corporate)
        ↓
  AI generation in progress
  (Astria.ai API, 20–60s, progress bar shown)
        ↓
  Preview results
  (4 images, low-res + watermark, no download)
        ↓
  Click "Unlock HD Headshots"
        ↓
  /checkout (Stripe Checkout, $9.99)
        ↓
  Payment success
        ↓
  /success (download page, links valid 24h)
        ↓
  Download HD images (no watermark, ≥1024px)
```

**Key Principle:** No registration required at any step. Every extra step reduces conversion.

---

## 4. Page Structure

| Page | URL | Purpose |
|---|---|---|
| Homepage | `/` | Brand intro, before/after demo, upload CTA. Primary conversion entry point. |
| Tool Page | `/linkedin-headshot-generator` | SEO landing page targeting "linkedin headshot generator". Same upload flow as homepage. |
| Result Page | `/result` | Displays 4 low-res/watermarked previews. Core conversion point — drives user to checkout. |
| Checkout Page | `/checkout` | Stripe Checkout integration. Handles payment. Minimal friction. |
| Success Page | `/success` | Post-payment download page. Shows HD download buttons. Links expire in 24h. |

> MVP ships with these 5 pages only.

---

## 5. Functional Requirements

### 5.1 Image Upload

- Accepted formats: JPG, PNG
- Max file size: 10MB
- Show thumbnail preview after upload for user confirmation
- Display clear error message if file is invalid or too large
- No camera capture in v1

### 5.2 Style Selection

Users choose one style before generating. Each style has a label, short description, and example thumbnail.

| Style | Description |
|---|---|
| **Professional** | Light neutral background, business attire feel. Best for LinkedIn profiles. |
| **Clean** | White or off-white background, formal look. Ideal for resumes and job applications. |
| **Corporate** | Dark or gradient background, polished executive tone. Suited for company bios and team pages. |

### 5.3 AI Generation (via Astria.ai)

- Submit uploaded photo + selected style to Astria.ai API
- Generate 4 headshot variants per request
- Display progress bar during generation (polling or webhook)
- Estimated generation time: 20–60 seconds
- On failure: show error message + "Try Again" button
- Generated images stored temporarily in Cloudflare R2

### 5.4 Preview (Result Page)

- Display all 4 generated images in a 2×2 grid
- Images are low-resolution (max 400px) or watermarked
- Users can click to view each image larger
- No download option available in preview state
- Prominent "Unlock HD Headshots" CTA above and below the grid

### 5.5 Payment & Download

- "Unlock HD" button → redirect to `/checkout`
- `/checkout` uses Stripe Checkout (hosted page)
- On payment success → Stripe webhook triggers generation of signed download URLs
- Redirect to `/success` with download buttons
- Download links point to Cloudflare R2 signed URLs
- Link expiry: 24 hours from payment

---

## 6. Result Page — Conversion Optimization

The `/result` page is the most critical page for monetization. Layout and copy must be optimized for conversion.

**Layout:**

```
[ 2×2 image grid — low-res / watermarked ]

Studio photo session: $150+  →  ProHeadshot AI: $9.99

[ Unlock HD Headshots — $9.99 ]

✓ HD resolution (1024px+)
✓ No watermark
✓ Instant download
✓ All 4 styles included
```

**Rules:**
- CTA button must be high-contrast (blue or orange)
- Price anchor (`$150+ vs $9.99`) must be visible without scrolling
- No distractions or secondary navigation links on this page

---

## 7. Pricing Model

**MVP: One-time payment only.**

| Item | Price |
|---|---|
| Unlock HD Headshots (4 images) | **$9.99** |

**Why one-time payment (not subscription) in v1:**

1. No account system required — simplifies architecture significantly
2. Lower commitment for first-time users — easier conversion
3. Suitable for low-frequency use case (users don't need new headshots monthly)
4. Allows fast pricing validation before investing in subscription infrastructure

**Future pricing (Phase 2+):**
- Pro: $19.99 (more styles, 30-day re-download)
- Team: $49.99 (5 users)
- Subscription: $15/month (if repeat usage is validated)

---

## 8. SEO Strategy

**Principle:** One page = one target keyword. No overlap.

### MVP Phase

| Page | Target Keyword | Priority |
|---|---|---|
| `/` | `AI headshot generator` | Primary |
| `/linkedin-headshot-generator` | `LinkedIn headshot generator` | Primary |

**On-page requirements (both pages):**
- Target keyword in H1, meta title, meta description
- Target keyword in at least one image alt tag
- Page URL slug matches keyword
- FAQ section at bottom (Schema markup: FAQPage)
- Internal links between homepage and tool page

### Phase 2 (after MVP)

| Page | Target Keyword |
|---|---|
| `/resume-photo-generator` | resume photo generator |
| `/professional-ai-headshot` | professional ai headshot |
| `/business-profile-picture` | corporate headshot ai |
| `/blog/linkedin-profile-photo-tips` | linkedin profile photo tips |
| `/blog/how-to-take-a-professional-headshot` | how to take a professional headshot |

---

## 9. Technical Approach

**Principle: Ship fast. No over-engineering. Add complexity only when validated.**

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | SSR for SEO, fast setup, Cloudflare compatible |
| Backend | Next.js API Routes | No separate backend needed in v1 |
| AI Generation | **Astria.ai API** | Fine-tuned portrait model, no GPU required, pay-per-use |
| Image Storage | **Cloudflare R2** | S3-compatible, free egress, signed URL support |
| Payment | Stripe Checkout | Hosted checkout, minimal integration, handles tax/compliance |
| Hosting | **Cloudflare Pages** | Fast global CDN, free tier, native R2 integration |
| DNS / CDN | Cloudflare | SSL, caching, performance out of the box |

**Data Storage:**
- No traditional database in v1
- Minimal state: store `{ jobId, paymentStatus, downloadUrls, expiresAt }` as a short-lived record
- Can use Cloudflare KV or D1 (lightweight, serverless) for job/payment state tracking
- No user accounts, no persistent profile data

**Do NOT add in v1:**
- PostgreSQL / MySQL full database
- Redis cache layer
- Docker / Kubernetes
- Self-hosted GPU inference

---

## 10. Error Handling

| Scenario | Handling |
|---|---|
| Upload fails (format/size) | Inline error below upload zone: "Please upload a JPG or PNG under 10MB." |
| AI generation fails (API error) | Show error message: "Generation failed. Please try again." + retry button. Log error server-side. |
| AI generation timeout (>90s) | Timeout at 90s, prompt user to retry. |
| Payment fails | Stripe handles display. On webhook failure, show `/checkout?error=1` with support contact. |
| Download link expired (>24h) | `/success` page shows: "Your download link has expired. Contact support to renew." |
| Invalid result page access (no job ID) | Redirect to homepage. |

---

## 11. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load speed | Homepage LCP < 2.5s (Core Web Vitals pass) |
| Mobile usability | Fully usable on mobile browsers (upload, preview, checkout) |
| UI clarity | User should understand the flow without a tutorial |
| Payment trust | Stripe badge, HTTPS, no sketchy UI patterns |
| Uptime | ≥99.5% (Cloudflare Pages + R2 SLA) |
| Image security | R2 signed URLs only — no public direct access to HD files |

---

## 12. Success Metrics

These metrics define whether the MVP is working. Measure from day 1.

| Metric | Target (First 30 days) |
|---|---|
| Homepage → Upload initiated | ≥ 40% |
| Upload → Generation completed | ≥ 85% |
| Generation completed → Result page viewed | ≥ 95% |
| Result page → Checkout clicked | ≥ 15% |
| Checkout → Payment completed | ≥ 60% |
| First paying users | ≥ 20 in first 30 days |
| Generation error rate | < 5% |

> These are initial benchmarks. Revise after first 2 weeks of real data.

---

## 13. Roadmap

### MVP — 0 to 4 Weeks

- [ ] Set up Cloudflare Pages + R2 + KV
- [ ] Build 5 pages: `/`, `/linkedin-headshot-generator`, `/result`, `/checkout`, `/success`
- [ ] Integrate Astria.ai API (upload → generate → retrieve)
- [ ] Implement Stripe Checkout + webhook → signed download URL
- [ ] Deploy to production domain
- [ ] Basic SEO setup (meta tags, H1, sitemap.xml, robots.txt)
- [ ] Manual QA of full user flow

**Exit criteria:** Real users can pay and download HD headshots end-to-end.

---

### Phase 2 — Month 2 to 3

- Add 3 additional tool pages (`/resume-photo-generator`, `/professional-ai-headshot`, `/business-profile-picture`)
- Launch 3 blog articles targeting long-tail keywords
- Add email capture on `/success` page ("Get notified of new styles")
- A/B test pricing ($7.99 vs $12.99)
- Add Google Analytics + Hotjar (funnel analysis)
- Add more style options (5 total)

---

### Phase 3 — Month 4+  *(validate before building)*

- User accounts + headshot history
- Subscription plan ($15/month)
- Team / bulk plans ($49.99)
- Style expansion (10+ styles)
- Multi-language support (ES, FR)
- Integration: direct LinkedIn upload API (if available)

---

*Document owner: Product*  
*Last updated: 2026-04-02*  
*Next review: After MVP launch*
