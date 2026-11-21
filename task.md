# SnapRecipe — 1-Hour Build Plan

**Goal:** A mobile web app. Snap a photo of food with your phone camera → get an AI-estimated recipe → deployed on Vercel.

**Stack:** Next.js 15 (App Router, TypeScript) · Gemini 2.5 Flash (free tier, vision + JSON mode) · Vercel

**Why Gemini instead of our own model:** Vercel serverless functions have no GPU and strict bundle-size limits, so hosting a vision model there isn't realistic. Gemini Flash is free, handles images, and returns JSON that follows a schema we define. Get a key at https://aistudio.google.com/apikey.

## What the boilerplate gives you
The skeleton **already runs end to end in mock mode**: tap "Take a photo" → `/api/recipe` returns a canned Margherita Pizza recipe → it renders. Everything else is a stub marked `TODO(<task-id>)` in the code. Find your tasks with:
```bash
grep -rn "TODO(A" src   # Member A   (use TODO(B / TODO(C for the others)
```

---

## Ground rules (read before prompting your agent)

1. **Stay in your own files.** Each member owns a fixed set of files (below). Your agent must not edit anyone else's files. If you need a change in someone else's file, message that person.
2. **`src/types/recipe.ts` is the shared contract.** It's frozen. Change it only if all 3 agree, and announce it in the group chat.
3. **Mock mode:** if `GEMINI_API_KEY` is unset or `MOCK_AI=1`, `/api/recipe` returns the canned recipe. Members A and C never need a key. Member B: keep `MOCK_AI=1` until B1 is done.
4. **Branch per member:** `feat/capture` (A), `feat/ai` (B), `feat/display` (C). Open small PRs into `main` and merge at each checkpoint.
5. **Don't touch** `package.json` / `package-lock.json` without telling the team. If you add a dependency, announce it so the others run `npm install` after merging.
6. Run `npm run typecheck && npm run build` before every merge.

Setup steps are in [README.md](./README.md#-setup-for-developers--agents).

---

## File ownership map

| File | Owner |
|---|---|
| `src/types/recipe.ts` | **SHARED (frozen)** |
| `src/components/CameraCapture.tsx` | A |
| `src/lib/image.ts` | A |
| `src/app/api/recipe/route.ts` | B |
| `src/lib/gemini.ts` | B |
| `src/lib/prompt.ts` | B |
| `src/lib/mock.ts` | B |
| `src/lib/api.ts` | B |
| `src/app/page.tsx` | C (integration) |
| `src/app/layout.tsx` | C |
| `src/app/globals.css` | C |
| `src/components/RecipeCard.tsx` | C |
| `public/*` (manifest, icons) | C |
| `README.md`, Vercel project/settings | C |

New files go in your own area: `src/components/capture/*` (A), `src/lib/ai/*` (B), `src/components/recipe/*` (C).

---

## 👤 Member A — Camera & Capture (Frontend input)

**Owns:** `src/components/CameraCapture.tsx`, `src/lib/image.ts`, new `src/components/capture/*`

| ID | Task | Priority |
|---|---|---|
| A1 | Run `npm run dev:phone` and confirm the camera opens on a real iPhone and Android | Must |
| A2 | `image.ts`: resize to max 1024px and re-encode as JPEG ~0.8 with `createImageBitmap` + canvas. **Without this, real phone photos exceed Vercel's 4.5 MB limit** | **Must, do first** |
| A3 | Handle HEIC, EXIF orientation, and `createImageBitmap` failure (fall back to `<img>` + canvas) | Must |
| A4 | Add a "Choose from library" button (second input without `capture`) | Should |
| A5 | Preview with **Retake / Use photo** before calling `onCapture` | Should |
| A6 | Error message state, accessibility labels, large touch targets | Should |
| A7 | *(Stretch)* Live viewfinder with `getUserMedia` (HTTPS only, so test on the Vercel URL), keeping the file input as fallback | Stretch |

**Done when:** a phone photo reaches `onCapture` as a ≤1024px JPEG data URL under ~500 KB, on iOS Safari and Android Chrome.

**Agent prompt:**
```
You are working on SnapRecipe (Next.js 15, TypeScript). Read task.md, README.md, and src/types/recipe.ts.
You are Member A. You may ONLY create/edit: src/components/CameraCapture.tsx, src/lib/image.ts,
and new files under src/components/capture/. Do NOT edit any other file, package.json included.
Keep the CameraCapture props ({ disabled?: boolean; onCapture: (dataUrl: string) => void }) unchanged.
Implement the TODO(A2)…TODO(A6) items in order (`grep -rn "TODO(A" src`), with no new dependencies.
After each task run `npm run typecheck && npm run build`.
```

---

## 👤 Member B — AI & Backend (Gemini API route)

**Owns:** `src/app/api/recipe/route.ts`, `src/lib/gemini.ts`, `src/lib/prompt.ts`, `src/lib/mock.ts`, `src/lib/api.ts`, new `src/lib/ai/*`

| ID | Task | Priority |
|---|---|---|
| B0 | Get a free Gemini key → `.env.local` (`GEMINI_API_KEY=...`, `MOCK_AI=1` until B1 works) | **Must, do first** |
| B1 | `gemini.ts`: implement `generateRecipeFromImage` (REST hints are in the file), and finish `RECIPE_SCHEMA` in `prompt.ts` so it mirrors the `Recipe` type | **Must** |
| B2 | Tune `RECIPE_PROMPT` with 5+ test images (pizza, salad, curry, non-food, blurry) | Must |
| B3 | Validate the Gemini output at runtime (hand-written guard, or zod if you announce the dep). Fill in defaults and clamp numbers | Should |
| B4 | Errors: 413 for oversized images, 429 rate limit message, safety blocks, 25s timeout via `AbortController` | Should |
| B5 | Give the key to Member C **by DM** for Vercel env vars. Never commit it | Must |
| B6 | *(Stretch)* Fallback model chain: `gemini-2.5-flash` → `gemini-2.5-flash-lite` on 429/5xx | Stretch |

**Done when:** with `MOCK_AI=0`, a real photo returns a schema-valid recipe, non-food returns `isFood: false`, and every error is `{ ok: false, error }`.

Quick test without the UI:
```bash
IMG=$(base64 -i test.jpg | tr -d '\n')
curl -s localhost:3000/api/recipe -H 'content-type: application/json' \
  -d "{\"image\":\"data:image/jpeg;base64,$IMG\"}"
```

**Agent prompt:**
```
You are working on SnapRecipe (Next.js 15, TypeScript). Read task.md, README.md, and src/types/recipe.ts.
You are Member B. You may ONLY create/edit: src/app/api/recipe/route.ts, src/lib/gemini.ts,
src/lib/prompt.ts, src/lib/mock.ts, src/lib/api.ts, and new files under src/lib/ai/. Do NOT edit any other file.
The API must keep returning the RecipeResponse type from src/types/recipe.ts.
Never log, print, or commit GEMINI_API_KEY. Use the Gemini REST API via fetch (no SDK) unless told otherwise.
Implement TODO(B1)…TODO(B4) (`grep -rn "TODO(B" src`), then run `npm run typecheck && npm run build`.
```

---

## 👤 Member C — Recipe Display, UX & Deploy (Integration owner)

**Owns:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/RecipeCard.tsx`, `public/*`, `README.md`, the Vercel project, new `src/components/recipe/*`

| ID | Task | Priority |
|---|---|---|
| C1 | **Deploy in the first 10 min:** push to GitHub → https://vercel.com/new → import the repo → Deploy (works in mock mode) | **Must, do first** |
| C2 | Vercel → Settings → Environment Variables: add `GEMINI_API_KEY` (Production + Preview), then redeploy | Must |
| C3 | `RecipeCard`: meta pills (servings, total time, cuisine, confidence), tips, AI disclaimer, plus styling polish and dark mode in `globals.css` | Must |
| C4 | `page.tsx`: loading spinner/skeleton, nicer errors, "Snap another" reset. `RecipeCard`: ingredient checkboxes, tap-to-cross-off steps, Share/Copy (`navigator.share`) | Should |
| C5 | Low-confidence warning banner | Should |
| C6 | PWA: 192/512 PNG icons in `public/` and an updated manifest, so Add to Home Screen works | Should |
| C7 | Final test on 2 real phones against the production URL, then add the live link to the README | Must |

**Done when:** the production Vercel URL works end to end on a phone with real AI results.

**Agent prompt:**
```
You are working on SnapRecipe (Next.js 15, TypeScript). Read task.md, README.md, and src/types/recipe.ts.
You are Member C. You may ONLY create/edit: src/app/page.tsx, src/app/layout.tsx, src/app/globals.css,
src/components/RecipeCard.tsx, files in public/, README.md, and new files under src/components/recipe/.
Do NOT edit CameraCapture.tsx, anything in src/lib/, or the API route. Mobile-first, plain CSS, no new dependencies.
Implement TODO(C3)…TODO(C6) (`grep -rn "TODO(C" src`), then run `npm run typecheck && npm run build`.
```

---

## ⏱ Timeline (60 min)

| Time | Checkpoint |
|---|---|
| 0–5 | Everyone: clone, `npm install`, `npm run dev`. C: C1 (first Vercel deploy) |
| 5–25 | A1–A3 · B0–B2 · C2–C3 |
| **25** | **Checkpoint 1:** merge to `main` (order B → A → C), Vercel auto-deploys, test on a phone |
| 25–45 | A4–A6 · B3–B5 · C4–C6 |
| **45** | **Checkpoint 2:** merge to `main`, real-AI test on production |
| 45–55 | Bug bash on real phones; fixes stay in each owner's files |
| 55–60 | Demo prep; C7 (live URL in README) |

C merges last because `page.tsx` integrates everything. Vercel deploys whatever is on `main`, so never merge a red build.
