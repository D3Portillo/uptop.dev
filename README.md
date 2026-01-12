# UpTop Job Board

Started as an experiment with [Firecrawl](https://www.firecrawl.dev/) (a $10M+ valued YC company) that failed to parse a simple Notion page for [UpTop's Job Board](https://uptop.notion.site/job-board) where a friend works. That failure turned into this AI-assisted weekend project.

## Stack

- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS v4
- Upstash Redis
- OpenAI (Vercel AI SDK)
- Puppeteer + Chromium
- Jotai, SWR, Viem

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token
- `OPENAI_API_KEY` - Your OpenAI API key

## Learnings

- Heavy client and backend caching to avoid rate-limits and scraper limitations
- Running Puppeteer inside serverless functions is tight but works with the right constraints
- Mutex-based approach keeps the data alive as users visit—each client call updates granular components instead of bulk scraping

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.
