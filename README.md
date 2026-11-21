# 🍳 SnapRecipe (VibeBuild)

Snap a photo of any dish on your phone and get an AI-estimated recipe.
Built with Next.js 15 + Gemini 2.5 Flash, deployed on Vercel.

**Live:** _TBD (Member C adds the URL)_
**Team plan / who owns what:** [task.md](./task.md)

---

## 🛠 Setup for developers & agents

### 1. Prerequisites
| Tool | Version | Check | Install |
|---|---|---|---|
| Node.js | **20 or newer** (22 LTS recommended) | `node -v` | https://nodejs.org or `brew install node` / `nvm install 22` |
| npm | 10+ (ships with Node) | `npm -v` | comes with Node |
| Git | any | `git --version` | `brew install git` / https://git-scm.com |

No Python, GPU, or ML libraries are needed. The AI runs on Google's Gemini API.

### 2. Clone & install dependencies
```bash
git clone <repo-url>
cd VibeBuilders
npm install          # installs everything from package-lock.json (use `npm ci` for an exact, clean install)
```

What gets installed (already listed in `package.json`, so **don't install these individually**):

| Package | Type | Purpose |
|---|---|---|
| `next@15` | dependency | React framework, API routes, Vercel deploy target |
| `react@19`, `react-dom@19` | dependency | UI |
| `typescript@5` | dev | type checking |
| `@types/react`, `@types/react-dom`, `@types/node` | dev | type definitions |

There's no Gemini SDK. We call the Gemini REST API with the built-in `fetch`.

### 3. Environment variables
```bash
cp .env.example .env.local
```
| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | **yes** | Free key: https://aistudio.google.com/apikey. **Never commit it**; `.env.local` is gitignored |
| `GEMINI_MODEL` | no | defaults to `gemini-3.6-flash` (falls back to `gemini-3.5-flash`, then `-lite`) |

Every request goes to the Gemini API. Without `GEMINI_API_KEY`, `/api/recipe` returns the error "Server is not configured for AI yet."

### 4. Run
```bash
npm run dev          # http://localhost:3000
npm run dev:phone    # binds 0.0.0.0, so on your phone (same Wi-Fi) open http://<laptop-ip>:3000
                     # find the IP with: ipconfig getifaddr en0   (macOS)
```
The camera button works over plain HTTP on your LAN because it uses a native file input.

### 5. Before you push / merge
```bash
npm run typecheck    # tsc --noEmit
npm run build        # production build, same as Vercel runs
```

### Adding a dependency
Don't, unless you need to. If you do: `npm install <pkg>`, commit **both** `package.json` and `package-lock.json`, and tell the team to run `npm install` after pulling.

### Troubleshooting
- **`EACCES` / permission errors from npm:** run `sudo chown -R $(id -u):$(id -g) ~/.npm`, or use a temp cache: `npm_config_cache=/tmp/npm-cache npm install`
- **Port 3000 in use:** `npm run dev -- -p 3001`
- **Phone can't connect:** make sure both devices are on the same Wi-Fi, use `dev:phone`, and check the macOS firewall
- **"Server is not configured for AI yet":** `GEMINI_API_KEY` is missing. Add it to `.env.local` (local) or Vercel env vars (prod), then restart or redeploy

---

## 🚀 Deploy (Vercel)
1. Push to GitHub, then import the repo at https://vercel.com/new (Next.js is auto-detected, no config needed)
2. Settings → Environment Variables → add `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.6-flash` (Production + Preview). **Required**, there is no mock fallback
3. Deploy. Every push to `main` redeploys; PRs get preview URLs.

## How it works
```
Phone camera (<input capture="environment">) → resize to 1024px JPEG in browser
  → POST /api/recipe (Vercel serverless function) → Gemini 2.5 Flash (vision + JSON schema)
  → Recipe JSON → RecipeCard
```

## Project structure
```
src/
  types/recipe.ts            shared contract (frozen)
  app/page.tsx               main screen (C)
  app/layout.tsx, globals.css (C)
  app/api/recipe/route.ts    POST endpoint (B)
  components/CameraCapture.tsx (A)
  components/RecipeCard.tsx  (C)
  lib/image.ts               client image resize (A)
  lib/gemini.ts, prompt.ts, ai/validate.ts, api.ts (B)
public/                      manifest + icons (C)
```
