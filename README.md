# AI Daily — Public Site (Articles + Podcasts)

A ready-to-deploy Next.js + Tailwind site that shows fresh AI content (articles, newsletters, research, **and podcasts**). A GitHub Action builds a JSON feed daily from RSS/Atom sources.

## One‑time Setup
1. Create **GitHub** and **Vercel** accounts.
2. Create a new GitHub repo and push this folder (or upload the zip contents).
3. In Vercel: **New Project → Import GitHub Repo → Deploy** (defaults are fine).

## Daily Updates
- The GitHub Action runs on a schedule and executes `npm run build:digest`, which fetches RSS feeds and writes `public/api/ai-digest.json`.
- The site reads `/api/ai-digest.json`. If it's missing, it shows sample data.

## Local Dev
```bash
npm i
npm run dev
# open http://localhost:3000
```
Run the fetcher manually:
```bash
npm run build:digest
```

## Change Sources
Edit `scripts/build-digest.mjs`. Feeds included by default:
- arXiv (cs.AI, cs.CL)
- Import AI (Substack)
- Hugging Face Blog
- Google AI Blog
- Stanford HAI (YouTube channel)
- TWIML AI Podcast (RSS)

You can add more — copy an entry and set `type` = `article | newsletter | research | presentation | podcast`.

## Timezone
The cron is set at `23:00 UTC` so India sees a fresh feed early morning. Adjust in `.github/workflows/build-digest.yml` if needed.

## Notes
- No server required; it's static hosting.
- If a source requires an API key, prefer its RSS instead.
- For podcasts, many shows publish standard RSS feeds that are easy to parse.
