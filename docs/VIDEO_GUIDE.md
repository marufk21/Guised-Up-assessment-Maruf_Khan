# 🎬 Video Recording Guide — Step by Step

6-8 minute screen recording. Voiceover in Hindi/English — jo comfortable ho.
**Windows: Win+Alt+R se built-in screen recorder start hota hai. Ya OBS use karo (free).**

---

## ⚙️ Setup (Recording Se 5 Min Pehle)

### Terminal 1 — Database + Laravel

```powershell
cd apps/api
php artisan migrate:fresh --seed
```

Ab FastAPI ready hone ke baad yeh chalaoge (Terminal 2 ke baad):

```powershell
php artisan app:index-posts --force
php artisan app:issue-demo-token maruf@example.com
# ⚠️ TOKEN COPY KARO → apps/mobile/.env mein daalo (screen pe mat dikhana!)

php artisan serve --host=127.0.0.1 --port=8000
```

### Terminal 2 — AI Service

```powershell
cd apps/ai
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Ready hone ke baad — wapas Terminal 1 mein jaake `index-posts --force` chalao.

### Terminal 3 — Mobile App

```powershell
cd apps/mobile
# Ensure apps/mobile/.env has:
#   EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
#   EXPO_PUBLIC_API_TOKEN=<token from above>
npx expo start
```

Press `i` for iOS Simulator or scan QR with Expo Go.

### Before Recording — Checklist

- [ ] Mobile app loaded — feed dikh raha hai?
- [ ] Search field empty hai
- [ ] All terminals ke scrollback mein koi secret/token nahi
- [ ] Notifications OFF (Focus Mode ON)
- [ ] Close all browser tabs except repo + TSD
- [ ] Editor mein yeh files open: `routes/api.php`, `FeedRanker.php`, `sql/queries.sql`
- [ ] Screen recording software ready (Win+Alt+R or OBS)

---

## 🎙️ The Script — Scene by Scene

### SCENE 1: INTRO (30 seconds)

**Screen pe:** TSD.md ka architecture diagram

**Bolo (Hindi/English mix is fine):**

> "Hi, I'm Maruf Khan. This is my submission for the Guised Up Full-Stack Developer assessment — a Real Connections Feed.
>
> Three apps, one monorepo: Laravel REST API with Sanctum auth, PostgreSQL for relational data, FastAPI with Chroma for vector embeddings and semantic search, and an Expo React Native mobile feed screen.
>
> Let me walk you through it."

---

### SCENE 2: ARCHITECTURE (60 seconds)

**Screen pe:** TSD architecture diagram (Mermaid chart)

**Bolo:**

> "My architecture is deliberately simple — no Redis, no queues, no WebSockets. Everything is synchronous HTTP.
>
> The Expo mobile screen calls only the Laravel API with a Bearer token. Laravel owns authentication, ranking, and PostgreSQL. When it needs embedding or vector search, it calls the internal Python FastAPI service — which runs Chroma in-process for persistent vector storage.
>
> PostgreSQL is always the source of truth. Chroma stores vectors keyed by `post-{id}` — deterministic IDs that bridge both systems. If the vector service is down, the feed degrades gracefully — semantic scores go to zero, but the feed still works."

**Screen pe:** Route file `apps/api/routes/api.php`

**Bolo:**

> "Four API endpoints behind Sanctum middleware: create post, get personalized feed, semantic search, and log interactions."

---

### SCENE 3: BACKEND API DEMO (90 seconds)

**⚠️  TOKEN HIDE KARO — Authorization header screen pe mat aane do!**

**Screen pe:** Terminal with curl/httpie commands OR Postman (with token masked)

**Bolo:**

> "Let me show the API in action."

#### Step 1: Feed

```bash
curl -s http://127.0.0.1:8000/api/feed?page=1 \
  -H "Authorization: Bearer <token>" | head -30
```

**Bolo:**

> "GET /api/feed returns 20 ranked posts per page. Each post has a ranking object with the four signals: authenticity, relationship depth, semantic similarity, and time decay — all normalized between 0 and 1. The meta object includes `has_more_pages` and `semantic_ranking_available`."

**Screen pe:** Ranking section of response highlight karo

#### Step 2: Search

```bash
curl -s "http://127.0.0.1:8000/api/search?q=train+journey" \
  -H "Authorization: Bearer <token>"
```

**Bolo:**

> "Search accepts natural language. 'train journey' finds posts about travel, train rides, journeys — not keyword matching, but semantic understanding via MiniLM embeddings. Results include `semantic_similarity` scores."

**Screen pe:** Search results highlight karo

#### Step 3: Create Post + Interaction

```bash
# Create
curl -s -X POST http://127.0.0.1:8000/api/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text":"A quiet evening walk by the lake today."}'

# React
curl -s -X POST http://127.0.0.1:8000/api/interactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"post_id":1, "type":"reaction"}'
```

**Bolo:**

> "Post creation calculates an authenticity score from text signals — first-person language, lexical diversity, emotional markers — then synchronously embeds via FastAPI. If embedding fails, the post still succeeds with an honest `failed` status. Interactions — views, reactions, replies — feed the relationship depth signal for ranking."

---

### SCENE 4: FEED RANKING EXPLAINED (75 seconds)

**Screen pe:** `FeedRanker.php` — the scoring section

**Bolo:**

> "Here's the ranking formula. Four signals, each in [0,1]:

```
score = 0.25 × Authenticity + 0.30 × Relationship + 0.30 × Semantic + 0.15 × Time
```

> Authenticity is a text-only heuristic — rewards conversational, first-person language, penalizes hashtag spam and marketing phrases.
>
> Relationship depth sums my interaction history with each post author — views count as 1, reactions as 3, replies as 5 — then normalizes against my strongest author connection.
>
> Semantic similarity comes from Chroma — I seed recommendations from my recent interaction history, averaging those vectors to find similar posts.
>
> Time decay uses `exp(-age_hours / 72)` — exponential, half-life of about 2 days.
>
> If I'm a new user with no interactions: relationship and semantic both stay at zero, and I get a recency + authenticity feed. No cold-start problem."

---

### SCENE 5: MOBILE APP WALKTHROUGH (90 seconds)

**Screen pe:** iOS Simulator / Expo Go with feed loaded

**Bolo:**

> "Now the mobile app. This is the single feed screen built with Expo and React Native."

#### Action 1: Scroll the feed

> "Each card shows the author's initials avatar, name, relative time, post text, and a react button. Images load with an error fallback. Infinite scroll loads page 2, page 3 — following the backend's `has_more_pages` signal."

**Karo:** Slowly scroll down the feed, show cards loading

#### Action 2: Pull to refresh

**Karo:** Pull down to refresh

> "Pull-to-refresh resets to page 1, keeping my reacted posts tracked in session state."

#### Action 3: React to a post

**Karo:** Tap the "React" button on a post

> "Tapping React calls `POST /api/interactions`. The button shows a loading spinner, then 'Reacted'. If it fails, I see an error. This is all session-only — no persistence."

#### Action 4: Search

**Karo:** Type "monsoon rain" in search bar

> "The search bar debounces at 350ms and aborts stale requests. I type 'monsoon rain' — results replace the feed inline. Each result keeps the same card layout. Pagination is disabled while searching."

**Karo:** Clear the search bar

> "Clear the search — the feed returns, pagination resumes."

---

### SCENE 6: SQL + TESTS (45 seconds)

**Screen pe:** `sql/queries.sql` open

**Bolo:**

> "The SQL challenge has four queries against the actual application schema:"

**Scroll through each:**

> "D1: Top 10 active users in 7 days, separated by interaction type. Uses `COUNT(*) FILTER`.
>
> D2: Posts from authors I interact with most, ordered by frequency — parameterized with a single user ID CTE.
>
> D3: Posts with 100+ views and zero reactions — potential engagement gaps.
>
> D4: Spam detection — users with more than 20 posts in 24 hours."

**Screen pe:** Switch to terminal with test output

```powershell
cd apps/api && php artisan test --filter=Phase
cd ../mobile && npm test
```

**Bolo:**

> "22 Laravel tests pass — covering authenticated endpoints, ranking correctness, post creation with embedding failure, feed degradation, and deterministic seeder validation. Mobile has 15 passing Jest tests covering the API client and time utilities. Python pytest suite covers the embedding service with deterministic hash-mode tests — no network, no model download."

---

### SCENE 7: TRADE-OFFS (45 seconds)

**Screen pe:** Back to TSD section 16

**Bolo:**

> "Some deliberate trade-offs for this assessment scope:
>
> - Synchronous embedding — fast for this scale, but production would need async queues
> - Text-only authenticity — can't analyze images from URLs alone; real visual authenticity needs direct image access
> - PostgreSQL and Chroma have no shared transaction — deterministic `post-{id}` IDs reduce drift
> - In-memory ranking of 500 candidates — fine for assessment, not for millions of users
> - The hash embedding provider gives deterministic lexical similarity for tests — but it is NEVER silently swapped for the real transformer
>
> Every trade-off is documented in the TSD with a production-evolution path."

---

### SCENE 8: CLOSING (20 seconds)

**Screen pe:** README setup section

**Bolo:**

> "The repository has a complete README with fresh-clone setup, device networking options, token workflow, and all validation commands. Three apps start with a single `pnpm dev` command.
>
> Thank you for reviewing my submission!"

---

## 🔒 Recording Safety Checklist

Recording ke time:

- [ ] **Sanctum token** — kabhi screen pe mat dikhana, curl mein mask karo
- [ ] **DB password** — .env files band rakhna
- [ ] **Assignment PDF** — mat kholna
- [ ] **Browser tabs** — sirf repo + TSD rakho
- [ ] **Notifications** — silent/DND mode
- [ ] **Terminal scrollback** — pehle secrets clear karo (`clear` command)
- [ ] **Conversational raho** — script read mat karo, natural baat karo

## 🧹 After Recording — Cleanup

```powershell
# Stop all services: Ctrl+C in each terminal

# Reset database to clean state
cd apps/api
php artisan migrate:fresh --seed

# Restore embeddings
cd ../ai
.venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8001
# Wait for startup, then in another terminal:
cd apps/api
php artisan app:index-posts

# Remove token from mobile .env
# Delete apps/mobile/.env if it had a real token
```

---

## 💡 Pro Tips (Windows)

| Tip | How |
|---|---|
| Screen record | `Win + Alt + R` (Xbox Game Bar) — free, built-in |
| Better recording | Download OBS Studio (free) — more control |
| Mic check | Record 5 sec, play back — ensure voice is clear |
| Cursor highlight | Settings → Mouse → "Show location of pointer when I press Ctrl" |
| Short video | Record in one take, trim start/end only |
| File format | MP4, 1080p, under 500MB |
