# TheBhagya — AI-Native Vedic Astrology Platform

> Ancient wisdom. Modern precision. Swiss Ephemeris calculations + Claude AI interpretation.

**Live Backend:** https://thebhagya-backend-production.up.railway.app  
**API Docs:** https://thebhagya-backend-production.up.railway.app/docs  
**Frontend:** *(Vercel deployment pending)*

---

## What is TheBhagya?

TheBhagya is a full-stack astrology platform that combines five ancient wisdom systems into one deeply personal reading:

- **Vedic Astrology** — Swiss Ephemeris precision. Natal chart, Vimshottari Dasha, house analysis
- **Lal Kitab** — 1941 corpus remedies, Pucca Ghar planets, personalised remedy plan
- **Numerology** — Pythagorean & Chaldean. Life Path, Destiny, Soul Urge, Personal Year
- **Destiny Chat** — Ask Claude AI anything about your specific chart placements
- **Palmistry** — *(coming soon)* AI palm line reading integrated with Vedic chart

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Backend | FastAPI (async), Python 3.12 |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy 2.0 (async) + asyncpg |
| Auth | JWT (python-jose), bcrypt 4.x |
| Astrology | pyswisseph 2.10 — Swiss Ephemeris, Lahiri ayanamsa |
| AI | Anthropic Claude API (Destiny Chat) |
| PDF | ReportLab |
| Hosting — Backend | Railway |
| Hosting — Frontend | Vercel |
| Hosting — Database | Supabase (ap-northeast-1, Tokyo) |

---

## Architecture

```
User Browser
    │
    ├── React Frontend (Vercel)
    │       └── VITE_API_BASE_URL → Railway Backend
    │
    └── Railway Backend (FastAPI)
            ├── /v1/auth        — JWT login/register
            ├── /v1/charts      — Chart compute + storage
            ├── /v1/chat        — Claude AI chat
            ├── /v1/numerology  — Numerology engine
            ├── /v1/payments    — Razorpay billing
            └── /v1/admin       — Analytics dashboard
                    │
                    └── Supabase PostgreSQL (Tokyo)
                            ├── users
                            ├── birth_charts
                            ├── chat_sessions
                            └── page_views
```

---

## Plans & Pricing

| Feature | Starter (Free) | Bhagya Pro ₹299/mo | Bhagya Jyotish ₹799/mo |
|---|---|---|---|
| Charts | 3 | Unlimited | Unlimited |
| Vedic + Lal Kitab | ✓ | ✓ | ✓ |
| Numerology | ✗ | ✓ | ✓ |
| Destiny Chat (AI) | ✗ | ✓ | ✓ |
| PDF Report | ✗ | ✓ | ✓ |

---

## Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### Quick Start (Windows)

```powershell
# Clone the repo
git clone https://github.com/rakshitsaluja-sdet/TheBhagya.git
cd TheBhagya

# Copy and fill environment variables
copy .env.example .env
# Edit .env with your values

# Launch everything (installs deps automatically)
.\start.ps1
```

App runs at: http://localhost:5173  
API docs at: http://localhost:8000/docs

### Environment Variables

Create a `.env` file in the root:

```env
# Database (PostgreSQL for prod, SQLite default for local)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/postgres

# Auth
SECRET_KEY=your-secret-key-here

# Admin panel
ADMIN_EMAIL=admin@thebhagya.com
ADMIN_PASSWORD=your-admin-password

# Environment
APP_ENV=development
```

---

## Database Setup (First Time / Production)

```bash
pip install -r requirements.txt
python setup_postgres.py
```

This creates all tables and seeds 3 test accounts in Supabase.

### Test Accounts

| Email | Password | Plan |
|---|---|---|
| free@thebhagya.com | Test@free1 | Starter |
| pro@thebhagya.com | Test@pro1 | Pro |
| jyotish@thebhagya.com | Test@jyotish1 | Jyotish |

---

## Deployment

### Backend → Railway

1. Push to GitHub
2. Railway auto-deploys on every push (reads `railway.toml`)
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL`, `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_ENV=production`

### Frontend → Vercel

1. Import `rakshitsaluja-sdet/TheBhagya` in Vercel
2. Set Root Directory: `frontend`
3. Set env var: `VITE_API_BASE_URL=https://thebhagya-backend-production.up.railway.app`
4. Deploy

---

## API Reference

Full interactive docs: https://thebhagya-backend-production.up.railway.app/docs

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/v1/auth/register` | POST | None | Create account |
| `/v1/auth/login` | POST | None | Get JWT token |
| `/v1/charts` | POST | Bearer | Compute + save chart |
| `/v1/charts` | GET | Bearer | List user's charts |
| `/v1/charts/{id}` | GET | Bearer | Get single chart |
| `/v1/charts/{id}/pdf` | GET | Bearer | Download PDF report |
| `/v1/chat` | POST | Bearer | AI chat about chart |
| `/v1/numerology` | POST | Bearer | Compute numerology |
| `/v1/payments/plans` | GET | None | List plans |
| `/health` | GET | None | Health check |

---

## Project Structure

```
TheBhagya/
├── backend/
│   └── app/
│       ├── api/v1/          # Route handlers
│       ├── core/            # Business logic (engine, dasha, pdf)
│       │   └── jyotish/     # Swiss Ephemeris wrappers
│       ├── db/              # Models + database setup
│       └── main.py          # FastAPI app entry point
├── frontend/
│   └── src/
│       ├── components/      # Navbar, Glossary, LogoMark
│       ├── context/         # Auth, Theme, Language
│       ├── hooks/           # useApi.js
│       ├── pages/           # All page components
│       └── utils/           # lifeReadings.js
├── alembic/                 # DB migrations
├── railway.toml             # Railway deployment config
├── render.yaml              # Render.com alternative
├── requirements.txt         # Python dependencies
├── setup_postgres.py        # One-time DB setup
└── start.ps1                # Local dev launcher
```

---

## Admin Panel

URL: `/admin`  
Tracks: users, charts, MRR, page views, plan distribution, top pages, recent signups.  
Auto-refreshes every 60 seconds.

---

## Roadmap

- [ ] Vercel frontend deployment
- [ ] Razorpay live payment keys
- [ ] Custom domain (thebhagya.com)
- [ ] Palmistry — palm photo upload + AI analysis
- [ ] Mobile app (React Native)
- [ ] Kundali matching / compatibility
- [ ] Transit alerts (push notifications)

---

## License

Private — all rights reserved. © 2026 TheBhagya / Rakshit Saluja.
