
Plan: Reposition and enlarge the Replica Shield seal so it sits lower-right under the ring light (near knees/shins), and make it feel wider.

1) Update only `src/components/landing/HeroSection.tsx`
- Target the `motion.img` logo class (currently `bottom-[2%] right-[18%] w-64 md:w-80 ...`).

2) Move logo to the correct lower-right corner zone
- Shift farther right and lower so it is clearly below the ring light:
  - `right-[4%]` (instead of `right-[18%]`)
  - `bottom-[-6%]` (instead of `bottom-[2%]`)
- Keep it anchored to corner feel with `origin-bottom-right`.

3) Make logo 100% bigger and slightly stretched
- Double desktop size from `md:w-80` to `md:w-[40rem]` (100% increase).
- Use responsive sizing so mobile doesn’t break:
  - `w-[20rem] md:w-[40rem] lg:w-[44rem]`
- Add subtle horizontal stretch:
  - `scale-x-110` (or `scale-x-[1.1]`) for the “more space” look.

4) Keep existing animation/opacity behavior
- Preserve the current fade-in and opacity target unless you want it stronger after resize.

5) Quick visual validation after change
- Confirm at desktop viewport that the seal is:
  - below the ring light,
  - near knee/shin level,
  - in the lower-right corner,
  - visibly larger and wider without dominating the whole frame.
- If still a bit high/left, final tuning knobs are only:
  - `bottom-[-8%]` (lower)
  - `right-[2%]` (more cornered).
