
# Face Capture Page Fixes

## Problems Identified

1. **Camera not detecting face on initial load**: When the camera first opens with the default device, `getUserMedia` sometimes returns a stream that isn't fully "active" yet. The face detection loop starts immediately but the video may not be ready, causing no face to be detected. Switching cameras forces a fresh `getUserMedia` call which works. The root cause is that `enumerateDevices()` before permission grant returns devices without labels/IDs, and the initial stream may bind to an unexpected device.

2. **Capture button requires multiple presses**: The `captureCurrent` function is disabled when `!faceDetected`. The face detection loop runs every 180ms and `faceDetected` flickers between true/false rapidly. When you press the button at the wrong moment (face not detected that frame), the click is ignored. The button also runs an async face descriptor computation for the front pose which takes time, during which there's no visual feedback that the capture succeeded.

3. **No shutter sound**: There's no audio feedback when a photo is captured.

4. **Missing bold privacy disclaimer**: The existing privacy note is small and subtle. User wants a prominent, unmissable statement.

## Plan

### Fix 1: Stabilize camera initialization
- Add a short delay after `video.play()` before starting the detection loop (wait for `loadeddata` event on the video element instead of immediately calling `runDetectionLoop`).
- This ensures the video stream is actually producing frames before face detection begins.

### Fix 2: Stabilize face detection state and add capture feedback
- Add a "sticky" face detection state: once a face is detected, keep `faceDetected = true` for at least 500ms even if a single frame misses (debounce the false state). This prevents the capture button from flickering disabled/enabled.
- Show a brief white flash overlay on the camera view when a photo is captured, giving immediate visual confirmation.
- Disable further clicks during the async capture process (add a `capturing` state).

### Fix 3: Add camera shutter sound
- Create an `Audio` object with a shutter click sound (use a small base64-encoded WAV or a public domain click sound URL).
- Play the sound synchronously inside `captureCurrent` right when the frame is grabbed, before the async face descriptor work begins.

### Fix 4: Add bold privacy disclaimer
- Add a prominent, visually distinct banner near the camera area (visible both when camera is open and in the review section) with bold text:
  > **"We are NOT using these photos for anything other than making sure that your face is your claim. This will not be used in any way, shape, or form on any other platform or LLM."**
- Style it with a border, icon, and bold/uppercase treatment so it's impossible to miss.

## Files to modify
- `src/pages/OnboardingFaceCapture.tsx` — all four fixes in this single file
