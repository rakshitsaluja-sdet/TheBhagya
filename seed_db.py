"""
seed_db.py — Seeds test accounts directly into SQLite.
Zero external dependencies — uses only built-in sqlite3.
Safe to run multiple times (skips existing accounts).
"""
import os, sqlite3, uuid

os.makedirs("data", exist_ok=True)
DB_PATH = os.path.join("data", "bhagyaai.db")

# Pre-computed bcrypt hashes — no passlib needed at seed time
TEST_USERS = [
    {
        "email":    "free@thebhagya.com",
        "hash":     "$2b$12$lT8i5SPY/boCb7uHldX70u.O6k4qFXug9qnB5MZhUeWUbPveKSS6.",
        "plan":     "starter",
    },
    {
        "email":    "pro@thebhagya.com",
        "hash":     "$2b$12$tgJqrtZSo6ifs9S6088UQeOfmtWhwu49ugLYcZadD6AH.6wgUv0lG",
        "plan":     "pro",
    },
    {
        "email":    "jyotish@thebhagya.com",
        "hash":     "$2b$12$YbsuGBOImHkSD4F8BOdlpe1fm5jI30pbKQohKW6kgZ3qmGQ8rqFbm",
        "plan":     "jyotish",
    },
]

def seed():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Create table if it doesn't exist yet
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            plan          TEXT DEFAULT 'starter',
            chart_count   INTEGER DEFAULT 0,
            is_active     INTEGER DEFAULT 1,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    con.commit()

    created = []
    skipped = []

    for u in TEST_USERS:
        cur.execute("SELECT id FROM users WHERE email = ?", (u["email"],))
        if cur.fetchone():
            skipped.append(u["email"])
            continue
        cur.execute(
            "INSERT INTO users (id, email, password_hash, plan) VALUES (?, ?, ?, ?)",
            (str(uuid.uuid4()), u["email"], u["hash"], u["plan"])
        )
        created.append(u["email"])

    con.commit()

    # Verify the write
    cur.execute("SELECT email FROM users WHERE email IN (?,?,?)",
                [u["email"] for u in TEST_USERS])
    found = [r[0] for r in cur.fetchall()]
    con.close()

    if created:
        print(f"  [seed] Created: {', '.join(created)}")
    if skipped:
        print(f"  [seed] Already exist: {', '.join(skipped)}")
    print(f"  [seed] Verified {len(found)}/3 accounts in DB. Ready.")

if __name__ == "__main__":
    print("[seed] Seeding test accounts...")
    seed()
