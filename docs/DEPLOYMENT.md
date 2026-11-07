# Free student deployment

Use **free plans only**. No VPS, paid Render database, private service, persistent disk, scheduled job or paid pre-deploy command is declared in this repository's `render.yaml`. No hosted service has been created by this setup. Review each provider's current free allowances before confirming; do not select a paid upgrade or enable usage billing. Free plans can sleep, throttle or change their quotas.

| Component | Free choice | Limitation |
| --- | --- | --- |
| Frontend | Vercel Hobby | Intended for personal/noncommercial projects; quotas apply |
| API | Render Free web service | Sleeps when idle; the first request may be slow |
| Database | Neon Free PostgreSQL with PostGIS | Compute/storage quotas and cold starts |
| Walking/cycling routes | OpenRouteService free Standard plan | API key and request quotas; no availability guarantee |
| Basemap | OpenFreeMap public tiles | Public service; attribution and usage rules apply |
| French address search | IGN Géoplateforme | Public service with usage limits |

Self-hosted Valhalla remains an optional **local** alternative on your own computer. Hosting its graph on Render would require resources and storage that are not included in this free setup, so it is not deployed there.

## 1. Create the free database

At https://neon.tech create a **Free** project, preferably near Render's Frankfurt region. Copy the database connection string from the dashboard. Keep TLS enabled; use `sslmode=verify-full` for certificate and hostname verification. Keep the connection string private.

The API migration enables the `postgis` extension and creates the spatial table/index automatically. The selected database user must be allowed to install this supported extension. Migrations are transactional and idempotent; later deployments preserve existing places.

## 2. Get a free routing key

Create a free OpenRouteService account at https://openrouteservice.org and create a key in its dashboard at https://dashboard.openrouteservice.org. Choose the free Standard plan. Enter the key only in Render's secret environment settings. Do not put it in Vercel's frontend, source code or chat.

The deployed API uses `ROUTING_PROVIDER=ors`. It sends requests to the official HTTPS API, normalizes walking/cycling routes and French instructions, and retains the required attribution. Missing keys, upstream outages and exhausted quotas return HTTP 503 instead of fabricated routes.

## 3. Deploy the API on Render

1. In https://dashboard.render.com choose **New → Blueprint** and connect `IliasMouatacim/CitySense`, branch `main`.
2. Render reads the root `render.yaml`. Confirm it contains **one Free web service only**. If the dashboard asks for a paid service, stop rather than accepting it.
3. Enter these secrets when prompted:
   - `DATABASE_URL`: the Neon connection string.
   - `ORS_API_KEY`: your free routing key.
4. Deploy. The Docker image builds from `apps/api/Dockerfile` with the repository root as build context. Its startup command applies migrations and starts NestJS. No paid pre-deploy job is used.
5. Copy the public HTTPS service origin Render assigns, such as `https://citysense-api-xxxx.onrender.com`. The actual suffix is chosen by Render.
6. Open `/health` on that origin. It must return `database: "connected"`. `/places` should list the four pilot places. Swagger is at `/docs`.

If importing manually as **New → Web Service**, select Docker, root directory **repository root** (leave blank), Dockerfile `apps/api/Dockerfile`, **Free** instance, health check `/health`, and Docker command `sh -c 'node dist/migrate.js && exec node dist/main.js'`. Set the two secrets above plus `NODE_ENV=production` and `ROUTING_PROVIDER=ors`.

## 4. Deploy the frontend on Vercel

1. Import the **web (Next.js)** project, using root directory `apps/web` and the **Hobby** plan.
2. Enable access to files outside the root directory if Vercel offers that option; the pnpm workspace and lockfile are at the repository root.
3. In environment variables set `API_URL` to the Render service's HTTPS **origin**, without `/api`, another path, or credentials. Set it for Production, and Preview if used.
4. Keep the checked-in build settings from `apps/web/vercel.json`. They install from the workspace root and build Next.js from `apps/web`.
5. Deploy, or **redeploy after changing API_URL**. Next.js bakes the rewrite destination into its build. A missing or local API_URL now fails Vercel's build with an explanation instead of deploying broken localhost requests.

Requests go from the browser to Vercel `/api/*`, then to Render. Database and routing credentials stay on Render. A cross-origin browser API configuration is unnecessary for this proxy flow.

## 5. Check the live student demo

- `/api/health` on the Vercel deployment returns `database: "connected"`.
- Search `gare`, select the railway station, and inspect nearby places.
- Switch to IGN addresses and search an address in Montbéliard.
- Select the park, choose the railway station as departure, and wait for a walking route. Check distance, duration, instructions and map geometry; then test cycling.
- Keep the accessibility-unknown label: no route has been field-verified for accessibility.

Render and Neon may need time to wake after inactivity. Open `/health` on Render first if the frontend initially times out. Do not add an artificial keep-alive job to defeat free-tier sleep policies.

## What is and is not verified here

The API Docker image is built and smoke-tested locally; database migrations, adapters and browser flows are tested. Hosted accounts and secrets are not configured here, and the Render/Vercel deployments have not been created. This cloud task's network policy still blocks some external services until its saved domain additions are applied. That cloud policy is separate from networking on Render, Vercel and visitors' browsers. Live hosted routing needs a real free OpenRouteService key; controlled adapter tests do not prove upstream availability.
