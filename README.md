# ProHeadshot AI

AI-powered professional headshot generator for LinkedIn, resumes, and corporate profiles.

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **AI:** [Astria.ai](https://www.astria.ai) API
- **Payment:** Stripe Checkout
- **Hosting:** Cloudflare Pages
- **Storage:** Cloudflare R2

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

Required keys:
- `ASTRIA_API_KEY` — from [astria.ai](https://www.astria.ai/users/edit#api)
- `STRIPE_SECRET_KEY` — from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook settings
- `NEXT_PUBLIC_BASE_URL` — your deployed domain

### 3. Run locally

```bash
npm run dev
```

### 4. Deploy to Cloudflare Pages

```bash
npm run pages:build
npm run pages:deploy
```

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — brand entry + upload CTA |
| `/linkedin-headshot-generator` | SEO tool page for LinkedIn headshots |
| `/result` | Preview page + conversion (pay to unlock HD) |
| `/checkout` | Stripe Checkout (redirected automatically) |
| `/success` | Post-payment download page |

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/generate` | POST | Upload photo → call Astria.ai → return jobId |
| `/api/result` | GET | Poll for generated images by jobId |
| `/api/checkout` | POST | Create Stripe Checkout session |
| `/api/download` | GET | Verify payment → return HD download URLs |
| `/api/webhook` | POST | Stripe webhook handler |

## Pricing

- Free: Preview 4 watermarked headshots
- $9.99 one-time: Download all 4 HD headshots (no watermark)

## Roadmap

See [PRD-MVP-v1.0.md](./PRD-MVP-v1.0.md) for full product requirements.
