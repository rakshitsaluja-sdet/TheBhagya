# TheBhagya — Continuation Prompt
# Last updated: July 9, 2026

Paste everything below this line into a new Claude Cowork session to resume exactly where we left off.

---

## PROJECT IDENTITY

**TheBhagya** (brand name: **Bhagya**) — AI-native Vedic astrology platform, similar to AstroTalk/AstroSage.
Built by Rakshit Saluja. Claude is the co-developer.

**CRITICAL RULE:** The AlgoMind codebase at `C:\Users\Admin\OneDrive\Documents\ABC\TT` is READ ONLY. Never modify it without explicit instruction from Rakshit.

**NO personal details** in testimonials or sample data — use random fictional names only.

---

## CODEBASE LOCATION

Local: `C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI`
GitHub: `https://github.com/rakshitsaluja-sdet/TheBhagya` (public, branch: `master`)

---

## LIVE DEPLOYMENT

| Layer     | URL                                                         | Status      |
|-----------|-------------------------------------------------------------|-------------|
| Frontend  | `https://the-bhagya.vercel.app`                             | ✅ Vercel   |
| Backend   | `https://thebhagya-backend-production.up.railway.app`       | ✅ Railway  |
| Database  | Supabase PostgreSQL — `db.hngsrnuhfafbqqxgnule.supabase.co` | ✅ Live     |

---

## TECH STACK

- **Frontend:** React 18 + Vite + React Router v6, inline styles, CSS variables (Celestial Aurum v2 design system)
- **Backend:** FastAPI (async) + SQLAlchemy 2.0 + asyncpg
- **Database:** PostgreSQL via Supabase (prod) / SQLite aiosqlite (local fallback)
- **Auth:** JWT — `bhagya_token` (users) + `bhagya_admin_token` (admin)
- **Astrology engine:** pyswisseph (Swiss Ephemeris), sidereal/Lahiri ayanamsa

### Design System — Celestial Aurum v2
```
--gold: #DFA84F  --gold-light: #F2CB84  --violet: #8B6FE8
--bg-deep: #07060F  --bg-card: rgba(19,15,36,0.72)  --bg-elevated: #1B1533
```
Fonts: Fraunces (headings), Inter (body), JetBrains Mono (labels/mono)

---

## COMPLETED FEATURES (as of July 9, 2026)

| Feature | Backend | Frontend | Live |
|---|---|---|---|
| Free Kundali (natal chart) | ✅ | ✅ | ✅ |
| Vimshottari Dasha timeline | ✅ | ✅ | ✅ |
| Ashtakavarga | ✅ | ✅ | ✅ |
| Daily Horoscope (12 signs, transit) | ✅ | ✅ | ✅ |
| Sade Sati Report | ✅ | ✅ | ✅ |
| Mangal Dosha + Kaal Sarp Dosha | ✅ | ✅ | ✅ |
| Kundli Matching (36-guna Ashtakoot) | ✅ | ✅ | ✅ |
| Lal Kitab (Pucca Ghar + remedies) | ✅ | ✅ | ✅ |
| Numerology (Pythagorean + Chaldean) | ✅ | ✅ | ✅ |
| Destiny Chat (AI, Anthropic) | ✅ | ✅ | ⚠️ BROKEN (missing ANTHROPIC_API_KEY on Railway) |
| PDF Report export | ✅ | ✅ | ⚠️ unverified |
| Panchang & Muhurat (5 limbs + Rahu Kaal + Abhijit) | ✅ | ✅ | ✅ |
| Gemstones Recommendation | — (pure frontend) | ✅ | ✅ |
| Varshphal (Annual Horoscope / Solar Return) | ✅ | ✅ | ⏳ deploying |
| Admin Dashboard | ✅ | ✅ | ✅ |
| Login / JWT auth + OTP | ✅ | ✅ | ✅ |
| Razorpay billing (3 plans) | ✅ | ✅ | ⚠️ plan activation not wired |
| Palmistry (placeholder page) | — | ✅ | ✅ |

---

## KEY FILE LOCATIONS

### Backend
```
backend/app/main.py                          — FastAPI app, all router includes
backend/app/core/jyotish/engine.py           — Swiss Ephemeris wrapper
backend/app/core/jyotish/nakshatra.py        — Nakshatra + dasha computations
backend/app/core/jyotish/panchang.py         — Panchang engine (5 limbs + muhurats)
backend/app/core/jyotish/varshphal.py        — Varshphal solar return engine
backend/app/api/v1/panchang.py               — POST /v1/panchang/compute
backend/app/api/v1/varshphal.py              — POST /v1/varshphal/compute
```

### Frontend
```
frontend/src/App.jsx                         — Routes for all pages
frontend/src/components/Navbar.jsx           — TOOL_LINKS + T object (must update both when adding features)
frontend/src/components/Footer.jsx           — COLS Tools column
frontend/src/pages/Landing.jsx               — FEATURES array (bento grid cards)
frontend/src/hooks/useApi.js                 — All API fetch functions (BASE URL auto-detects dev/prod)
frontend/src/pages/Panchang.jsx              — Panchang page
frontend/src/pages/Gemstones.jsx             — Gemstones recommendation (pure frontend)
frontend/src/pages/Varshphal.jsx             — Varshphal annual horoscope page
```

### Key docs
```
COMPETITIVE_GAP_ANALYSIS.md                 — Feature gap vs AstroTalk/AstroSage
CREDENTIALS.md                               — All credentials (Supabase, Railway, Vercel, Razorpay)
CONTINUATION_PROMPT.md                       — This file
```

---

## WIRING CHECKLIST (when adding any new feature page)

1. `backend/app/core/jyotish/<feature>.py` — computation engine
2. `backend/app/api/v1/<feature>.py` — FastAPI router
3. `backend/app/main.py` — import router + `app.include_router(...)`
4. `frontend/src/pages/<Feature>.jsx` — React page
5. `frontend/src/hooks/useApi.js` — `export async function compute<Feature>(data)`
6. `frontend/src/App.jsx` — import + `<Route path="/<feature>" element={<Feature />} />`
7. `frontend/src/components/Navbar.jsx` — add to T object + TOOL_LINKS + mobile drawer
8. `frontend/src/pages/Landing.jsx` — add to FEATURES array
9. `frontend/src/components/Footer.jsx` — add to Tools column in COLS

**OneDrive sync lag:** After Write/Edit tool writes a file, wait ~10s before running git add or the file may not appear on disk yet. Always `git add <specific-files>` rather than `git add -A` for new pages.

---

## TECH DEBT (must fix before public launch)

| Issue | Priority | Where to fix |
|---|---|---|
| `ANTHROPIC_API_KEY` missing on Railway → Destiny Chat broken | 🔴 HIGH | Railway → Environment Variables |
| `SECRET_KEY = "replace-me-before-launch"` | 🔴 HIGH | Railway env var |
| Razorpay plan activation not wired after payment | 🟡 MED | payments.py + frontend |
| Razorpay live keys (currently test) | 🟡 MED | Railway env vars |
| `ALLOWED_ORIGINS` on Railway (add vercel domain) | 🟡 MED | Railway env var |
| Shared `get_current_user` FastAPI dependency (auth inconsistency) | 🟢 LOW | auth.py |

---

## PENDING FEATURES (next priority order)

1. **Transit / Gochar Report** — current transits on natal chart (both datasets already exist)
2. **Tarot** — pure frontend, card draw + meaning lookup
3. **Vastu Shastra** — basic tool
4. **Blog / Content CMS** — Markdown-based, SEO entry points
5. **Human Astrologer Marketplace** — Phase 2, highest build cost

---

## PROACTIVE IMPROVEMENT MANDATE (added July 2026)

Claude should think several steps ahead of the user and **proactively propose and execute** fixes without waiting to be asked. This applies to:

- **UI/UX issues visible in screenshots** — spacing, overflow, font size, responsiveness
- **Performance** — unnecessary re-renders, large bundle imports, missing lazy loading
- **Code quality** — dead code (e.g. unused CITIES arrays after CitySearch migration), missing error boundaries
- **Feature completeness** — e.g. when adding a page, immediately check Navbar/Landing/Footer wiring
- **Security/reliability** — missing env vars, hardcoded secrets, broken Railway env
- **Conversion / growth** — CTA placement, social proof section, pricing copy

When Rakshit shares a screenshot or describes a problem, Claude should fix the obvious issue AND flag 2–3 related improvements Claude noticed while working on it, phrased as: "While I was in there, I also noticed X — should I fix that too?"

**Do not wait to be instructed on things that are clearly broken or clearly improvable.**

---

## VIMSHOTTARI DASHA TIMELINE (Rakshit Saluja — for reference)

- Rahu Mahadasha: 2025–2043
- Rahu/Rahu: Jan 2025 – Sept 2027
- Rahu/Jupiter: Sept 2027 – Feb 2030
- Rahu/Saturn: Feb 2030 – Dec 2032
- Rahu/Mercury: Dec 2032 – Jul 2035
- Rahu/Ketu: Jul 2035 – Jul 2036 (cautious stretch)
- Rahu/Venus: Jul 2036 – Jul 2039

---

## GIT WORKFLOW

```powershell
cd "C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI"

# Always work on master directly for now
git add <specific files>
git commit -m "feat: ..."
git push
# Vercel auto-deploys from master; Railway auto-deploys backend
```

**Never use `git add -A`** — OneDrive sometimes shows stale files that git will pick up incorrectly. Always stage specific files.

---

## TEST ACCOUNTS

| Plan | Email | Password |
|---|---|---|
| Starter (free) | free@thebhagya.com | Test@free1 |
| Pro | pro@thebhagya.com | Test@pro1 |
| Jyotish | jyotish@thebhagya.com | Test@jyotish1 |
| Admin | admin@thebhagya.com | TheBhagya@Admin2024 |
