# TourIraq (placeholder name)

Tourism platform for foreign visitors to Iraq: discover attractions in **Baghdad, Najaf, Karbala and Babylon**, book local guides, join travel groups, and collect **GPS-verified stamps** in a digital passport that unlock partner rewards.

> **Status:** All 15 steps of the brief were written, but **the code has NOT been compiled or run yet** (it was generated in an environment without the .NET SDK or internet). Expect to fix a few small compile/runtime errors on first run. Send them to Claude and they can be fixed quickly.

## UI / design system
The frontend follows a calm green design system (Cairo font, tokens in `frontend/src/index.css`): right/left sidebar shell, blurred topbar, hero card, stat cards, timeline, stepper, donut chart, tables, modals and toasts. Icons come from **lucide-react**.
- **Language:** English by default (tourists are foreigners). The topbar button switches to **Arabic + RTL** (layout flips via CSS logical properties). Shell, navigation, page headings and auth screens are translated; the inner form labels are still English.
- Cairo is loaded from Google Fonts (needs internet; falls back to Tahoma/Arial offline).
- Prices stay in USD with thousands separators (rendered LTR). Search box in the topbar filters attractions (shortcut: `/`).

## Architecture

```
TourIraq/
├── backend/TourIraq.Api   ASP.NET Core Web API (controllers, EF Core, SQLite, JWT)
│   ├── Models/            entities + enums
│   ├── Data/              AppDbContext, SeedData, DesignTimeDbContextFactory
│   ├── DTOs/              request/response DTOs (entities are never returned)
│   ├── Services/          JwtService, GeoService (Haversine), FileStorageService, RewardService
│   └── Controllers/       Auth, Governorates, Places, Guides, Trips, Bookings, Groups, Stamps, Passport, Rewards
└── frontend/              React (JavaScript) + Vite + React Router + Axios + Leaflet
```

Key decisions
- **SQLite** only (no Npgsql). Guide languages are a separate table `GuideLanguage` (SQLite has no `text[]`).
- Money = `decimal` with server-side validation (prices are always calculated on the server). Enums stored as strings. Timestamps are UTC.
- `Stamp` has a unique index on `(UserId, PlaceId)`; `GroupMember` has composite key `(GroupId, UserId)`.
- Group joins/approvals are serialized with a lock so capacity can't be exceeded (single-instance MVP).
- Rewards are computed dynamically: `stampCount >= RequiredStamps`.
- Prices are in **USD** (assumption).

## Prerequisites
- .NET SDK 10 (or newer stable) and the EF tool: `dotnet tool install --global dotnet-ef`
- Node.js LTS (20.19+ / 22+) and npm

## Setup

### 1) Backend
```bash
cd backend/TourIraq.Api
dotnet restore
dotnet ef migrations add InitialCreate     # run ONCE (creates the Migrations folder)
dotnet ef database update                  # creates touriraq.db
dotnet run                                 # http://localhost:5000
```
- The app also applies migrations and runs the **idempotent seed** on every start (`Seed:Enabled` in appsettings).
- OpenAPI document (Development): `http://localhost:5000/openapi/v1.json`
- JWT key: `appsettings.Development.json` contains a **dev-only** key. For anything else use
  `dotnet user-secrets init` then `dotnet user-secrets set "Jwt:Key" "<long random string, 32+ chars>"` (or env var `Jwt__Key`).

### 2) Frontend
```bash
cd frontend
npm install
cp .env.example .env     # optional, default API is http://localhost:5000/api
npm run dev              # http://localhost:5173
```

## Demo accounts (local development only)
All seeded accounts use password **`Demo@1234`**

| Role | Email |
|---|---|
| Tourist (female) | tourist@touriraq.demo |
| Tourist (male) | tourist.male@touriraq.demo |
| Agency | agency@touriraq.demo |
| Admin | admin@touriraq.demo |
| Guides | guide.ali@ / guide.zainab@ / guide.omar@ / guide.noor@touriraq.demo |

Before any public deployment set `Seed:Enabled=false` and remove demo accounts.

## Testing the GPS stamp (most important feature)
- **On desktop:** Chrome DevTools → ⋮ → More tools → **Sensors** → Location → *Other…* and enter the place's latitude/longitude (or a spot ~50 m away). Then open the place page, click *Get my location*, choose any JPEG/PNG photo, and *Collect stamp*.
- **Too far:** set the location to somewhere else; you should get a "Too far from the place" error.
- **On a phone:** browsers only allow GPS on **HTTPS** (or localhost). Use an HTTPS tunnel (e.g. `cloudflared tunnel --url http://localhost:5173` or ngrok) for the frontend and for the API, set `VITE_API_URL` to the API tunnel URL, and add the frontend tunnel origin to `Cors:Origins` in `appsettings.json`.
- The camera input uses `<input type="file" accept="image/*" capture="environment">`.

## Main API endpoints
| | |
|---|---|
| POST | `/api/auth/register`, `/api/auth/login` |
| GET | `/api/governorates`, `/api/governorates/{id}/places?category=`, `/api/places`, `/api/places/{id}` |
| GET | `/api/guides?language=&governorateId=`, `/api/guides/{id}` · POST `/api/guides/{id}/reviews` |
| POST/GET | `/api/bookings`, `/api/bookings/me` |
| GET | `/api/trips` · GET `/api/trips/mine` · POST `/api/trips/custom` |
| GET/POST | `/api/groups` · POST `/api/groups/{id}/join` · GET `/api/groups/{id}/members` · PUT `/api/groups/{id}/members/{userId}` |
| POST | `/api/stamps` (multipart: `placeId`, `lat`, `lng`, `photo`) |
| GET | `/api/passport/me`, `/api/rewards` |

Small additions beyond the brief (needed by the UI): `GET /api/places`, `GET /api/trips/mine`, `GET /api/groups/{id}/members`.

## Demo walkthrough (3–4 minutes)
1. **Discover:** Home → Baghdad → *Al-Mustansiriya School* (history timeline, map, safety tips).
2. **Log in** as `tourist@touriraq.demo`.
3. **Collect:** Set DevTools location near the place → *Get my location* → photo → *Collect stamp* → "Stamp collected + reward unlocked (5% Karbala cafe)".
4. **Passport:** open `/passport` → stamp photo + unlocked reward + progress to the next one.
5. **Extras (30 s each):** guide directory filters, guide booking, group with gender rules, itinerary builder.
6. **Be honest about limits** (below).

## Reviews
Reviews need a **Completed** booking. The brief has no endpoint to complete bookings, so the seed gives the demo tourist 3 completed guide bookings (2 already reviewed, 1 — Omar Saad — left open so you can demo the review form).

## Known limitations
- **Not compiled/tested yet** (see status).
- **Anti-fraud is basic:** fake-GPS apps, modified clients and re-used photos can still fool it. Live camera input + server-side distance + one-stamp-per-place are only deterrents.
- Place coordinates are **approximate** and no photos are bundled (cards use category colours/icons). Verify coordinates on a map and add `CoverImageUrl`/`PlaceImages` before the demo. Archaeological sites use larger radii (300–500 m) because they are big and coordinates are approximate.
- Historical texts are conservative summaries; please review them before publishing.
- JWT in `localStorage` is vulnerable to XSS theft (acceptable for the MVP; use httpOnly cookies + refresh tokens later).
- Gender rules rely on the gender stored in the account (no identity verification, reporting or blocking).
- Group capacity lock works for a single server instance only.
- No booking status management (confirm/complete/cancel) and no admin UI.

## Roadmap (not in the MVP)
Refresh tokens, offline mode, audio guides, timeline map, AI planner/assistant, local food pages, travel-buddy matching, seasonal events (Arbaeen), QR-code stamps, cloud image storage, identity verification, reporting/blocking, agency analytics.
