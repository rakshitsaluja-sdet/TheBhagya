# BhagyaAI — Continuation Prompt
# Last updated: July 11, 2026 (Session 3)

Paste everything below this line into a new Claude Cowork session to resume exactly where we left off.

---

## PROJECT IDENTITY

**BhagyaAI** (brand name: **Bhagya**) — Vedic astrology platform, similar to AstroTalk/AstroSage.
Built by Rakshit Saluja. Claude is the co-developer and orchestrator of all agent workflows.

**CRITICAL RULES:**
- The AlgoMind codebase at `C:\Users\Admin\OneDrive\Documents\ABC\TT` is **READ ONLY**. Never modify it without explicit instruction from Rakshit.
- **No personal details** in testimonials or sample data — use random fictional names only.
- No words like "Engine", "AI", "automated", "computed" in user-facing copy.
- Do not make one feature superior to others — no FLAGSHIP/AI-NATIVE tags.
- Claude should think far ahead and proactively propose/execute fixes without being asked.

---

## MULTI-AGENT OPERATING MODEL (adopted July 11, 2026)

Going forward all development runs via parallel agents — not sequential. Claude orchestrates 5 agent roles simultaneously:

| Agent | Responsibility |
|---|---|
| **Dev Agent** | Feature build, bug fixes, git push. Fastest lane. |
| **QA Agent** | Playwright specs updated every time a feature ships. k6 perf tests run monthly. Autonomous — no manual test writing needed. |
| **R&D Agent** | Scans GitHub weekly for relevant OSS MVPs, tracks competitor features, surfaces integration candidates. |
| **Marketing Agent** | SEO, blog content calendar, social templates, landing page copy. Every new feature gets a blog article + social post. |
| **Sales Agent** | Funnel drop-off analysis, upgrade nudge copy, Razorpay webhook tracking, pricing experiments, KPI dashboard. |

**OSS tools being evaluated for integration** (R&D Agent task #118):
- **PostHog** (50k ⭐) — self-hosted analytics + feature flags + session recording
- **Listmonk** (15k ⭐) — self-hosted email newsletters (weekly horoscope digests, upgrade emails)
- **GrowthBook** (6k ⭐) — feature flags + A/B testing
- **Chatwoot** (21k ⭐) — open-source live chat/support widget
- **Cal.com** (32k ⭐) — consultation scheduling (if live astrologer tier is added)

**Core USP being developed** (task #119):
AstroTalk charges ₹10–50/min for human astrologers. Bhagya's edge: Swiss Ephemeris precision, multi-system (Vedic + KP + Nadi + Lal Kitab) in one place, no human middleman, fraction of the cost. This angle drives all product, marketing and sales decisions.

---

## CODEBASE LOCATION

Local: `C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI`
GitHub: `https://github.com/rakshitsaluja-sdet/TheBhagya` (public, branch: `master`)

---

## LIVE DEPLOYMENT

| Layer    | URL                                                         | Status |
|----------|-------------------------------------------------------------|--------|
| Frontend | `https://the-bhagya.vercel.app`                             | ✅ Vercel auto-deploy |
| Backend  | `https://thebhagya-backend-production.up.railway.app`       | ✅ Railway — stable as of July 11, 2026 |
| Database | Supabase PostgreSQL — `db.hngsrnuhfafbqqxgnule.supabase.co` | ✅ Live |

**Railway start command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
**Health check:** `GET /health` → `{"status":"ok","service":"TheBhagya","version":"2.0.0"}`

### Railway deployment history (important context)
- Jul 9 deployment `d803dc1b` was the last stable one before today's fixes
- Today's fixes required 4 push cycles to clear cascading import errors:
  1. `backend/app/api/v1/transit.py` — `from app.core` → `from backend.app.core`
  2. `backend/app/api/v1/muhurat.py` — same prefix fix
  3. `backend/app/db/models.py` — duplicate `EmailOTP` + `BlogPost` classes (OneDrive sync corruption)
  4. `backend/app/core/jyotish/muhurat.py` — `from app.core.jyotish.panchang` → `from backend.app.core.jyotish.panchang`
  5. `backend/app/api/v1/blog.py` — `status_code=204` on DELETE → `200` (FastAPI strict body check)
- **Rule going forward:** any new file importing from the jyotish core must use `from backend.app.core.jyotish.*` not `from app.core.*`

---

## TECH STACK

- **Frontend:** React 18 + Vite + React Router v6, inline styles only (no CSS files, no Tailwind), CSS variables (Celestial Aurum v2)
- **Backend:** FastAPI (async) + SQLAlchemy 2.0 + asyncpg
- **Database:** PostgreSQL via Supabase (prod) / SQLite aiosqlite (local fallback)
- **Auth:** JWT — `bhagya_token` (users) + `bhagya_admin_token` (admin)
- **Astrology engine:** pyswisseph (Swiss Ephemeris), sidereal/Lahiri ayanamsa
- **SMS OTP:** MSG91 SendOTP (chosen provider — task #114 pending)

### Design System — Celestial Aurum v2
```
--gold: #DFA84F        --gold-light: #F2CB84    --violet: #8B6FE8
--bg-deep: #07060F     --bg-card: rgba(19,15,36,0.72)
--bg-elevated: #1B1533  --border, --shadow-card, --text-primary, --text-muted, --text-dim, --bg-input
```
Fonts: Fraunces (headings), Inter (body), JetBrains Mono (labels/mono)
Planet colors: `{ Sun:'#E57C3A', Moon:'#B0BEC5', Mars:'#E53935', Mercury:'#43A047', Jupiter:'#F9A825', Venus:'#90CAF9', Saturn:'#3949AB', Rahu:'#795548', Ketu:'#8D6E63' }`

---

## PLAN STRUCTURE (Free / Jyotish / Guru)

| Plan    | Price    | Auth      | Feature Keys in AuthContext |
|---------|----------|-----------|-----------------------------|
| Free    | ₹0       | LoginGate | chart, horoscope, panchang, dreams, biorhythm, vastu, gemstones |
| Jyotish | ₹299/mo  | PlanGate  | +kundli, sade-sati, doshas, numerology, lal-kitab, tarot, palmistry |
| Guru    | ₹799/mo  | PlanGate  | +chat, varshphal, transit, muhurat, pdf, kp, nadi |

**Gate components** (App.jsx):
- `LoginGate` — redirects to `/login` if not authenticated
- `PlanGate feature="<key>"` — redirects to `/pricing` if plan doesn't include feature

---

## COMPLETED FEATURES (as of July 11, 2026)

| Feature | Backend | Frontend | Gate | Notes |
|---|---|---|---|---|
| Free Kundali (natal chart) | ✅ | ✅ | LoginGate | |
| Vimshottari Dasha timeline | ✅ | ✅ | LoginGate | |
| Ashtakavarga | ✅ | ✅ | LoginGate | |
| Daily Horoscope | ✅ | ✅ | LoginGate | |
| Panchang | ✅ | ✅ | LoginGate | |
| Gemstones | — frontend | ✅ | LoginGate | |
| Biorhythm | — frontend | ✅ | LoginGate | |
| Dream Interpretation | — frontend | ✅ | LoginGate | 46 symbols, 9 categories |
| Vastu Shastra | — frontend | ✅ | LoginGate | |
| Sade Sati | ✅ | ✅ | Jyotish | |
| Mangal + Kaal Sarp Dosha | ✅ | ✅ | Jyotish | |
| Kundli Matching (36-guna) | ✅ | ✅ | Jyotish | |
| Lal Kitab | ✅ | ✅ | Jyotish | |
| Numerology | ✅ | ✅ | Jyotish | |
| Tarot | — frontend | ✅ | Jyotish | |
| Palmistry | — static | ✅ | Jyotish | Coming soon placeholder |
| Destiny Chat | ✅ | ✅ | Guru | ⚠️ BROKEN in prod — needs ANTHROPIC_API_KEY on Railway |
| Varshphal (Solar Return) | ✅ | ✅ | Guru | |
| Gochar / Transit | ✅ | ✅ | Guru | ✅ Live on Railway |
| Muhurat Finder | ✅ | ✅ | Guru | ✅ Live on Railway |
| Brihat Kundali PDF | ✅ | ✅ | Guru | 6-page reportlab report |
| KP System | ✅ | ✅ | Guru | ✅ Live on Railway |
| Nadi Astrology | ✅ | ✅ | Guru | ✅ Live on Railway |
| Blog / Jyotish Journal | ✅ | ✅ | Public | ✅ Live — Supabase posts table, 7 seed articles, /blog + /blog/:slug |
| Blog Admin Editor | ✅ | ✅ | Admin JWT | CRUD at /admin/blog |
| Admin Dashboard | ✅ | ✅ | Admin JWT | |
| Login / JWT + Email OTP | ✅ | ✅ | — | |
| Razorpay billing | ✅ | ✅ | — | ⚠️ plan activation not wired post-payment |

---

## KEY FILE LOCATIONS

### Backend
```
backend/app/main.py                              — FastAPI app, all 18 router includes
backend/app/db/models.py                         — ORM models: User, BirthChart, ChatSession, PageView, EmailOTP, BlogPost
backend/app/core/jyotish/engine.py               — Swiss Ephemeris wrapper
backend/app/core/jyotish/nakshatra.py            — Nakshatra + Vimshottari dasha
backend/app/core/jyotish/panchang.py             — Panchang (5 limbs, Rahu Kaal, Abhijit)
backend/app/core/jyotish/muhurat.py              — Muhurat scoring engine (imports from backend.app.core.jyotish.panchang)
backend/app/core/jyotish/transit.py              — Gochar engine
backend/app/core/jyotish/kp.py                   — KP System (sub-lord, Placidus cusps, significators)
backend/app/core/jyotish/nadi.py                 — Nadi Astrology (amsa, yogas, predictions)
backend/app/core/jyotish/doshas.py               — Mangal + Kaal Sarp Dosha
backend/app/core/jyotish/kundli_matching.py      — 8-koot Ashtakoot engine
backend/app/core/jyotish/varshphal.py            — Solar return engine
backend/app/core/pdf_report.py                   — Brihat Kundali PDF (reportlab, 6 pages)
backend/app/api/v1/blog.py                       — Blog CRUD (GET public; POST/PUT/DELETE/PATCH admin-gated)
backend/seed_blog_posts.sql                      — Supabase migration + 7 seed INSERTs
railway.toml                                     — startCommand = uvicorn backend.app.main:app
```

### Frontend
```
frontend/src/App.jsx                             — All routes + LoginGate + PlanGate
frontend/src/context/AuthContext.jsx             — PLAN_FEATURES matrix (free/jyotish/guru)
frontend/src/components/Navbar.jsx               — T object + TOOL_LINKS + mobile drawer
frontend/src/components/Footer.jsx               — COLS Tools column
frontend/src/components/CitySearch.jsx           — Nominatim autocomplete
frontend/src/pages/Landing.jsx                   — FEATURES bento grid, PLANS array
frontend/src/hooks/useApi.js                     — All API fetch functions
frontend/src/pages/Blog.jsx                      — Blog listing (/blog)
frontend/src/pages/BlogPost.jsx                  — Blog article (/blog/:slug)
frontend/src/pages/AdminBlog.jsx                 — Admin CRUD editor (/admin/blog)
frontend/src/pages/KPSystem.jsx                  — KP System (Guru)
frontend/src/pages/NadiAstrology.jsx             — Nadi Astrology (Guru)
```

### Key docs
```
COMPETITIVE_GAP_ANALYSIS.md                     — Feature gap vs AstroTalk/AstroSage
CREDENTIALS.md                                   — All credentials (Supabase, Railway, Vercel, Razorpay)
CONTINUATION_PROMPT.md                           — This file
```

---

## WIRING CHECKLIST (adding any new feature page)

1. `backend/app/core/jyotish/<feature>.py` — computation engine (**import prefix must be `from backend.app.core.jyotish.*`**)
2. `backend/app/api/v1/<feature>.py` — FastAPI router (`POST /v1/<feature>/compute`)
3. `backend/app/main.py` — import router + `app.include_router(..., prefix="/v1")`
4. `frontend/src/pages/<Feature>.jsx` — React page (inline styles, Celestial Aurum tokens)
5. `frontend/src/hooks/useApi.js` — `export const compute<Feature> = (data) => apiFetch(...)`
6. `frontend/src/App.jsx` — route with correct gate
7. `frontend/src/context/AuthContext.jsx` — add feature key to all 3 plan objects
8. `frontend/src/components/Navbar.jsx` — add to T + TOOL_LINKS + mobile drawer
9. `frontend/src/pages/Landing.jsx` — add to FEATURES array
10. `frontend/src/components/Footer.jsx` — add to Tools column

---

## PENDING TASKS (priority order)

### Infrastructure (blocks production quality)
- Railway: set `ANTHROPIC_API_KEY` → fixes Destiny Chat
- Railway: set `SECRET_KEY` to real secret (currently placeholder)
- Razorpay: wire plan activation post-payment (payments.py + AuthContext)

### Feature queue (numbered = Cowork task ID)
| # | Task | Notes |
|---|---|---|
| 11 | Domain decision — TheBhagya | thebhagya.com / bhagya.app |
| 77 | Run full Playwright suite — all projects | Not run since feat/testing branch |
| 106 | Cost breakdown document (Word) | Railway + Supabase + Vercel + MSG91 |
| 114 | Phone OTP login — MSG91 SendOTP | AstroTalk-style. Need MSG91 API key + DLT template. Backend: PhoneOTP model, send/verify endpoints. Frontend: Phone tab in Login.jsx, 4-box OTP, 60s resend. ₹0.25/OTP |
| 115 | Define multi-agent dev framework | Document agent roles, handoff rules, trigger conditions |
| 116 | Playwright — update with all post-July features | Blog, Transit, Muhurat, KP, Nadi, AdminBlog, Phone OTP |
| 117 | k6 performance testing — Railway backend | 50/200/500 concurrent users, p95 latency, bottleneck report |
| 118 | R&D Agent — GitHub OSS scan | PostHog, Listmonk, GrowthBook, Chatwoot, Cal.com — assess + recommend |
| 119 | USP & competitive differentiation analysis | Bhagya vs AstroTalk/Astroyogi/AstroSage. 3-5 core differentiators |
| 120 | Marketing Agent — SEO, content pipeline, social | Meta tags, sitemap, 10 more blog articles, social templates |
| 121 | Sales Agent — funnel, conversion, KPI dashboard | Drop-off analysis, upgrade nudges, Razorpay webhook tracking |

### Ongoing / low priority
- 20+ regional languages — react-i18next migration
- Footer badges: "Swiss Ephemeris" → "Ancient Precision", "Lahiri Ayanamsa" → "Vedic Tradition"
- Navbar `PLAN_COLORS`: old keys `starter`/`pro` → `free`/`jyotish`
- Add 10-15 more blog articles via admin panel (/admin/blog)

---

## TECH DEBT

| Issue | Priority | Fix location |
|---|---|---|
| `ANTHROPIC_API_KEY` missing on Railway | 🔴 HIGH | Railway → Environment Variables |
| `SECRET_KEY = "replace-me-before-launch"` | 🔴 HIGH | Railway env var |
| Razorpay plan activation not wired post-payment | 🟡 MED | payments.py + AuthContext |
| Razorpay live keys (currently test mode) | 🟡 MED | Railway env vars |
| Footer badge jargon | 🟢 LOW | Footer.jsx |
| Navbar PLAN_COLORS old plan names | 🟢 LOW | Navbar.jsx |

---

## GIT WORKFLOW NOTES

```powershell
cd "C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI"
git add <specific files>   # NEVER git add -A — OneDrive may include stale files
git commit -m "feat/fix: ..."
git push origin master
# Vercel auto-deploys frontend; Railway auto-deploys backend
```

**OneDrive sync issue — THE most common problem:**
The git index (`.git/index`) gets corrupted when OneDrive syncs during a write.
- Symptom 1: `fatal: unknown index entry format` → run `git read-tree HEAD` to rebuild
- Symptom 2: `index.lock exists` → run `Remove-Item .git\index.lock -Force`
- Symptom 3: `no changes to commit` when file clearly changed → disk version differs from cloud. Use PowerShell `Set-Content` to write the disk version directly, then git add.

**Import prefix rule (learned the hard way):**
Every file inside `backend/` must import other backend modules as `from backend.app.*`, NOT `from app.*`. Railway runs from `/app/` root so Python needs the full path.

---

## TEST ACCOUNTS

| Plan    | Email                   | Password              |
|---------|-------------------------|-----------------------|
| Free    | free@thebhagya.com      | Test@free1            |
| Jyotish | jyotish@thebhagya.com   | Test@jyotish1         |
| Guru    | guru@thebhagya.com      | Test@guru1            |
| Admin   | admin@thebhagya.com     | TheBhagya@Admin2024   |

---

## SMS / PHONE OTP (MSG91 — chosen, pending implementation)

Provider: **MSG91 SendOTP** — https://msg91.com/in/pricing/otp
Pricing: ₹0.25/OTP up to 5k | ₹0.20 up to 27k | ₹0.19 beyond (+ 18% GST)
Setup needed: Sign up → recharge ₹1,250 → DLT template registration (24-48h TRAI approval)
DLT template: `Your Bhagya OTP is {#var#}. Valid for 10 minutes.`
Env vars to add to Railway: `MSG91_API_KEY`, `MSG91_SENDER_ID`, `MSG91_TEMPLATE_ID`

---

## VIMSHOTTARI DASHA (Rakshit Saluja — reference only)

- Rahu Mahadasha: 2025–2043
- Rahu/Rahu: Jan 2025 – Sept 2027
- Rahu/Jupiter: Sept 2027 – Feb 2030
- Rahu/Saturn: Feb 2030 – Dec 2032
- Rahu/Mercury: Dec 2032 – Jul 2035
- Rahu/Ketu: Jul 2035 – Jul 2036 (cautious stretch)
- Rahu/Venus: Jul 2036 – Jul 2039
