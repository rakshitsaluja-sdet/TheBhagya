# TheBhagya — Continuation Prompt
# Last updated: July 2026

Paste everything below this line into a new Claude Cowork session to resume exactly where we left off.

---

## PROJECT IDENTITY

**TheBhagya** — AI-native Vedic astrology platform (similar to AstroTalk).
Built by Rakshit Saluja. Claude is the co-developer.

**CRITICAL RULE:** The AlgoMind codebase at `C:\Users\Admin\OneDrive\Documents\ABC\TT` is READ ONLY. Never modify it without explicit instruction from Rakshit.

---

## CODEBASE LOCATION

Local: `C:\Users\Admin\OneDrive\Documents\Bhagya_AstroTalk\Bhagya-- Similar to AstroTalk\BhagyaAI`
GitHub: `https://github.com/rakshitsaluja-sdet/TheBhagya` (public)

---

## LIVE DEPLOYMENT STATUS

| Layer | URL | Status |
|---|---|---|
| Backend (FastAPI) | `https://thebhagya-backend-production.up.railway.app` | ✅ LIVE on Railway |
| Database | Supabase PostgreSQL — `db.hngsrnuhfafbqqxgnule.supabase.co` | ✅ LIVE |
| Frontend (React) | Vercel — **PENDING** (next task) | ⏳ Not deployed yet |

---

## TECH STACK

- **Frontend:** React 18 + Vite + React Router v6, inline styles, CSS variables for theming
- **Backend:** FastAPI (async) + SQLAlchemy 2.0 + asyncpg
- **Database:** PostgreSQL via Supabase (prod) / SQLite via aiosqlite (local fallback)
- **Auth:** JWT tokens — `bhagya_token` (users) + `bhagya_admin_token` (admin)
- **Astrology engine:** pyswisseph (Swiss Ephemeris), sidereal/Lahiri ayanamsa
- **bcrypt:** Used directly (`import bcrypt as _bcrypt`) — passlib removed (Python 3.12 conflict)
- **Start command (local):** `.\start.ps1` from BhagyaAI folder
- **Vite proxy (local):** `/v1` → `localhost:8000`
- **Production API base:** `VITE_API_BASE_URL=https://thebhagya-backend-production.up.railway.app`

---

## ENVIRONMENT VARIABLES

### Backend (.env in BhagyaAI/ — also set in Railway Variables)
```
DATABASE_URL=postgresql+asyncpg://postgres.hngsrnuhfafbqqxgnule:Merak%4013042022@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
APP_ENV=production
SECRET_KEY=thebhagya-prod-secret-change-this-before-launch-xyz987abc
ADMIN_EMAIL=admin@thebhagya.com
ADMIN_PASSWORD=TheBhagya@Admin2025!
```

### Frontend (frontend/.env.production — NOT committed to git)
```
VITE_API_BASE_URL=https://thebhagya-backend-production.up.railway.app
```

---

## WHAT IS FULLY BUILT

### Backend (`backend/app/`)
| File | Purpose |
|---|---|
| `main.py` | FastAPI app, startup seed, all routers, /health endpoint |
| `api/v1/auth.py` | Register, login, /me — plan always forced to "starter" on register |
| `api/v1/charts.py` | Chart creation (pyswisseph), GET/LIST/DELETE (returns 200), PDF export |
| `api/v1/chat.py` | Destiny Chat — Claude AI interprets user's chart |
| `api/v1/numerology.py` | Pythagorean + Chaldean numerology |
| `api/v1/payments.py` | Razorpay billing, plan management |
| `api/v1/admin.py` | Admin login, page view tracking, business stats dashboard |
| `core/security.py` | JWT, bcrypt direct (no passlib), PLAN_LIMITS |
| `core/jyotish/engine.py` | pyswisseph wrapper + FLG_SPEED for retrograde |
| `core/jyotish/nakshatra.py` | Nakshatra + pada calculation |
| `core/jyotish/dasha.py` | Vimshottari dasha tree + null guard |
| `core/lal_kitab.py` | Lal Kitab house analysis + remedies |
| `core/pdf_report.py` | PDF report — uses .get("end") not .get("end_date") |
| `db/models.py` | User, BirthChart, ChatSession, PageView ORM models |
| `db/database.py` | Async engine, absolute path for SQLite data dir |

### Frontend (`frontend/src/`)
| File | Purpose |
|---|---|
| `App.jsx` | Router, PlanGate, PageTracker — auth gating ENABLED |
| `context/AuthContext.jsx` | isLoggedIn, user, plan, canUse(), PLAN_FEATURES export |
| `context/ThemeContext.jsx` | Dark/light toggle, CSS vars |
| `context/LanguageContext.jsx` | English/Hindi toggle |
| `hooks/useApi.js` | All API calls — BASE uses VITE_API_BASE_URL env var |
| `pages/Landing.jsx` | Home, pillar cards navigate directly (PlanGate handles redirect) |
| `pages/ChartForm.jsx` | Birth details form — anonymous access, date max = today |
| `pages/ChartResult.jsx` | 6 tabs — gated: Story/Life/Dasha/LalKitab/Learn require login; Chart Details free. PDF+Chat buttons locked for starter plan |
| `pages/Login.jsx` | Sign in / register |
| `pages/MyCharts.jsx` | Saved charts (requires login) |
| `pages/DestinyChat.jsx` | AI chat — PlanGate(chat) protected |
| `pages/Numerology.jsx` | Numerology calculator — PlanGate(numerology) protected |
| `pages/Palmistry.jsx` | Coming soon placeholder |
| `pages/Pricing.jsx` | 3-tier pricing: Starter free / Pro ₹299 / Jyotish ₹799 |
| `pages/AdminLogin.jsx` | `/admin` — creds hint only in DEV mode |
| `pages/AdminDashboard.jsx` | `/admin/dashboard` — stats, auto-refresh 60s |
| `components/Navbar.jsx` | UserAvatar component (gold circle, first letter of email, dropdown with My Charts / Upgrade / Sign Out) |
| `components/Glossary.jsx` | Astrology terms |
| `components/LogoMark.jsx` | SVG logo |
| `utils/lifeReadings.js` | Life reading text generation |

### Deployment & Config files
| File | Purpose |
|---|---|
| `railway.toml` | Railway deploy config — start command, health check |
| `render.yaml` | Render.com alternative deploy config |
| `requirements.txt` | Python deps — passlib removed, bcrypt==4.1.3 |
| `setup_postgres.py` | One-time Supabase setup — creates tables + seeds test users |
| `alembic/` | Async Alembic migrations |
| `push_to_github.ps1` | Push script for Windows |
| `start.ps1` | Local dev launcher — polls Vite before opening browser |
| `frontend/.env.production` | Points VITE_API_BASE_URL to Railway (gitignored) |

---

## AUTH & PLAN GATING (FULLY ENABLED)

| Route | Gate |
|---|---|
| `/chart/new` | Open — no login required |
| `/chart/:id` → Chart Details tab | Open — no login required |
| `/chart/:id` → Story/Life/Dasha/LalKitab/Learn tabs | Login required → SignInPrompt shown |
| `/chart/:id` → PDF button | Login + pro/jyotish plan |
| `/chart/:id` → Ask Bhagya button | Login + chat plan |
| `/destiny-chat` | PlanGate(chat) → starter redirected to /pricing |
| `/numerology` | PlanGate(numerology) → starter redirected to /pricing |
| `/my-charts` | Login required |

---

## USER ACCOUNTS

### Test accounts (seeded in Supabase via setup_postgres.py)
| Email | Password | Plan |
|---|---|---|
| `free@thebhagya.com` | `Test@free1` | Starter |
| `pro@thebhagya.com` | `Test@pro1` | Pro |
| `jyotish@thebhagya.com` | `Test@jyotish1` | Jyotish |

### Admin
| Field | Value |
|---|---|
| Login URL | `/admin` |
| Email | `admin@thebhagya.com` |
| Password | `TheBhagya@Admin2025!` |

---

## PENDING TASKS (pick up from here)

1. **Deploy frontend to Vercel** — `npm run build` done locally. Next: vercel.com → import GitHub repo → set `VITE_API_BASE_URL` env var → deploy `frontend/` subfolder
2. **Update ALLOWED_ORIGINS in Railway** — add Vercel URL once known (set as `ALLOWED_ORIGINS` env var in Railway)
3. **Fix payment plan activation** — after Razorpay payment, plan never updates in DB (BE-01)
4. **Replace SECRET_KEY** — current key is known, must change before public launch
5. **Add shared `get_current_user` FastAPI dependency** — root cause of auth bypass on multiple endpoints
6. **Anthropic API key** — add `ANTHROPIC_API_KEY` to Railway env vars for Destiny Chat to work in production
7. **Razorpay live keys** — replace test keys before launch
8. **Domain decision** — thebhagya.com (task #11, pending)
9. **Push latest changes to GitHub** — railway.toml, render.yaml, requirements.txt fix, charts.py DELETE fix, CONTINUATION_PROMPT update

---

## SUPABASE CONNECTION

- Project ID: `hngsrnuhfafbqqxgnule`
- Region: `ap-northeast-1` (Tokyo)
- Pooler host (session mode): `aws-0-ap-northeast-1.pooler.supabase.com:5432`
- Direct host (IPv6 only — does NOT work from Railway): `db.hngsrnuhfafbqqxgnule.supabase.co:5432`
- Password: `Merak@13042022` (URL-encoded as `Merak%4013042022`)

---

## RAKSHIT'S ASTROLOGY DETAILS

- **DOB:** 20 May 1992, 5:13 PM IST, Kanpur, UP, India
- **Ascendant:** Libra 15.65° (Swati nakshatra, pada 3)
- **Moon:** Sagittarius 20.25° (Purva Ashadha, pada 3)
- **Current Mahadasha:** Rahu 2025–2043 (Rahu/Rahu antardasha: Jan 2025 – Sept 2027)
- **Canada visa:** valid Dec 2025 – Nov 2027
- **Goal:** ₹70 LPA + move abroad by end 2026
