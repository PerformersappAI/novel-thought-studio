## Goal
Simplify the dashboard left-hand menu to match the "1-2-3" approach, and remove agent-as-instigator features by replacing direct cease-and-desist actions with copy-paste email templates.

## 1. Condense the sidebar (`src/components/dashboard/DashboardLayout.tsx`)

Reduce 11 items → **5 grouped items**:

```text
1. My Protection      (/dashboard)         — overview/identity map
2. Scan Results       (/dashboard/monitoring) — what we found
3. Take Action        (/dashboard/take-action) — copy/paste takedown templates
4. My Profile         (/dashboard/profile)
5. Settings           (/dashboard/settings)
```

Removed from sidebar (routes stay live, just unlinked from the nav):
- **Education** — already in the top nav, redundant here
- **Scan Reports**, **Claim Scanner**, **Contract Scanner** — fold under "Scan Results" page or access via top nav / direct links later
- **Report Violation**, **Emergency Response**, **Secure Checklist** — consolidate intent into "Take Action" (templates + guidance)

This keeps the left menu the same easy-as-1-2-3 mental model as the homepage: Profile → See where you're at → Go after it.

## 2. Replace "go after them" actions with copy-paste templates

In `src/pages/TakeAction.tsx` (and any "Not Me" / thumbs-down handler in the matches table):
- Remove any UI/flow that submits cease-and-desist, contacts third parties, or files reports on the user's behalf.
- Replace with a **"Generate Takedown Email"** panel:
  - Dropdown for reason: Deepfake, Voice clone, Unauthorized avatar, Old/unapproved content, Other
  - Pre-filled email template (subject + body) that mentions the source URL and user's name
  - **Copy button** (clipboard) + short guidance: "Paste this into your email and send it to the site owner / platform abuse contact. ClaimMyFace does not send these on your behalf."
  - Small disclaimer: not legal advice; consult an attorney for escalation.

For the "Not Me" / thumbs-down on a match row: instead of an emergency-response flow, route the user to the Take Action page pre-loaded with that match's URL and a suggested template.

## 3. Out of scope (this turn)
- No backend/schema changes.
- Removed sidebar routes remain accessible via direct URL — we just stop promoting them. We can fully delete them in a later pass once you confirm.

## Files to edit
- `src/components/dashboard/DashboardLayout.tsx` — trim sidebar items
- `src/pages/TakeAction.tsx` — template generator + copy button + disclaimer
- `src/components/dashboard/MentionsTable.tsx` (or wherever "Not Me" lives) — route thumbs-down to Take Action with prefilled context, not an outbound action
