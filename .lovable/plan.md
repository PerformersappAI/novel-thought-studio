
# Simplify ClaimMyFace: Clear 3-Phase User Journey

## The Problem
The app has too many pages, cards, and options. Even you can't figure out what to do. The dashboard dumps everything at once — scores, certificates, monitoring, badges, alerts, next steps — and the sidebar is bare. There's no clear "what do I do next?" flow.

## The New Mental Model

Three clear phases a user moves through:

```text
Phase 1: CLAIM YOUR FACE (Free)
  Sign up → Profile → Face Capture → Voice Print → Done. You're claimed.

Phase 2: SEE YOUR STATUS  
  Dashboard shows: your face, your protection score, and any matches we found.
  Simple cards: "We scanned X platforms. Here's what we found."

Phase 3: TAKE ACTION
  If matches found → "Here's what you can do" (DMCA, Cease & Desist, Report, Contact SAG-AFTRA)
  If no matches → "You're clean. We'll keep watching."
```

## What Changes

### 1. Simplify the Dashboard Sidebar
Currently performers see only "Overview" and "Settings". Replace with a clear navigation:
- **My Protection** (the main dashboard — score, face, status)
- **Scan Results** (what monitoring found — consolidates alerts/monitoring pages)
- **Take Action** (DMCA, cease & desist, report, SAG-AFTRA contact info)
- **My Profile** (edit profile, assets, certificates — all in one place)
- **Settings**

### 2. Redesign the Main Dashboard (My Protection)
Strip it down to 3-4 clear sections instead of 8+:
- **Your Face** — photo thumbnails, registry ID, date claimed. Done.
- **Protection Score** — the big percentage circle. Keep it.
- **What We Found** — simple list: "0 matches" or cards showing matches. Link to full scan results.
- **What To Do Next** — ONE clear next step (not a list of 6). If they haven't done face capture, that's it. If they have, it's "Download Certificate" or "Review Matches."

Remove from the main dashboard: ProtectionJourney (redundant with score), CompletedSteps (clutter), the long NextSteps list (replace with single CTA), TakeActionList (move to its own tab), DashboardTrustFooter (unnecessary).

### 3. Add SAG-AFTRA / Guild Contact Info
Add a card or section in the "Take Action" area with:
- SAG-AFTRA AI & Digital Likeness contact info
- Link to file a complaint
- Brief guidance on when to contact the guild vs. handle it yourself

### 4. Simplify the Landing Page Flow
The landing page is actually decent. Main change:
- Make "Claim My Face — It's Free" even more prominent
- Ensure the signup → onboarding flow is seamless (it already is, mostly)

### 5. Clean Up Onboarding
The 5-step onboarding (Profile → Face → Voice → Certificate → Monitoring) is mostly fine, but:
- Make Voice Print truly optional with a clear "Skip for now" that doesn't feel like you're missing something critical
- After face capture + profile, immediately show "You're claimed!" — certificate and monitoring are bonuses, not gates

## Technical Changes

### Files to modify:
- `src/components/dashboard/DashboardLayout.tsx` — expand performer sidebar links
- `src/pages/PerformerDashboard.tsx` — simplify to 3-4 sections
- `src/pages/TakeAction.tsx` — add SAG-AFTRA contact info and guild resources
- `src/components/dashboard/NextSteps.tsx` — show single priority CTA instead of list

### Files to potentially remove or consolidate:
- `src/components/dashboard/ProtectionJourney.tsx` — redundant, remove from dashboard
- `src/components/dashboard/CompletedSteps.tsx` — redundant with score, remove from dashboard
- `src/components/dashboard/DashboardTrustFooter.tsx` — remove (clutter)

### No database changes needed.

## Result
A user signs up, claims their face in 5 minutes, lands on a clean dashboard that says "Your face is claimed. Here's your score. Here's what we found. Here's what to do." Simple.
