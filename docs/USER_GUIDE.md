# SoundWave Pass — User Guide

This guide covers the existing customer, event organizer, and gate staff flows. It does not require any changes to the current page design.

## Customers

1. Open the SoundWave Pass home page and choose a concert.
2. Review the event details, schedule, location, and ticket zones.
3. Open zone selection, choose seats, enter a name and phone number, and connect LINE if you want the ticket sent to chat.
4. Continue to the payment page. The current project uses a demo payment confirmation, not a real bank or payment gateway.
5. After confirmation, open the ticket or its A4 print view. Save as PDF or print from the browser's print dialog. For A4, choose landscape orientation and 100% scale when the printer supports it.
6. Keep the QR code visible. Gate staff scan that code to validate admission.

## Event organizers

1. Open `/admin` and sign in with the separate organizer account. Organizer accounts are separate from gate staff accounts.
2. Review event totals and check-ins, create or update a concert, add ticket zones, and upload poster images.
3. Use the seat and capacity tools only after confirming that the event's inventory is correct.

## Gate staff

1. Open `/scanner` and sign in with the staff account assigned to the gate.
2. Allow camera access, start scanning, and point the camera at the ticket QR code. The page also accepts manual ticket-code entry.
3. A valid ticket is marked as used; a second scan is rejected. Use the result shown on screen to decide whether to admit the attendee.
4. Sign out when the shift ends. Staff sessions expire after eight hours.

## Local development

The local seed creates demo organizer account `owner` (password `1234`) and staff accounts `faye` (Supervisor), `nam`, and `staff01` (Gate Staff; password `1234`). These credentials are local-only. Production seed passwords are supplied through environment variables and stored as hashes.

From the project folder, run the frontend and backend in separate terminals:

```powershell
npm run dev:backend
npm run dev:frontend
```

The frontend uses `http://localhost:5173` and proxies API and upload requests to the backend at `http://localhost:5000`. If the Prisma schema changes, run `npm --prefix backend run db:push` before starting the backend.

For an existing local database that already contains bookings, run `npm --prefix backend run db:ensure-organizer` to add the local organizer account without reseeding or deleting records. The local demo login is `owner` / `1234`; set `SEED_ORGANIZER_PASSWORD` before provisioning to choose a different password.

## Current scope

- Payment is a demonstration flow. It does not verify a PromptPay transfer or charge a bank card.
- LINE ticket delivery requires the correct LINE channel credentials and a user who has added the Official Account.
- The local SQLite database and local upload folder are for development. The Render setup in `docs/DEPLOYMENT.md` attaches persistent storage for the demo deployment.
