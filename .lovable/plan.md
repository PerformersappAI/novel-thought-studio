

# Plan: Logo Integration, Hero Text Resize, Admin Settings, and UX Overhaul

## 1. Add Logo Image to Navbar and Hero

- Copy the uploaded logo (`9AE73F14-DB84-4F76-8096-AA8CB3341922.PNG`) to `src/assets/logo.png`
- Copy the performers image (`DD21A152-77B6-4CB6-AA00-E87009E2BEC3.PNG`) to `src/assets/performers-hero.png`
- **Navbar**: Replace the Shield icon + "Replica Shield TM" text with the actual logo image (sized ~40px height for nav)
- **DashboardLayout sidebar**: Same logo swap
- **Signup & Login pages**: Same logo swap

## 2. Hero Section Text Resize

- Make "Protect Your Likeness. Register. Verify. Shield." significantly smaller — from `text-5xl md:text-7xl lg:text-8xl` down to approximately `text-2xl md:text-3xl lg:text-4xl`
- The logo above it will be the visual anchor (displayed large, ~200-300px wide in hero)
- Add the performers hero image below or alongside the hero text as a visual banner

## 3. "How It Works" — Glowing Icon Step Guide (HowToSelfTape-inspired)

Redesign the HowItWorks section into a horizontal step-by-step bar with glowing icons, inspired by howtoselftape.com's toolbox nav pattern:

- **Horizontal strip at top of the section** with numbered glowing circle icons connected by lines
- Each step icon glows (gold or blue) with a label underneath
- Steps: Create Account → Verify Identity → Upload Assets → Get Reviewed → Receive Certificate → Monitor Usage
- Clicking a step scrolls to or reveals more detail below
- This same step indicator pattern will be reused inside the signup/onboarding flow to show progress

## 4. Admin Settings Page

Create a new **Settings page** (`/dashboard/settings`) that is already in the sidebar nav but has no page yet:

**For Admin role:**
- **Platform Settings**: Edit site name/tagline, manage subscription plan pricing (CRUD on `subscription_plans` table)
- **Legal Document Management**: View/edit/create legal documents (CRUD on `legal_documents` table) 
- **User Management Quick Stats**: Link to users page
- **Notification preferences**

**For Performer role:**
- **Profile Settings**: Edit full name, display name, bio, phone, avatar
- **Account Settings**: Change password, email preferences
- **Subscription Info**: View current plan status

Route: `/dashboard/settings` — already wired in `DashboardLayout` sidebar links, just needs the page component.

## 5. Admin Users Page

Create `/dashboard/users` page for admins:
- List all profiles with verification status
- Search/filter by name, verification status
- Quick actions: view details, change roles

## 6. Admin Legal Logs Page

Create `/dashboard/legal` page for admins:
- View audit log entries
- View consent signatures
- Filter by date, user, action type

## 7. Improved Onboarding UX Throughout

- Add a **step progress indicator** component (reusable) that shows where the user is in the process
- Use it on: Signup flow, Identity Verification page, Asset Upload page
- Each step has a glowing icon, label, and active/complete/upcoming state
- Make all forms more explanatory with helper text, tooltips, and clear descriptions at each stage

## Technical Details

**Files to create:**
- `src/assets/logo.png` (copy from upload)
- `src/assets/performers-hero.png` (copy from upload)
- `src/pages/Settings.tsx` — shared settings page with role-based tabs
- `src/pages/AdminUsers.tsx` — user management for admins
- `src/pages/AdminLegalLogs.tsx` — audit/legal log viewer
- `src/components/StepIndicator.tsx` — reusable glowing step progress component

**Files to modify:**
- `src/App.tsx` — add routes for settings, users, legal
- `src/components/landing/Navbar.tsx` — logo image swap
- `src/components/landing/HeroSection.tsx` — smaller text, logo image, performers image
- `src/components/landing/HowItWorks.tsx` — redesign with glowing horizontal step icons
- `src/components/dashboard/DashboardLayout.tsx` — logo image swap
- `src/pages/Signup.tsx` — logo swap, add step indicator
- `src/pages/Login.tsx` — logo swap
- `src/pages/IdentityVerification.tsx` — add step indicator
- `src/pages/MyAssets.tsx` — add step indicator

**No database changes needed** — all tables already exist. The admin settings page will use existing `subscription_plans`, `legal_documents`, `profiles`, `audit_log`, and `consent_signatures` tables.

