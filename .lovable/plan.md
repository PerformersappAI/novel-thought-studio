The scanner is currently too loose: it is pulling broad name-search results, including unrelated Will Roberts / Willie Robertson / generic legal sites, and the UI is displaying them as if they are valid identity matches.

Plan to fix it:

1. **Remove hardcoded identity assumptions**
   - Stop relying on the default actor ID and hardcoded `Will Roberts` search terms except as a fallback.
   - Resolve the current user’s real profile data: legal name, stage name, nicknames, profession, IMDb URL, Instagram, TikTok, YouTube, headshot, and external actor ID.

2. **Add a strict identity relevance gate before anything displays**
   - Every result must pass one of these rules before appearing:
     - exact saved handle match;
     - exact name plus actor/film/TV/profession context;
     - trusted known profile/domain match such as IMDb, official site, YouTube channel, or saved profile links;
     - photo result with a valid image source and strong face/likeness context.
   - Reject results that only match a common name with no actor/persona context.

3. **Fix Instagram/TikTok noise**
   - Treat saved handles as authoritative.
   - If a result is not the saved handle, require strong evidence before showing it as “possible impersonation.”
   - Filter out unrelated same-name people, family/wedding posts, sports accounts, charity posts, and “Willie Robertson”-type mismatches.

4. **Fix Web Mentions**
   - Replace broad web result acceptance with exact phrase + performer-context filtering.
   - Reject generic domains/pages unless the title/snippet/url contains the performer identity and actor context.
   - Do not show one random low-quality web result just to fill the section.

5. **Fix Photo Matches**
   - Keep Yandex image matches only when the image page/source is meaningful, not just a CDN/static asset.
   - Run Sightengine only after the result passes the relevance gate.
   - Mark deepfake/AI-image results as threats only when Sightengine flags them above threshold.

6. **Improve result labeling**
   - Add clearer labels: `Verified Match`, `Possible Impersonation`, `Needs Review`, `Rejected/Hidden`, `AI/Deepfake Alert`.
   - Stop showing everything as generic “Informational.”

7. **Persist only clean results**
   - Save/display filtered results in the local app database where possible.
   - Keep raw external/VPS scanner data out of the user-facing UI unless it passes our relevance rules.

Files/functions to update after approval:
- `src/pages/Monitoring.tsx`
- `supabase/functions/mentions-proxy/index.ts`
- `supabase/functions/actor-registry/index.ts`
- `supabase/functions/social-scan/index.ts`
- `supabase/functions/likeness-scan/index.ts`

Expected outcome:
- The scanner should stop showing unrelated Instagram/TikTok/web garbage.
- Results should only appear when they are actually tied to the performer’s mapped identity or are credible impersonation/deepfake candidates.