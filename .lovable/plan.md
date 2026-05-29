## Goal

Right now the sample profiles (Ava, Marcus, Nora) show fields on their `/registry/[slug]` pages — Demo Reel, Website link, Instagram/TikTok/YouTube **follower counts**, and **Special Skills** — that performers have no way to enter from their own Profile tab. So real users' public registry pages look empty compared to the samples.

Make the Profile tab capture every field the public registry page can display, and push them all to the public page on save.

## What to add to the Profile tab (`src/pages/PerformerProfileTab.tsx`)

Extend the existing **Public Talent Registry** section with new inputs (these columns already exist on `registry_performers`, no DB migration needed):

- Demo Reel URL (YouTube link — embeds automatically on the public page)
- Personal Website URL
- Instagram followers (number)
- TikTok followers (number)
- YouTube subscribers (number)
- Special Skills (comma-separated, e.g. "Stage Combat, Horseback Riding, Mandarin")

Load these from the existing `registry_performers` row on mount, and include them in the upsert payload of the existing **Save Registry Settings** button. No new save button.

## Already wired (no work needed)

- Headshot, bio, profession, union status, experience level, agent name, IMDb, Instagram URL, YouTube URL → already mirrored from `profiles` to `registry_performers` by the `sync_profile_to_registry` trigger and rendered on `/registry/[slug]`.
- Public page (`RegistryPerformer.tsx`) already renders Demo Reel embed, Social & Influence stats, and Special Skills when the registry row has those values — it just hasn't had data to show.

## Result

A performer fills out their Profile tab → toggles "List me on the Talent Registry" → their public `/registry/[their-slug]` page renders the same rich layout as Ava / Marcus / Nora, populated from their own data.

## Out of scope

- Auto-scraping follower counts from Instagram/TikTok/YouTube (manual entry for now; can add a scraper later if you want).
- Schema changes — all required columns already exist on `registry_performers`.
