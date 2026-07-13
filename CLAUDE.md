# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

Guised Up is a full-stack AI-enhanced social feed — three apps in a Turborepo, connected by a deterministic document ID convention (`post-{id}`) that links PostgreSQL rows to Chroma vectors.

| App | Stack | Purpose |
|---|---|---|
| `apps/api` | Laravel 12, PHP 8.2+, Sanctum, PostgreSQL | REST API, feed ranking, search, auth |
| `apps/ai` | FastAPI, Python 3.14, Chroma, sentence-transformers | Embedding generation, vector search, recommendations |
| `apps/mobile` | Expo SDK 57, React 19, React Native 0.86 | Single authenticated feed screen |

Package manager: **pnpm 9** (`pnpm-workspace.yaml` includes `apps/*`). Root `.npmrc` uses `shamefully-hoist=true` — required for Expo/Metro to resolve modules in pnpm's strict layout.

## Common Commands

```sh
# All apps in parallel (Turborepo)
pnpm dev

# Single apps
pnpm dev:api          # Laravel on 127.0.0.1:8000
pnpm dev:ai           # FastAPI on 127.0.0.1:8001
pnpm dev:mobile       # Expo — QR for Expo Go, --web for browser

# Build all
pnpm build            # turbo run build

# Lint & type-check
pnpm lint
pnpm check-types

# API-specific
cd apps/api
php artisan app:issue-demo-token [email]   # Generate Sanctum token
php artisan app:index-posts                # Index posts into Chroma
php artisan app:index-posts --force        # Re-index all posts
php artisan migrate:fresh --seed
php artisan test

# AI-specific
cd apps/ai
.venv/bin/python -m pytest -q

# Mobile-specific
cd apps/mobile
pnpm test              # Jest (9 tests, api + timeAgo)
pnpm typecheck          # tsc --noEmit
```

## Architecture

### Data flow

```
Mobile (Expo) → HTTPS/JSON + Bearer token → Laravel API → PostgreSQL
                                                  ↓
                                     EmbeddingsClient (HTTP/JSON)
                                                  ↓
                                            FastAPI → Chroma (local persistent)
```

Laravel is the public boundary and source of truth. The Python service owns only embeddings and vector operations. Chroma runs in-process (not a separate network service), persisting to `apps/ai/storage/chroma/`.

### Feed ranking pipeline

The `FeedRanker` service ([apps/api/app/Services/FeedRanker.php](apps/api/app/Services/FeedRanker.php)) loads up to 500 recent posts (excluding the requestor's own), then scores each candidate with four weighted signals:

| Signal | Weight | Source |
|---|---|---|
| Authenticity | 25% | Text-based heuristic in `AuthenticityScorer` |
| Relationship depth | 30% | Weighted interaction counts (view=1, reaction=3, reply=5) |
| Semantic similarity | 30% | Chroma recommendations from user's interaction seeds |
| Time decay | 15% | `exp(-ageHours / 72)` |

Posts are sorted by composite score, then recency, then ID. Page size is 20. Semantic ranking degrades gracefully — if the Python service is unreachable, semantic scores are set to 0 and `semantic_ranking_available` is `false`.

### Vector document ID convention

The deterministic ID `post-{postgres_id}` is the bridge between systems:
- `EmbeddingsClient::documentId($postId)` in PHP generates it
- Chroma stores vectors keyed by this ID
- Search/recommendation results parse `post-(\d+)` to map back to PostgreSQL rows
- Upserting the same ID replaces the Chroma document (idempotent)

### API routes

All routes in `routes/api.php` are wrapped in `auth:sanctum` middleware:

| Method | Path | Controller |
|---|---|---|
| `POST` | `/api/posts` | `PostController@store` |
| `GET` | `/api/feed?page=N` | `FeedController` (invokable) |
| `GET` | `/api/search?q=...` | `SearchController` (invokable) |
| `POST` | `/api/interactions` | `InteractionController@store` |
| `GET` | `/api/user` | Closure returning authenticated user |

### AI service endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Provider & collection info |
| `POST` | `/documents/upsert` | Embed + store one document |
| `POST` | `/search` | Embed query → nearest neighbors |
| `POST` | `/recommendations` | Mean of seed vectors → nearest neighbors |

### Mobile app structure

Single-screen Expo app. Key files:

- [src/FeedScreen.tsx](apps/mobile/src/FeedScreen.tsx) — `FlatList` with header (branding + search bar), infinite pagination via `onEndReached`, pull-to-refresh, debounced semantic search (350ms), reaction buttons with session-only state
- [src/components/PostCard.tsx](apps/mobile/src/components/PostCard.tsx) — Avatar initials, relative timestamps, image with error fallback, reaction button (loading/reacted/error states)
- [src/api.ts](apps/mobile/src/api.ts) — Typed `fetch` wrapper: parses env vars (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_TOKEN`), sends Bearer headers, validates JSON response shapes with runtime type guards, throws `ApiError` with `kind` (`configuration` | `network` | `http` | `response`)
- [src/utils/timeAgo.ts](apps/mobile/src/utils/timeAgo.ts) — Relative time formatting (just now → Nm → Nh → Nd → Nw)
- [src/types.ts](apps/mobile/src/types.ts) — All TypeScript interfaces matching the API response shapes

## Key Design Decisions

- **Embedding is synchronous but non-fatal**: Post creation succeeds even if embedding fails (status marked `failed`). The `app:index-posts` command can retry.
- **Search returns 503 on embedding failure** (not degraded lexical results) — semantic behavior is the contract.
- **No Redis/queues/WebSockets** — everything is synchronous HTTP. This is an assessment constraint, not a production pattern.
- **Authenticity is text-only**: The scorer checks first-person language, lexical diversity, emotional markers, and penalizes hashtag spam/all-caps/marketing phrases. It does not analyze images.
- **Chroma is not a separate service**: It runs inside the FastAPI process using `chromadb.PersistentClient` with local filesystem storage.
- **Two embedding providers**: `sentence_transformer` (production — MiniLM-L6-v2) and `hash` (tests — deterministic lexical-similarity). The provider is set via `EMBEDDING_PROVIDER` env var and never silently changed.
- **Tests use explicit hash mode** with temporary Chroma directories — no network access, no model download.

## Port Map

Defined in root `.env` (single source of truth, read by `scripts/ports.mjs`):

| Variable | Default | App |
|---|---|---|
| `API_PORT` | 8000 | Laravel |
| `AI_PORT` | 8001 | FastAPI |
| `MOBILE_PORT` | 8081 | Expo/Metro |

## SQL Reference

[`sql/queries.sql`](sql/queries.sql) contains four PostgreSQL challenge queries using the existing schema: top active users (7-day interaction counts), posts from strongest-relationship authors, high-view zero-reaction posts, and potential-spam detection (>20 posts in 24h).
