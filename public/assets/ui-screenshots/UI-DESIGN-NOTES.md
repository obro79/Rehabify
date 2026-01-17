# UI Design Reference Notes

## Color Palettes

### Option A: Sage Green (Screenshots 1-2)
- Primary: Muted sage green (`#8B9F82` / `#A3B899`)
- Background: Cream/off-white (`#F5F3EE`)
- Cards: White with soft shadows
- Accent: Darker green for nav icons
- **Vibe:** Calming, clinical, trustworthy

### Option B: Warm Terracotta (Screenshots 3-5)
- Primary: Warm coral/terracotta (`#D4A59A` / `#C4816D`)
- Background: Warm beige/paper texture (`#F5EDE6`)
- Cards: Cream white
- Accent: Muted greens, soft oranges
- **Vibe:** Friendly, approachable, wellness-focused

## Key UI Components

### Dashboard/Home
- Welcome message with user name ("Welcome back, Sarah")
- Exercise cards with 3D character illustrations
- Progress chart (area chart, weekly view)
- Streak counter / daily motivation quote
- Quick-start buttons for exercises

### Exercise Session View (Critical for Demo)
- Live camera feed with skeleton overlay
- Flip camera / Guide image toggles
- Real-time metrics:
  - Rep counter (8/10)
  - Form score bar (95%)
  - Current phase indicator (CAT → CAMEL)
- Pause / End Session buttons
- Timer display

#### Skeleton Overlay Styling (Brand-Matched)
Keep the overlay visible for hackathon (proves AI is working) but style it to feel integrated:

**Colors:**
- Joint points: Sage green circles (`#8B9F82`) with subtle white border
- Limb connections: Lighter sage/cream (`#A3B899` or `#E8E4DC`)
- Error highlight: Warm coral accent (`#D4A59A`) for joints needing correction

**Style:**
- Thicker lines (3-4px) with rounded line caps (friendlier, less clinical)
- Lower opacity (70-80%) so user sees themselves clearly
- Optional: subtle blur/glow on joints for softness
- Only render key joints (shoulders, elbows, wrists, hips, knees, ankles) - skip face/hands

**Error States:**
- Pulse/highlight problem joints in coral
- Brief visual cue synced with voice correction

This makes the overlay feel like a design choice, not "MediaPipe default slapped on top."

### Exercise Library
- Search bar
- Category filters (Weekly, Retroactivity, Core)
- Exercise cards with:
  - 3D illustration
  - Exercise name
  - Brief description
- Weekly plan view (calendar-style)

### Progress & Analytics
- Area chart (daily/weekly toggle)
- Stats cards: Streaks, Time, XP
- Calendar with completed days highlighted
- Gamification elements:
  - Streak flames
  - XP points
  - Achievement badges

### Profile/Settings
- Avatar display
- Account settings tabs
- Toggle switches for preferences
- Clean form inputs

## 3D Character Style
- Soft, rounded 3D illustrations
- Muted color palette (greens, beiges, corals)
- Characters demonstrating exercise poses
- Friendly, non-intimidating aesthetic

## Typography
- Clean sans-serif headers
- Readable body text
- Generous whitespace

## Mobile vs Desktop
- Screenshots show both mobile (4-screen layouts) and desktop (sidebar nav)
- Mobile: Bottom tab navigation (Home, Stats, Favorites, Profile)
- Desktop: Left sidebar with icon + text labels

## Recommended for Hackathon

**Go with Sage Green palette** - it's:
1. More clinical/professional (judges in health track will appreciate)
2. Easier to implement consistently
3. Higher contrast for demo visibility

**Priority screens to nail:**
1. Exercise Session View (the "wow" moment - skeleton overlay)
2. Dashboard/Home (first impression)
3. Exercise Library (shows breadth)

Skip for MVP: Community features, detailed analytics, gamification beyond basic streaks
