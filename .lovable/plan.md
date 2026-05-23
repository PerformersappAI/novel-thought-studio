Plan to fix both issues:

1. Fix the Save Changes failure
- Add a database migration that restores permission for logged-in users to run the existing `has_role` helper.
- This directly addresses the current error: `permission denied for function has_role`.
- After this, profile updates should save without kicking you back into the login/profile loop.

2. Fix the incorrect “Planned” scan labels
- Update the dashboard scan status cards so working scanner categories are not hardcoded as `planned`.
- Specifically remove the planned badge behavior from `Deepfake Video` and `Social Impersonators` if these scanners are live.
- Adjust the empty-state copy from “scanner coming soon” to a neutral active-service message like “No recent scan yet.”

3. Verify behavior
- Confirm the database permission is active.
- Confirm the dashboard no longer shows those working scan types as planned.

Technical details:
- Database fix: grant execute permission on `public.has_role(uuid, public.app_role)` to authenticated users.
- UI fix: edit `src/components/dashboard/ScanStatusCards.tsx` to stop treating live categories as planned unless there is a real disabled/planned state from data.