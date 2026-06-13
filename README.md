# Travel Amigo Backend

NestJS API for the Travel Amigo frontend (`../travel-amigo`).

**Stack:** NestJS (TS strict) · Prisma + PostgreSQL · JWT auth (15m access / 7d refresh, rotation) · Redis (ioredis) for rate limiting + Google API caching · BullMQ (email + PDF queues) · class-validator DTOs · REST under `/api/v1`.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in values

# Local dev services (or point DATABASE_URL/REDIS_URL elsewhere)
docker run -d --name ta-pg -e POSTGRES_PASSWORD=ta_dev -e POSTGRES_DB=travel_amigo -p 5433:5432 postgres:16-alpine
docker run -d --name ta-redis -p 6380:6379 redis:7-alpine

npx prisma migrate dev        # apply schema
npx prisma db seed            # 45 places + admin user (ADMIN_EMAIL/ADMIN_PASSWORD env, dev fallback otherwise)

npm run start:dev             # http://localhost:3001/api/v1
```

## Modules

| Module | Routes |
|---|---|
| Auth | `POST /auth/register · login · refresh · logout · verify-email` |
| Trips | `POST /trips/generate` (guest OK, 10/h per IP) · CRUD `/trips`, `/trips/:id/items/:itemId` · `POST /trips/:id/export-pdf` |
| Places | `GET /places` (filterable) · `GET /places/:id` (Google-enriched, Redis-cached 24h) |
| Social | `POST /share` · `GET /share/:token` (public) · `POST /feedback` · `GET /feedback` (admin) |
| Admin | `GET /admin/feedback` · `PUT /admin/places/:id` (RolesGuard `admin`) |

`POST /trips/generate` returns the exact `GeneratedItinerary` shape the frontend renders (contract: `travel-amigo/types/index.ts`). Errors use the frontend's `ApiError` shape (`{ message, code, details? }`).

Background jobs (BullMQ, 3 retries / exponential backoff): `email-queue` (`send-verification`, `send-trip-invite` via SendGrid), `pdf-queue` (`generate-pdf` → Cloudflare R2, writes `Trip.pdfUrl`).
