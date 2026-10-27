# SoundWave Pass — Deployment Notes

The repository now includes a Render Blueprint and Vercel configuration. The blueprint uses a persistent Render disk for the existing SQLite database and uploaded poster files. Render documents that a service with a persistent disk cannot scale to multiple instances, and persistent disks are not available on free web services. This setup is suitable for a single-instance school demo; move to PostgreSQL and object storage before expecting production traffic.

## 1. Deploy the backend on Render

1. Push this repository to GitHub and create a Render Blueprint from its root `render.yaml`.
2. The blueprint creates a single Node web service with a persistent disk. Review the selected plan and storage cost in Render before creating it.
3. Set these prompted environment values in Render:
   - `PUBLIC_APP_URL`: the final Vercel site origin, such as `https://soundwave-pass.vercel.app`.
   - `LINE_LOGIN_CHANNEL_ID` and `LINE_LOGIN_CHANNEL_SECRET` from the LINE Login channel.
   - `LINE_LOGIN_CALLBACK_URL`: `https://<your-vercel-domain>/booking/zone-select`; register the exact same URL in LINE Developers.
   - `LINE_CHANNEL_ACCESS_TOKEN` and `LINE_CHANNEL_SECRET` from the Messaging API channel.
   - `SEED_ORGANIZER_PASSWORD`, `SEED_SUPERVISOR_PASSWORD`, and `SEED_GATE_PASSWORD` for the first seed operation.
4. The service syncs the Prisma schema on startup. After the first deploy, initialize a fresh database with `npm run db:seed` from the Render Shell. Seeding resets demo records, so never run it against a database containing bookings. Remove all three seed password environment variables after creating the accounts.
5. Open `https://<your-render-domain>/api/health` and confirm it returns `status: OK`.

## 2. Deploy the frontend on Vercel

1. Import the repository into Vercel and set the project Root Directory to `frontend`.
2. Add `RENDER_API_URL` as an environment variable containing the backend origin, for example `https://soundwave-pass-api.onrender.com`.
3. Deploy. `frontend/vercel.ts` sends `/api/*` and `/uploads/*` to the backend while keeping the browser on the Vercel site origin.
4. Add the final Vercel domain to the LINE Login channel's callback allowlist and update `LINE_LOGIN_CALLBACK_URL` and `PUBLIC_APP_URL` on Render if the generated domain differs.
5. Confirm home page, direct page refresh, booking, LINE Login, ticket image uploads, and `/api/health` through the Vercel domain.

## 3. Operations and limitations

- Do not commit `.env`, LINE secrets, or staff credentials.
- Admin APIs require a signed-in organizer account; scanning requires a signed-in staff account. Organizer and gate staff sessions use separate tables and login flows. Staff passwords are stored as scrypt hashes.
- Store a backup of `/var/data/soundwave.db` before changing or removing the Render disk.
- This deployment still uses the demo payment endpoint. Do not accept real payments until payment verification is implemented.
