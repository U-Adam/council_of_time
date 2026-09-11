# The Council of Time

Cloudflare-first rebuild of The Council of Time: a mobile-first deliberative round table for difficult questions.

## Architecture

- React + Vite front end
- Cloudflare Worker API at `/api/council`
- Workers AI binding (default: Gemma 4 26B A4B)
- No server-side conversation database
- Curated source IDs rendered as clickable citations
- Explicit fault-line pause state via `PAUSE_QUESTION`

## Local development

```bash
npm install
npm run dev
```

Workers AI calls require Cloudflare authentication because the AI binding is remote.

## Deploy

```bash
npx wrangler login
npm run deploy
```

The first deployment should remain on the Workers Free plan. That creates a natural hard cost ceiling: once the daily Workers AI free allocation is exhausted, AI requests fail rather than generating paid inference charges.

## Privacy design

The application does not persist conversations in a database and does not log request bodies. The browser sends a short rolling transcript with each request so multi-turn reasoning works without server-side chat history.

## Migration policy

Do not delete the old Vercel Council projects until this build has passed production smoke tests and the custom domain has been moved successfully.
