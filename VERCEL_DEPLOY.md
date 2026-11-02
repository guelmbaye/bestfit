# Deploy BESTFIT on Vercel

This v0.5 build is stateless across requests and is safe for Vercel Functions.

## Recommended public configuration

Use Judge Demo protection so a public URL cannot burn YouCam credits through arbitrary uploads:

```env
BESTFIT_PUBLIC_MODE=judge
```

In this mode, only the three built-in validated Judge Demo assets can trigger YouCam generation. Custom uploads still work when you run the repo locally with:

```env
BESTFIT_PUBLIC_MODE=open
```

## Deploy with CLI

```powershell
npm i -g vercel
vercel login
vercel
```

When Vercel links the project, add environment variables in the dashboard or CLI:

```powershell
vercel env add YOUCAM_API_KEY production
vercel env add BESTFIT_PUBLIC_MODE production
```

Use `judge` for BESTFIT_PUBLIC_MODE. Then deploy production:

```powershell
vercel --prod
```

Vercel detects `src/server.mjs` as a Node server. No build command is needed.

## Deploy from GitHub

1. Push this folder to a public GitHub repository.
2. Import it at https://vercel.com/new.
3. Framework preset: leave auto-detect / Other if asked.
4. Add `YOUCAM_API_KEY` and `BESTFIT_PUBLIC_MODE=judge` in Environment Variables.
5. Deploy.

## Why v0.5 differs from the local build

- No `runs/` state is required between requests.
- The Clothes response returns an opaque session object to the browser.
- Retake sends that session back on the next request.
- Generated images are displayed from temporary YouCam result URLs.
- Large browser images are resized before upload to stay below Vercel's request-body limit.
- Public Judge Demo mode protects paid YouCam credits.
