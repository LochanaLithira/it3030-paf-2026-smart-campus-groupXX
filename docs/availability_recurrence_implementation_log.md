# Availability Recurrence Implementation Log

## Scope Completed

Implemented the previously partial availability feature for both Location and Resource with true recurrence support:

- `DAILY`
- `WEEKLY` (day of week)
- `MONTHLY` (day of month)

This change was limited to availability-related backend/frontend files plus one Flyway migration. No env/config files were changed.

## Files Changed

### Backend

- `backend/src/main/java/com/smartcampus/backend/model/enums/AvailabilityRecurrenceType.java`
- `backend/src/main/java/com/smartcampus/backend/dto/resource/LocationAvailabilityRequest.java`
- `backend/src/main/java/com/smartcampus/backend/dto/resource/ResourceAvailabilityRequest.java`
- `backend/src/main/java/com/smartcampus/backend/dto/resource/LocationAvailabilityResponse.java`
- `backend/src/main/java/com/smartcampus/backend/dto/resource/ResourceAvailabilityResponse.java`
- `backend/src/main/java/com/smartcampus/backend/model/LocationAvailability.java`
- `backend/src/main/java/com/smartcampus/backend/model/ResourceAvailability.java`
- `backend/src/main/java/com/smartcampus/backend/service/LocationService.java`
- `backend/src/main/java/com/smartcampus/backend/service/ResourceService.java`
- `backend/src/main/resources/db/migration/V7__availability_recurrence_support.sql`

### Frontend

- `frontend/src/types/api.ts`
- `frontend/src/components/resources/LocationEditorDialog.tsx`
- `frontend/src/components/resources/ResourceEditorDialog.tsx`

## What Was Implemented

### Backend Data Contract

- Added `AvailabilityRecurrenceType` enum with values `DAILY`, `WEEKLY`, `MONTHLY`.
- Extended availability request/response DTOs with:
  - `recurrenceType`
  - `dayOfMonth` (nullable/optional where relevant)
  - `dayOfWeek` kept but made recurrence-dependent

### Backend Persistence and Validation

- Added Flyway migration `V7__availability_recurrence_support.sql`:
  - Creates PG enum type `availability_recurrence_type` if missing
  - Adds `recurrence_type` and `day_of_month` to both availability tables
  - Relaxes `day_of_week` to nullable
  - Adds recurrence consistency CHECK constraints
- Updated JPA entities for new columns/enum mapping.
- Updated service validation rules:
  - `WEEKLY` requires `dayOfWeek`
  - `MONTHLY` requires `dayOfMonth`
  - `DAILY` must not carry weekly/monthly-only fields
  - duplicate-slot detection now includes recurrence dimensions
  - time order validation still enforced (`endTime > startTime`)

### Frontend Forms

- Extended API TS types for recurrence model.
- Location availability editor now supports recurrence per slot.
- Resource availability editor upgraded from single-slot to multi-slot and recurrence-aware slots.
- Both dialogs now support:
  - Add/remove multiple slots
  - Recurrence selector (`Daily`, `Weekly`, `Monthly`)
  - Conditional selector:
    - weekly => day of week
    - monthly => day of month
    - daily => no day selector

## Common Errors and Quick Fixes

- `Weekly availability requires day of week`
  - Cause: `recurrenceType=WEEKLY` but `dayOfWeek` missing.
  - Fix: send a valid `dayOfWeek` (`MON`..`SUN`) and keep `dayOfMonth` empty.

- `Monthly availability requires day of month`
  - Cause: `recurrenceType=MONTHLY` but `dayOfMonth` missing.
  - Fix: provide `dayOfMonth` between `1` and `31`; keep `dayOfWeek` empty.

- `Day of week is only allowed for weekly availability`
  - Cause: payload includes `dayOfWeek` when recurrence is not weekly.
  - Fix: set `dayOfWeek=null/undefined` for `DAILY` and `MONTHLY`.

- `Day of month is only allowed for monthly availability`
  - Cause: payload includes `dayOfMonth` when recurrence is not monthly.
  - Fix: set `dayOfMonth=null/undefined` for `DAILY` and `WEEKLY`.

- `Availability end time must be after start time`
  - Cause: `startTime >= endTime`.
  - Fix: use strictly increasing time range.

- `Duplicate availability slots are not allowed`
  - Cause: same recurrence + same day dimension + same time range repeated.
  - Fix: remove duplicate slot.

## Manual Verification Checklist (When Docker/Runtime Is Available)

1. Run backend migration and startup; ensure `V7` applies cleanly.
2. Create Location with each recurrence type:
   - daily slot
   - weekly slot
   - monthly slot
3. Edit Location and verify slots persist and update correctly.
4. Create Resource with multiple mixed recurrence slots.
5. Edit Resource with add/remove/update slots.
6. Verify invalid combinations return expected 422/400 messages.
7. Verify old weekly records still load as `WEEKLY` after migration.

## Notes

- Backend compile check succeeded locally (`mvnw -DskipTests compile`).
- Frontend build check could not run because TypeScript binary was not available in this machine environment (`tsc` not found).
