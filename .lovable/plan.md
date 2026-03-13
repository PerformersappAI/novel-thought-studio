

# Plan: Hero Spacing Fixes, Logo Enlargement, Menu Updates, Blog & Tools Pages

## 1. Hero Section Spacing & Logo Size (`HeroSection.tsx`)

- **Logo 100% bigger**: Change `h-72 md:h-[28rem]` to `h-[36rem] md:h-[56rem]` (double current size)
- **Reduce gap between logo and "Protect Your Likeness"**: Change `mb-2` to `mb-0` and reduce `py-20` to `py-8`
- **Reduce gap between buttons and performers image**: Change `mt-4` to `mt-1` on the performers hero wrapper
- **Reduce `mb-6`** on heading and description to `mb-3`

## 2. Navbar — Add "Education" and "Tools" links (`Navbar.tsx`)

Add two new nav items:
- **Education** → links to `/education` (blog page)
- **Tools** → links to `/tools` (AI tools hub page)

These are route links (not anchor scrolls) since they go to separate pages.

## 3. Blog / Education Page (`src/pages/Education.tsx`)

- Create a blog listing page that fetches posts from a new `blog_posts` table
- Each post has: title, slug, excerpt, content, cover image URL, author, published date, category
- Display as a card grid with categories for filtering (Privacy, AI Protection, Industry News, etc.)
- Individual post view at `/education/:slug`

## 4. Blog Database Table

New `blog_posts` table with columns: `id`, `title`, `slug`, `excerpt`, `content`, `cover_image_url`, `author_name`, `category`, `is_published`, `published_at`, `created_at`, `updated_at`

RLS: Admins can CRUD all posts. Public can SELECT where `is_published = true`.

## 5. Tools Page (`src/pages/Tools.tsx`)

- Create a tools hub page showing available AI-powered tools as cards
- Initial placeholder tools: Avatar Creator, Contract Generator, Invoice Builder, Digital Likeness Scanner
- Each card has an icon, title, description, and a "Coming Soon" or "Launch" badge
- This is a shell/directory page — individual tools will be elaborated later

## 6. Routing (`App.tsx`)

Add routes:
- `/education` → Education blog listing
- `/education/:slug` → Individual blog post
- `/tools` → Tools hub

## 7. Admin Blog Management

Add a blog management section to the existing Settings or create `/dashboard/blog` for admins to create/edit/delete blog posts with a simple form (title, content, category, publish toggle).

### Files to create:
- `src/pages/Education.tsx` — blog listing
- `src/pages/BlogPost.tsx` — individual post view  
- `src/pages/Tools.tsx` — tools hub
- `src/pages/AdminBlog.tsx` — admin blog management

### Files to modify:
- `src/components/landing/HeroSection.tsx` — logo size + spacing
- `src/components/landing/Navbar.tsx` — add Education & Tools links
- `src/App.tsx` — add new routes

### Database migration:
- Create `blog_posts` table with RLS policies

