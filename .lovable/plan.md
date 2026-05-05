
# Fix 6 Registration Bugs

## 1. Redirect to dashboard after email confirmation

**Problem:** `emailRedirectTo` in `useAuth.tsx` points to `window.location.origin` (root `/`), so confirmed users land on the homepage instead of the dashboard.

**Fix:** Change `emailRedirectTo` to `window.location.origin + '/dashboard'`. Also add logic in `ProtectedRoute` or `App.tsx` to handle the auth callback token exchange on `/dashboard` (Supabase handles this automatically when the redirect URL matches a route).

## 2. Auto-save profile fields on change

**Problem:** If the user leaves mid-registration, form data is lost.

**Fix:** In `Register.tsx`, add a debounced auto-save function that writes `legal_name`, `stage_name`, and AKAs to the `profiles` table whenever a field changes (only when `user` is logged in). On mount, prefill fields from the existing profile. Use a ~1s debounce to avoid excessive writes.

## 3. Camera error fallback to upload

**Problem:** `startCamera()` catches the error and shows a toast, but doesn't offer an alternative.

**Fix:** Add a `cameraError` state. When `startCamera()` fails, set `cameraError = true` and show the "Upload Photos" button prominently instead. The upload button already exists but is hidden when camera isn't open.

## 4. Loading screen with logo and progress message

**Problem:** The `handleFinish` function shows `submitting=true` with just a spinner text "Saving..." on the button, and a black/empty screen during the upload process.

**Fix:** When `submitting` is true during `handleFinish`, render a full-screen overlay with the ClaimMyFace logo, a progress bar, and rotating messages like "Setting up your protection...", "Encrypting your biometrics...", "Finalizing your profile...".

## 5. Animated side photo guide overlay

**Problem:** Users don't know which way to turn for left/right photos.

**Fix:** Add an animated arrow/head-turn indicator on the camera overlay for left and right poses. Show an animated SVG arrow pointing left or right with a pulsing "Turn your head this way" label overlaid on the camera view.

## 6. Prevent camera restart after capture complete

**Problem:** After all 3 photos are captured, the user can still open the camera again.

**Fix:** When `allCaptured` is true, don't show "Open Camera" or "Upload Photos" buttons. Show "Photos already captured" with review thumbnails and a "Retake All" button. The current code partially does this but `cameraOpen` state can still be toggled.

---

## Files to modify

- `src/hooks/useAuth.tsx` — change `emailRedirectTo` to `/dashboard`
- `src/pages/Register.tsx` — all other 5 fixes (auto-save, camera fallback, loading overlay, side guides, capture state management)
