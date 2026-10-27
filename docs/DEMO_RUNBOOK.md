# SoundWave Pass — 10-minute Demo Runbook

## Before the demo

- Start the frontend and backend; confirm `/api/health` responds.
- Confirm seed data contains an upcoming event with at least one available zone.
- Use a LINE account that has added the SoundWave Official Account.
- Keep one valid demo ticket and one already-used ticket available for scanning.
- Open the A4 ticket view and confirm the printer or Save as PDF option is ready.
- Do not present demo payment confirmation as a real payment transaction.

## Live demo

| Time | Action | What to show |
|---|---|---|
| 0:00–1:00 | Introduce SoundWave Pass | Concert discovery and the rock-festival visual theme |
| 1:00–2:00 | Open a concert | Event details, artists, timetable, venue map, and ticket zones |
| 2:00–4:00 | Reserve seats | Availability, seat selection, live total, and reservation hold |
| 4:00–5:00 | Confirm demo payment | Explain that this build simulates payment; show issued ticket codes |
| 5:00–6:00 | Show LINE chat | Display the Flex Message delivered to the connected LINE account |
| 6:00–7:00 | Print the ticket | Open the A4 view, save or print, and show the physical ticket if available |
| 7:00–8:30 | Scan a valid ticket | Sign in as gate staff, scan QR, and show the successful check-in |
| 8:30–9:00 | Scan the same ticket again | Show the duplicate-use rejection |
| 9:00–10:00 | Show Admin dashboard | Summaries, event management, poster upload, and check-in totals |

## Recovery plan

- If LINE is unavailable, show a previously delivered Flex Message and explain the external service dependency.
- If the camera is unavailable, enter the ticket code manually in the scanner.
- If the printer is unavailable, show the saved PDF and the physical print settings used for the rehearsal.
- If the live API is unavailable, stop the booking demonstration and show the recorded Bug Bash notes; do not imply that a failed action succeeded.
