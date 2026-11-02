# BESTFIT Gate 1 — submission-grade demo

**Winning Moment:** **Wear the outfit. Keep your best face.**

This is a minimal web app around the exact YouCam flow already proven live:

```text
SOURCE_POSE + GARMENT
    ↓
POST /s2s/v2.0/task/cloth-v4
GET  /s2s/v2.0/task/cloth-v4/{task_id}
    ↓
CLOTHES_VTO

CLOTHES_VTO
    ↓
POST /s2s/v2.0/task/retake/pre-process { src_file_id }
GET  /s2s/v2.0/task/retake/pre-process/{task_id}
    ↓
1 source face confirmed

CLOTHES_VTO result URL + FAVORITE_SELFIE
    ↓
POST /s2s/v2.0/task/retake
{
  src_file_url,
  ref_file_ids: [ ... ],
  face_mapping: [{ index: 0, position: 0 }]
}
GET /s2s/v2.0/task/retake/{task_id}
    ↓
BESTFIT_FINAL
```

No backend framework and no npm dependencies are required. Node 18+ is enough.

## Run

```powershell
Copy-Item .env.example .env
notepad .env
```

Set:

```env
YOUCAM_API_KEY=...
```

Then:

```powershell
npm run doctor
npm start
```

Open `http://127.0.0.1:4173`.

## Demo flow
1. Upload **Best pose**
2. Upload **Garment**
3. Upload **Favorite expression**
4. Click **Try the outfit**
5. Inspect Clothes VTO
6. Click **Keep my best face**
7. Show the final proof receipt

## Scope lock
IN: 3 uploads, Clothes VTO, Retake preprocess, Retake, local proof receipt, before/after.
OUT: auth, DB, catalog, checkout, LLM, agent, recommendations, analytics.

## Gate 2 additions (v0.2)

- Judge Demo button with the validated sample assets
- Three-stage proof: **Source pose → Clothes VTO → BESTFIT final**
- Explicit “Preferred expression restored” final-state badge
- Product-value explanation before technical proof
- Collapsible proof receipt instead of making raw IDs the main story
- Start-over control
- No new YouCam APIs or backend scope

## Gate 3 visual polish (v0.3)

- Editorial / fashion-tech visual direction
- Compact premium hero
- Clearer 3-input composition
- Stronger primary/secondary CTA hierarchy
- Elevated final-result treatment
- Cleaner problem/magic storytelling
- No backend or API changes

## Gate 4 color polish (v0.4)

Palette:
- warm ivory base
- deep black
- acid lime
- coral
- electric blue
- muted pink for expression cues

Color is used semantically:
- coral = pose/source
- blue = garment / Clothes
- pink = expression
- lime = final BESTFIT / success

No backend or API changes.

## v0.4.1 UX fix

Before Retake:
- the final card now shows an explicit “Final not generated yet” state;
- the Proof Receipt is visible as pending instead of disappearing.

After Retake success:
- BESTFIT_FINAL is revealed;
- “Preferred expression restored” is shown;
- the real Proof Receipt becomes available.

No backend/API changes.

## v0.4.2 logo integration

- Adds the transparent BESTFIT logo to the top navigation.
- Adds a smaller logo treatment in the footer.
- Uses a tightly cropped transparent PNG for clean sizing.
- Backend/API behavior remains unchanged.


## v0.5 — Vercel deployment

This version is stateless and Vercel-ready. See `VERCEL_DEPLOY.md`.

Public deployments default to Judge Demo protection (`BESTFIT_PUBLIC_MODE=judge`) so arbitrary visitors cannot spend YouCam credits.
