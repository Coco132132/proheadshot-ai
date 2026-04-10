# ProHeadshot AI — MVP Product Requirements Document

**Version:** v2.0  
**Date:** 2026-04-10  
**Status:** Active  
**Previous Version:** PRD-MVP-v1.0.md

---

## 1. Product Definition (One-liner)

> Upload 1 or more photos → Generate 9 headshots (3 styles × 3 each) → System recommends best 3 → Pay $9.9 to unlock → Upgrade to all 9 for $14.9

---

## 2. Core User Flow

```
1. Upload photo(s)
2. AI generates 9 headshots (3 styles × 3 variations)
3. System auto-selects best 3 (one per style)
4. User optionally swaps within each style group
5. Pay $9.9 → unlock 3 HD photos
6. Upsell: +$5 to unlock remaining 6 photos
```

---

## 3. Homepage

### Goal
- Lower barrier to entry
- Drive photo upload immediately
- De-emphasize pricing upfront

### Structure & Copy

**H1 (Main Headline)**
```
One photo. Three professional headshots.
```

**Subheading**
```
LinkedIn, Resume, and Corporate-ready photos in seconds.
```

**Price hint (small, subtle)**
```
From $9.9
```

**Upload Area**
```
Button: Upload your photo(s)

Hint text:
  Upload 1 photo for quick results
  Upload more for better likeness (recommended)

Fine print:
  More photos = better identity consistency
```

**CTA Button**
```
Generate my headshots
```

### Design Notes
- No pricing table on homepage
- No plan comparison
- No forced choices — just upload and go

---

## 4. Result Page

### Goal
- Showcase value (9 photos)
- Guide toward payment
- Reduce decision friction

### Photo Display Structure

3 groups × 3 photos each = 9 total:

| Group | Label | Count |
|-------|-------|-------|
| 1 | LinkedIn | 3 |
| 2 | Resume | 3 |
| 3 | Corporate | 3 |

### Recommendation Mechanism

**Headline:**
```
Your best results (selected for you)
```

- System auto-selects 1 photo per group (3 total)
- Selected photos are highlighted
- User can click to switch within same group

**Hint text:**
```
Not what you like? You can switch before downloading.
```

### Pricing Block

**Primary CTA (default):**
```
Download your best 3 photos – $9.9
```

**Upsell Option:**
```
Unlock all 9 photos – $14.9
```

**Social proof copy under upsell:**
```
Most users choose this for more options
```

### Design Rules
- ❌ No pricing table
- ❌ No plan comparison
- ✅ Default selection done for user
- ✅ Clear upgrade path visible but not pushy

---

## 5. Post-Payment Logic

### Case 1: Paid $9.9 (3 photos)

Page updates:
- 3 selected photos → HD, downloadable ✅
- 6 remaining photos → blurred / watermarked ❌

Upsell prompt displayed:

**Headline:**
```
Want more options?
```

**Button:**
```
Unlock remaining 6 photos – $5
```

**Copy:**
```
Get all your photos with one click
```

### Case 2: Paid $14.9 (9 photos) or upgraded via $5

All 9 photos unlocked.

**Button:**
```
Download all photos
```

---

## 6. Pricing Summary

| Option | Price | Photos |
|--------|-------|--------|
| Best 3 (recommended) | $9.9 | 3 HD |
| All 9 photos | $14.9 | 9 HD |
| Upgrade (after $9.9) | +$5 | +6 HD |

---

## 7. Access & No-Login Architecture

### Unique Result Link
```
/result/{unique_id}
```

- No login required
- All state tied to this URL
- Job data stored in Cloudflare KV (TTL: 24h)

### Page reminder (must have)
```
Save this link to access your photos anytime
```

### Optional: Download helper file
- Filename: `your-headshots-link.txt`
- Content: `Your results link: https://getproheadshot.com/result/xxxx`

### Optional: Email capture
```
Send results to your email (optional)
[email input field]
```

---

## 8. Urgency Design (Recommended)

Result page timer notice:
```
Your photos will be available for 24 hours
```

Purpose:
- Increases conversion rate
- Encourages return purchase within window

---

## 9. Key UX Principles

| Rule | Detail |
|------|--------|
| ❌ Don't | Show pricing table |
| ❌ Don't | Force plan selection |
| ❌ Don't | Over-complicate choices |
| ✅ Do | Pre-select best 3 photos |
| ✅ Do | Let users lightly adjust |
| ✅ Do | Show clear $5 upgrade path |
| ✅ Do | Keep primary CTA singular |

---

## 10. Technical Stack (Current)

| Component | Tech |
|-----------|------|
| Frontend | Next.js 15.5.2 + Tailwind CSS |
| Hosting | Cloudflare Pages |
| Storage | Cloudflare KV |
| Payment | PayPal (Live) |
| AI Generation | TBD (Astria recommended for face likeness) |
| Domain | getproheadshot.com |

---

## 11. Implementation Priority (Next Steps)

1. **UI Redesign** — Implement v2 homepage + result page per this spec
2. **9-photo grid** — Update result page to show 3×3 layout with auto-selection
3. **Tiered pricing** — $9.9 (3 photos) + $5 upsell logic
4. **AI API** — Integrate Astria or equivalent for real face-matched headshots
5. **Email capture** — Optional post-generation email field
6. **Urgency timer** — 24h countdown on result page

---

## 12. One-Line Summary

> Simple flow, low friction, two-step monetization:  
> Pay $9.9 for 3 photos → upsell to full set for +$5
