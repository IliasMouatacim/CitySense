# CitySense

Montbéliard urban exploration prototype, starting the supplied final-year project blueprint.

## Implemented

- Next.js 16 / React / TypeScript responsive French explorer with MapLibre 2D/3D camera controls and building extrusions.
- NestJS 12 API: `/health`, `/places`, `/search?q=…&source=local|address`, Swagger at `/docs`.
- Searchable pilot directory, category filters, map markers, place details, debounced IGN address search, loading, empty and service-error states.
- Docker Compose PostgreSQL 17 / PostGIS 3.5 infrastructure, pinned by image digest. The API stores and searches the pilot directory in PostGIS.
- API integration and desktop/mobile Chromium tests.

Pilot landmark coordinates are approximate. Building extrusions use provider heights where available, with an illustrative 8 m fallback. Neither is survey-grade. Accessibility is unknown; this prototype never claims that a route or venue is accessible.

## Deploy for free

See [the student deployment guide](docs/DEPLOYMENT.md): Vercel Hobby, one Render Free API, Neon Free PostGIS, and the free OpenRouteService plan. No paid services or disks are declared. Hosted deployment requires your provider accounts and secure secret entry.

## Develop

Use Node.js 24 LTS and pnpm 11.25.0. From this directory:

```sh
pnpm install --frozen-lockfile
node scripts/init-local-env.mjs
docker compose up -d db
pnpm db:migrate
pnpm dev
```

The environment helper creates a random local database password only if `.env` is absent. It preserves existing configuration. Database data persists in the Compose volume; `docker compose down` stops services without deleting it.

The frontend runs on port 3000; API on 4000. Frontend `/api/*` requests proxy to the API. Set `API_URL` for another API host. Set `PORT` for another API port and adjust `API_URL` accordingly. No public credentials are required. Keep the API behind the frontend proxy for development.

The map needs HTTPS access to `tiles.openfreemap.org` and address search to `data.geopf.fr`. Map attribution is displayed by MapLibre. These services require network access from the browser/API respectively. Do not bulk-download tiles. IGN and hosted routing requests use the inherited HTTPS proxy through an explicit client dispatcher.

In the managed cloud sandbox, place package-manager caches in writable directories:

```sh
export XDG_DATA_HOME=/workspace/.citysense-tools/data
export XDG_CACHE_HOME=/workspace/.citysense-tools/cache
export npm_config_cache=/workspace/.citysense-tools/npm-cache
export NODE_USE_ENV_PROXY=1
```

## Spatial directory

`GET /places?lon=6.8011&lat=47.5105&radius=800` returns places within 800 meters, ordered by straight-line geography distance. `category=Nature|Transport|Patrimoine` is optional. Coordinates use longitude, latitude order. The pilot bounds are longitude 6.6–7.0 and latitude 47.3–47.7; radius is limited to 1–10,000 meters. Place details show nearby pilot landmarks and clearly distinguish these distances from a route.

`pnpm db:migrate` applies transactional, advisory-locked migrations. Version 1 adds the places table, a GiST spatial index, and four approximate pilot landmarks. Repeating migrations preserves later data edits. The API reports HTTP 503 if database readiness fails; it does not silently fall back to demo data.

The API loads the root `.env` for local development. `DATABASE_URL` can select an external database; standard `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and `POSTGRES_PASSWORD` configure local access. Never commit credentials. Integration tests need the local database, create an isolated temporary schema and remove it afterward.

## Validate

```sh
pnpm typecheck
pnpm test
pnpm build
# With both development services running:
pnpm exec playwright install chromium
pnpm exec playwright test
# Cloud image already has Chromium:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm exec playwright test
# Database readiness and spatial support:
docker compose exec -T db psql -U citysense -d citysense -c 'SELECT PostGIS_Version();'
```

## Remaining product work

This is an initial foundation, not the completed six-month product. Next steps: geographic dataset imports, accessibility-aware route ranking and regional graph validation, accessibility evidence and ranking, official GTFS import, accounts and sessions, reports/moderation, and production hardening. OTP, SIRI and offline PWA remain later work. Authentication, rate limiting, abuse protection and deployment controls must be implemented before exposing account/report functionality publicly.

No fake itinerary or transport timetable is presented. Search, place exploration, nearby discovery and routing controls are implemented. Actual routing requires a built Valhalla regional graph.

## Walking and cycling routes

`GET /routes?from=6.8011,47.5105&to=6.8049,47.5057&mode=pedestrian` calls local Valhalla. `mode=bicycle` is also supported. The endpoint validates pilot bounds, decodes Valhalla polyline6 into GeoJSON, and returns distance, duration and French instructions. It returns HTTP 503 if the engine is unavailable and 422 for supported no-route errors. No straight-line substitute is returned. Place details let users select another pilot landmark as departure; calculated geometry is rendered on the map when tiles are available.

To prepare the actual engine:

```sh
bash scripts/prepare-routing.sh
docker compose --profile routing logs -f valhalla
# After the regional graph finishes building, with the API running:
node scripts/check-routing.mjs
```

The preparation script downloads Franche-Comté OSM data from `download.geofabrik.de`, verifies its provider-published checksum over HTTPS, and starts the pinned upstream Valhalla scripted image with two build threads. The local `.data/valhalla` directory retains the graph and is ignored by Git. Regional build time and storage depend on the current extract. `VALHALLA_URL` overrides the default local engine at port 8002. Do not expose the engine port publicly.

**Validation:** The deployed database-backed directory, IGN search, and real walking/cycling routes have been checked through the Vercel API proxy. Controlled adapter tests are separate from the opt-in live browser suite. Live tests now also check the rendered map container's dimensions to catch layout failures even when tile requests succeed. Accessibility remains unverified. Self-hosted Valhalla graph validation is separate from hosted OpenRouteService routing.

## Saved places and live checks

Visitors can save up to 50 pilot places or supported IGN addresses from the place detail card, reopen them with mouse or keyboard, and remove them. The list persists in this browser's local storage. It is device-local, can be cleared by browser settings, and is not an account or cross-device sync feature. Storage failures keep the interface usable for the current visit. Invalid/out-of-region stored records are filtered.

```sh
# Deterministic desktop/mobile browser suite, with local services running:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm exec playwright test
# Opt-in real-service checks (uses a few free routing requests):
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm exec playwright test --config=playwright.live.config.ts
# Validate a local frontend against real upstream services instead:
LIVE_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm exec playwright test --config=playwright.live.config.ts
```

The live suite checks actual API responses, IGN search, route instructions, map asset loading and nonzero map/canvas dimensions on desktop and mobile. It is excluded from the default browser suite so ordinary tests do not consume external service quotas.


## 3D city exploration

The map starts with a closer, tilted view of Montbéliard's historic center. Buildings use solid, height-colored extrusions with directional lighting and an atmospheric horizon. Jour, Doré and Nuit presets restyle the existing map without downloading a different basemap or removing routes. The 2D view restores flat footprints and the fuller set of street/place labels.

Landmark viewpoints focus the historic center, Château and Près-la-Rose. The optional orbit tour stops on map interaction or when the tab is hidden, and is disabled for reduced-motion preferences. The immersive view hides the sidebar; Escape restores the normal layout.

The height slider is an explicitly labeled **visual exaggeration** from 1× to 2×. Default 1× uses mapped building heights with an 8 m fallback for missing values. It changes neither coordinates nor route distances, and does not make approximate building heights survey-grade. The pilot does not use a terrain elevation model or photorealistic building meshes.

The live scene tests cover all three lighting controls, height scaling, actual camera pitch, 2D/3D transitions, immersive layout, orbit controls, and reduced-motion behavior on desktop and mobile.

## First-person walking mode

Select **Marcher dans la ville** from the map's viewpoint tray. The mode uses a pedestrian-height camera (1.8 m above the flat map ground), spawns near a loaded street, and opens an immersive view.

- **WASD / ZQSD**: forward, back and strafe. Up/down arrows also move; left/right arrows turn.
- **Mouse/touch drag**: look around, including above street level. **Capturer la souris** optionally enables desktop mouse-look without dragging.
- **Shift**: sprint. On-screen movement/turn buttons and a speed toggle work on phones. Buttons also support held Enter/Space.
- **Escape / Quitter la marche**: exit, release mouse capture, and restore the previous aerial camera and 2D/3D mode.
- **Reset**: return to the starting street and direction. Movement stops when the window loses focus or the tab is hidden.

Buildings and water from currently loaded map tiles block movement; mapped bridge lines allow water crossings. Collision geometry follows the source map, including its omissions and simplifications. Exploration stays inside a 2.5 km pilot radius. This is a stylized virtual city with flat ground, not photographic Street View, a terrain simulation, or evidence of real-world accessibility. Walking uses client-side map data and adds no hosted game server or paid service.

`pnpm test:movement` checks movement distances, normalized diagonals, building clearance/courtyards, water/bridges and pilot bounds. Opt-in live browser tests additionally exercise keyboard movement, held on-screen controls, drag-look, desktop pointer lock, Escape and camera restoration on desktop/mobile.
