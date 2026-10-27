# SoundWave Pass — Cross-Team Bug Bash

Use this worksheet during the joint session with Team Beta. Record observed results; do not mark a case passed without trying it on the target device.

## Session record

| Field | Value |
|---|---|
| Date and time | |
| Tester / team | |
| Browser and version | |
| Device and screen size | |
| App URL / build | |
| Test data reset by | |

## Test cases

| ID | Area | Action | Expected result | Result / issue ID |
|---|---|---|---|---|
| B01 | Home | Open the home page on desktop and mobile widths | Event cards and navigation remain usable; no horizontal overflow | |
| B02 | Concert | Open an event with a schedule and map | Event details, timetable, location, and zones match saved data | |
| B03 | Booking | Select one ticket, then increase and decrease quantity | Price updates; unavailable zones cannot be selected | |
| B04 | Seats | Open the same zone in two browser sessions and choose the same seat | The second reservation is rejected and the seat is shown as occupied | |
| B05 | Booking validation | Submit with missing name, invalid phone, or no seat | A clear validation message appears; no booking is created | |
| B06 | Hold expiry | Leave a pending booking past its ten-minute hold | Booking expires and inventory is returned once | |
| B07 | Demo payment | Confirm an active booking, then reload its confirmation page | Tickets are issued once and remain visible after reload | |
| B08 | LINE | Connect LINE, finish a demo booking, and inspect the recipient chat | Correct buyer receives the expected ticket Flex Message | |
| B09 | Ticket | Open ticket and A4 print views | Ticket details and QR code match the issued record | |
| B10 | Print | Save as PDF, then print the PDF on A4 landscape | Ticket is legible, correctly scaled, and not clipped | |
| B11 | Scanner | Scan a valid QR code, then scan it again | First scan passes; repeated scan is rejected | |
| B12 | Scanner | Try an invalid and a cancelled ticket | Both are rejected with the correct status | |
| B13 | Staff access | Call scan verification without a staff session | API rejects the request | |
| B14 | Admin access | Open admin with a gate-staff account | Admin API rejects the account; existing page design stays unchanged | |
| B15 | Admin | Create an event, upload a poster, and reload the page | Event and poster remain available | |
| B16 | API errors | Stop the backend while the frontend is open | The page shows a recoverable error instead of appearing to submit successfully | |

## Issue log

| Issue ID | Steps to reproduce | Expected | Actual | Severity | Owner | Status |
|---|---|---|---|---|---|---|
| BUG-001 | | | | | | |

## Exit checklist

- [ ] All P0/P1 issues have a fix or an accepted mitigation.
- [ ] Booking, LINE delivery, ticket display, scan-once behavior, and print output have been demonstrated end to end.
- [ ] Team Beta has reviewed the issue log and agreed on the remaining items.
- [ ] Record the final app commit and deployment URL in the session record.
