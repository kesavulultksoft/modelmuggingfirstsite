# Model Mugging — Next.js frontend (`mmwebsite`)

## Setup

```bash
cp .env.local.example .env.local
# Set NEXT_PUBLIC_MM_API and MM_API_URL to your Spring API (e.g. http://127.0.0.1:8080)
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 16** (App Router, SSR/ISR for schedule & home)
- **Tailwind CSS 4**
- **REST** → `mmbackend` (`/api/v1/courses/*`, `/api/v1/auth/*`)

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home + featured classes from API |
| `/schedule` | Full list, location filter |
| `/classes/[id]` | Course detail, SEO, JSON-LD Event |
| `/training`, `/about`, `/trainers`, `/contact` | Content |
| `/register`, `/login` | JWT auth against API |

Build works **without** the API running (empty schedule + graceful fallback).
