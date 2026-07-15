# Guised Up

A full-stack AI-enhanced social feed monorepo — Laravel API, FastAPI embedding service, and Expo React Native mobile app, orchestrated with Turborepo.

## Architecture

```
guised-up/
├── apps/
│   ├── api/        # Laravel 12 — REST API, feed ranking, search, auth (Sanctum)
│   ├── ai/         # FastAPI + Chroma — embedding service & vector search (Python 3.14)
│   └── mobile/     # Expo SDK 57 — React Native feed screen
├── docs/           # Technical spec & video walkthrough docs
├── sql/            # Reference SQL queries
├── scripts/        # Dev scripts with unified port management
└── turbo.json      # Turborepo task pipeline
```

## Tech Stack

| Layer     | Technology                                        |
| --------- | ------------------------------------------------- |
| API       | Laravel 12, PHP 8.2+, Sanctum, PostgreSQL         |
| AI        | FastAPI, Chroma, sentence-transformers (MiniLM-L6) |
| Mobile    | Expo SDK 57, React 19, React Native 0.86          |
| Build     | Turborepo, pnpm                                   |

## Getting Started

### Prerequisites

- Node.js >= 18 with pnpm 9
- PHP 8.2+ with Composer
- Python 3.14 (for the embedding service)
- PostgreSQL

### 1. Install dependencies

```sh
pnpm install
```

Each app manages its own dependencies — run `composer install` in `apps/api` and set up the Python venv in `apps/ai` separately.

### 2. Environment

Copy `.env.example` files in each app and review the root `.env` for port configuration:

| Variable      | App    | Default |
| ------------- | ------ | ------- |
| `API_PORT`    | api    | 8000    |
| `AI_PORT`     | ai     | 8001    |
| `MOBILE_PORT` | mobile | 8081    |

### 3. Start developing

```sh
# All apps in parallel
turbo dev

# Or individually
pnpm dev:api      # Laravel API
pnpm dev:ai       # FastAPI embedding service
pnpm dev:mobile   # Expo mobile app
```

For app-specific setup details, see each app's README:

- [apps/api](apps/api/) — Laravel API setup, migrations, demo tokens
- [apps/ai](apps/ai/) — Python venv, embedding providers, Chroma persistence
- [apps/mobile](apps/mobile/) — Expo prerequisites and backend prep

## Token Workflow

The mobile app needs a valid Sanctum token to call the API. Generate one locally:

```sh
cd apps/api
php artisan migrate:fresh --seed          # Reset database with demo data
php artisan app:index-posts --force       # Index all posts into Chroma
php artisan app:issue-demo-token maruf@example.com   # Generate a Sanctum token
```

Copy the one-time plaintext token into `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_TOKEN=<the-token-shown-once>
```

The seeded demo user is `Maruf Khan` (maruf@example.com, password: `password`). Two other demo users — Priya Kapoor and Karan Verma — are also available.

## Device Networking

The API base URL in `apps/mobile/.env` depends on how you run the mobile app:

| Platform | `EXPO_PUBLIC_API_BASE_URL` |
|---|---|
| iOS Simulator | `http://127.0.0.1:8000/api` |
| Android Emulator | `http://10.0.2.2:8000/api` |
| Physical device | `http://<your-lan-ip>:8000/api` (start Laravel with `php artisan serve --host=0.0.0.0 --port=8000`) |
| Web (`--web`) | `http://127.0.0.1:8000/api` |

## Validation Commands

Run all project tests and type-checks:

```sh
# Laravel API tests
cd apps/api && php artisan test

# Python embedding service tests
cd apps/ai && .venv/bin/python -m pytest -q

# Mobile Jest tests (9 tests: api + timeAgo)
cd apps/mobile && pnpm test

# Mobile TypeScript type-check
cd apps/mobile && pnpm typecheck

# Full build
pnpm build
```

## Apps in Detail

### API (`apps/api`)

Laravel 12 REST API with token-based authentication (Sanctum). Provides endpoints for the feed, posts, interactions, and search. Includes a feed ranker service, embeddings client to communicate with the AI service, and an authenticity scorer.

```sh
cd apps/api
composer install
php artisan migrate:fresh --seed
php artisan app:index-posts          # Index posts into the vector store
php artisan app:issue-demo-token     # Generate a demo Sanctum token
php artisan serve
```

### AI (`apps/ai`)

Network-private FastAPI service that handles post embeddings and vector search via Chroma. Uses `sentence-transformers/all-MiniLM-L6-v2` by default, with a deterministic hash fallback for testing.

```sh
cd apps/ai
python3.14 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Endpoints: `/health`, `/documents/upsert`, `/search`, `/recommendations`.

### Mobile (`apps/mobile`)

Expo SDK 57 React Native app with a single authenticated Feed Screen. Connects to the Laravel API and displays ranked, AI-enhanced post content.

## Build

```sh
turbo build          # Build all apps
turbo build --filter=api   # Build a specific app
```

## Remote Caching

Turborepo supports [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) on Vercel to share build cache across your team and CI.

```sh
turbo login
turbo link
```
