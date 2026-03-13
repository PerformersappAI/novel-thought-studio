

# LikenessVault — AI Likeness Licensing Marketplace

A two-sided marketplace where creators (actors, artists, speakers, freelancers) can license their face, voice, and likeness for approved AI use, and businesses can discover and license talent for their AI products.

## Design
- **Dark & techy** aesthetic — deep navy/black backgrounds, electric blue and gold accents, grid patterns, cyber-shield motifs
- Modern dashboard UI with glassmorphism cards and subtle glow effects
- Professional and trust-forward — this deals with identity, so it needs to feel secure

## Pages & Features

### 1. Landing Page
- Hero section: "Own Your Likeness. License It. Get Paid." with animated grid/silhouette
- How it works (3 steps for creators, 3 for businesses)
- Featured creators carousel
- Trust indicators (verified badges, security features, licensing stats)
- Pricing section & CTA

### 2. Authentication
- Sign up / login with email (Supabase Auth)
- Role selection: **Creator** or **Business**
- User profiles stored in database with role-based access

### 3. Creator Profile & Portfolio
- Upload photos, voice samples, video clips
- Bio, skills, categories (actor, model, voice artist, speaker, etc.)
- Set licensing tiers: Commercial / Non-commercial / Time-limited / Platform-specific
- Identity verification badge system (verified vs unverified)
- Public profile page viewable by businesses

### 4. Business Dashboard
- Browse & search creators by category, price, verification status
- Post licensing requests ("Need a voice for AI assistant, 30-day commercial license")
- View and manage active licenses
- Request history

### 5. Creator Dashboard
- Incoming license requests with accept/decline
- Active licenses overview
- Usage tracking dashboard — where and how their likeness is being used
- Earnings summary
- Portfolio management

### 6. Smart Licensing System
- Pre-built license templates: Commercial, Non-commercial, Time-limited, Platform-specific
- Custom terms per deal
- License status tracking (active, expired, pending)
- Digital agreement records with timestamps

### 7. Search & Discovery
- Filter by: category, price range, verification status, availability
- Sort by popularity, newest, price
- Creator cards with preview media and quick stats

### 8. Usage Tracking Dashboard
- Creators can log/track where their likeness is being used
- Status indicators (authorized / flagged / expired)
- Timeline of all licensing activity

## Backend (Supabase)
- **Auth**: Email-based signup with role selection
- **Database tables**: profiles, creator_portfolios, media_assets, license_templates, license_agreements, licensing_requests, usage_logs, verification_status
- **Storage**: For creator media uploads (photos, audio, video)
- **RLS**: Role-based access — creators see their own data, businesses see public profiles and their own requests
- **Edge Functions**: For any processing needs

## MVP Scope
This first version includes everything above — full marketplace with profiles, search, licensing, dashboards, and usage tracking. Payments can be integrated with Stripe as a follow-up.

