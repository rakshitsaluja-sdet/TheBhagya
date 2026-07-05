# TheBhagya — Continuation Prompt

Paste everything below this line into a new Claude session to resume the project exactly where it was left off.

---

## CONTEXT: PASTE THIS INTO NEW SESSION

I am building **TheBhagya** — an AI-native astrology web app (similar to AstroTalk). The codebase lives at:

`C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI`

Also available at GitHub (new public account — repo name TBD at time of push).

**CRITICAL RULE:** The AlgoMind codebase at `C:\Users\Admin\OneDrive\Documents\ABC\TT` is READ ONLY. Never touch it without explicit instruction from Rakshit.

---

## TECH STACK

- **Frontend:** React 18 + Vite + React Router v6, inline styles, CSS variables for theming
- **Backend:** FastAPI (async) + SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT tokens — regular users (`bhagya_token`) + admin (`bhagya_admin_token`)
- **Astrology engine:** pyswisseph (Swiss Ephemeris), sidereal/Lahiri ayanamsa
- **Start command:** `.\start.ps1` from the BhagyaAI folder — launches both frontend (port 5173) and backend (port 8000)
- **Vite proxy:** `/v1` → `localhost:8000`

---

## WHAT IS FULLY BUILT

### Backend (`backend/app/`)
| File | Purpose |
|---|---|
| `main.py` | FastAPI app, startup seed of test users, all routers registered |
| `api/v1/auth.py` | Register, login, /me, seed endpoints |
| `api/v1/charts.py` | Chart creation (pyswisseph), GET/LIST/DELETE, PDF export |
| `api/v1/chat.py` | Destiny Chat — Claude AI interprets user's chart |
| `api/v1/numerology.py` | Pythagorean + Chaldean numerology |
| `api/v1/payments.py` | Razorpay billing, plan management |
| `api/v1/admin.py` | Admin login, page view tracking, business stats dashboard |
| `core/security.py` | JWT create/decode, bcrypt hash/verify, PLAN_LIMITS |
| `core/engine.py` | pyswisseph wrapper — planet positions, lagna, ayanamsa |
| `core/nakshatra.py` | Nakshatra + pada calculation |
| `core/dasha.py` | Vimshottari dasha tree |
| `core/lal_kitab.py` | Lal Kitab house analysis + remedies |
| `core/pdf_report.py` | PDF chart report generation |
| `db/models.py` | User, BirthChart, ChatSession, PageView ORM models |
| `db/database.py` | SQLAlchemy async engine, get_db dependency |

### Frontend (`frontend/src/`)
| File | Purpose |
|---|---|
| `App.jsx` | Router, ThemeProvider, PageTracker, admin routes (no Navbar) |
| `context/ThemeContext.jsx` | Dark/light theme toggle, persists in localStorage |
| `context/AuthContext.jsx` | isLoggedIn, user, plan, login/logout, canUse(feature) |
| `context/LanguageContext.jsx` | English/Hindi toggle |
| `hooks/useApi.js` | All API calls: charts, auth, numerology, admin |
| `pages/Landing.jsx` | Home page with pillar cards |
| `pages/ChartForm.jsx` | Birth details form — anonymous access allowed |
| `pages/ChartResult.jsx` | Full chart display — 6 tabs (Story, Life, Chart Details, Dasha, Lal Kitab, Learn) |
| `pages/Login.jsx` | Sign in / Create account with test account quick-fill |
| `pages/MyCharts.jsx` | Saved charts list (requires login) |
| `pages/DestinyChat.jsx` | AI chat about user's chart |
| `pages/Numerology.jsx` | Numerology calculator |
| `pages/Palmistry.jsx` | Coming soon placeholder |
| `pages/Pricing.jsx` | 3-tier pricing: Starter (free), Pro ₹299, Jyotish ₹799 |
| `pages/AdminLogin.jsx` | Admin login at `/admin` |
| `pages/AdminDashboard.jsx` | Business metrics dashboard at `/admin/dashboard` |
| `components/Navbar.jsx` | Top nav with theme toggle, language toggle, plan badge |
| `components/Glossary.jsx` | Astrology terms reference |
| `components/LogoMark.jsx` | SVG logo |
| `utils/lifeReadings.js` | Life reading text generation from chart data |

### Other files
| File | Purpose |
|---|---|
| `.env.example` | Template for all env vars (copy to `.env`) |
| `.gitignore` | Excludes .env, data/*.db, node_modules, credentials doc |
| `start.ps1` | One-command launcher for both servers |
| `seed_db.py` | Seeds 3 test accounts directly into SQLite (no passlib needed) |
| `CONTINUATION_PROMPT.md` | This file |

---

## THEME SYSTEM

CSS variables in `frontend/src/index.css`:
- Dark (default): `--bg-deep: #0D0B14`, `--bg-card: #13101E`, `--gold: #C9933A`
- Light: `--bg-deep: #FAF5EC`, `--bg-card: #F2EAD8`, `--gold: #A8721A`
- Toggle via `useTheme()` → `theme, toggle` — sets `data-theme` on `document.documentElement`
- **All pages use CSS variables** — including AdminLogin and AdminDashboard

---

## USER ACCOUNTS

### Test accounts (seeded by `seed_db.py` and `start.ps1`)
| Email | Password | Plan |
|---|---|---|
| `free@thebhagya.com` | `Test@free1` | Starter (free) |
| `pro@thebhagya.com` | `Test@pro1` | Bhagya Pro |
| `jyotish@thebhagya.com` | `Test@jyotish1` | Bhagya Jyotish |

### Admin (set in `.env`, never in DB)
| Field | Value |
|---|---|
| Login URL | `localhost:5173/admin` |
| Email | `admin@thebhagya.com` |
| Password | `TheBhagya@Admin2025!` |

---

## AUTH — CURRENTLY DISABLED (TODO)

Login is built but test account seeding was failing (SQLite write issue — suspected OneDrive sync lock). Auth gating was **temporarily disabled** with `// TODO: Re-enable once auth/login is fixed` comments in:

1. **`ChartResult.jsx`** — All 6 tabs open freely. Needs: `useAuth` import, `isLoggedIn`, `gatedTab` state, `GATED_TABS`, `SignInPrompt` component re-enabled.
2. **`Landing.jsx`** — Pillar cards go directly to features. Needs: Vedic/Lal Kitab → `/login`, Numerology → `/login`, Destiny Chat → `/login`.
3. **`App.jsx`** — Destiny Chat and Numerology routes open without plan check. Needs: `PlanGate` wrapper re-enabled on both routes.

**To fix the seed issue:** Run `python seed_db.py` manually from the BhagyaAI folder. If it fails, check if `data/` is OneDrive-synced (OneDrive can lock SQLite files). Workaround: pause OneDrive sync while seeding.

---

## PLAN LIMITS (from `core/security.py`)

| Plan | Charts | Chat | PDF | Numerology |
|---|---|---|---|---|
| Starter | 3 | ✗ | ✗ | ✗ |
| Pro | unlimited | ✓ | ✓ | ✓ |
| Jyotish | unlimited | ✓ | ✓ | ✓ |

---

## ADMIN PANEL

- Login at `/admin` — validates against `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`
- Dashboard at `/admin/dashboard` — auto-refreshes every 60s
- Tracks: total users, charts, page views, MRR, anon hits, returning sessions, plan distribution, top pages, recent signups
- Page views tracked via `POST /v1/admin/track` (fires on every route change in `PageTracker` component in App.jsx)

---

## PENDING / TODO LIST

1. **Fix login/seed** — test accounts not seeding on Windows (suspected OneDrive SQLite lock)
2. **Re-enable auth gating** — 3 files to update once login works (see AUTH section above)
3. **Domain** — thebhagya.com decision pending
4. **GitHub push** — new public account created, repo needs to be created and code pushed
5. **Razorpay** — replace test keys with live keys before launch
6. **Anthropic API key** — add real key to `.env` for Destiny Chat to work
7. **Production deploy** — Nginx + Gunicorn + PostgreSQL for prod

---

## PERSON DETAILS (for astrology context)

- **Name:** Rakshit Saluja
- **DOB:** 20 May 1992, 5:13 PM IST, Kanpur, Uttar Pradesh, India
- **Ascendant:** Libra 15.65° (Swati nakshatra, pada 3)
- **Moon:** Sagittarius 20.25° (Purva Ashadha, pada 3)
- **Current Mahadasha:** Rahu 2025–2043 (Rahu/Rahu antardasha: Jan 2025 – Sept 2027)
