# UX/UI Audit -- JyotishAI

**Date:** 2026-02-24
**Persona:** Senior UX/UI Designer (10+ years, product-led companies)
**Scope:** All components in `web/src/components/`, all pages in `web/src/app/(main)/` and `web/src/app/(auth)/`, design system configuration

---

## Executive Summary

JyotishAI has a solid foundation of well-typed visualization components and a consistent Celestial Dark theme defined in CSS variables, but the application is in an early-mid stage where most components are built as isolated, self-contained units that are **not yet wired into the actual page routes**. The pages that exist (dashboard, profile detail, settings, transits) use plain server-rendered HTML with the design system tokens, while the rich interactive components (KundliChart, DashaTimeline, SolarSystem3D, YogaGrid, ChatInterface, ReportViewer, TransitWheel, AlertBell) sit entirely unused in the codebase. There are critical missing pages (chart view, reports list, chat), an SSR-fatal issue with the Three.js component, and significant accessibility gaps throughout.

---

## Critical Issues (Must Fix)

### 1. SolarSystem3D will crash in Next.js SSR -- no `dynamic()` import with `ssr: false`

**File:** `web/src/components/solar-system/SolarSystem3D.tsx`

The component directly imports `@react-three/fiber`, `@react-three/drei`, and `three` at the top level with `'use client'`. While `'use client'` marks a client component boundary, Next.js still server-renders client components on the first pass. The `Canvas` component from R3F accesses `window`, `document`, and WebGL APIs that do not exist during SSR, which will cause a hard crash.

**Required fix:** Create a dynamic wrapper:
```tsx
// web/src/components/solar-system/SolarSystem3DWrapper.tsx
import dynamic from 'next/dynamic';
const SolarSystem3D = dynamic(() => import('./SolarSystem3D').then(m => m.SolarSystem3D), { ssr: false });
export default SolarSystem3D;
```

No page currently imports this component, so it has not blown up yet -- but the moment anyone adds it to a route, the build will fail.

### 2. No chart view page exists -- `/chart/[id]/` route is completely missing

**FEATURES.md F2.1 through F2.7** describe an interactive chart page with kundli, solar system, dasha timeline, yoga cards, transit wheel, and ashtakavarga grid. The route `(main)/chart/[id]/page.tsx` does not exist at all. The CLAUDE.md repo structure specifies it should exist at `(main)/chart/[id]/`.

The components (`KundliChart`, `DashaTimeline`, `SolarSystem3D`, `YogaGrid`, `TransitWheel`) are all built but have **zero consumers**. A user who creates a profile and calculates a chart lands on `profile/[id]` and sees a raw data table -- no visualizations whatsoever.

### 3. No reports page exists -- `/reports/[id]/` route is completely missing

**FEATURES.md F3.2 through F3.5** describe a report generation UI with streaming, language toggle, model selector, and PDF export. The route `(main)/reports/[id]/page.tsx` does not exist. The `ReportViewer` component is built but not used anywhere.

The profile page links to `/api/v1/reports/generate` as a raw API endpoint link (line 138-140 of `profile/[id]/page.tsx`), which would navigate the user to a JSON API response, not a UI page.

### 4. No chat page exists -- `/chat/[id]/` route is completely missing

**FEATURES.md F4.4** describes a chat interface with SSE streaming, suggested questions, and source citations. The route `(main)/chat/[id]/page.tsx` does not exist. The `ChatInterface` component exists but is never imported by any page.

### 5. KundliChart and DashaTimeline use D3.js with potential SSR issues

**Files:** `web/src/components/kundli/KundliChart.tsx` (line 29), `web/src/components/dasha/DashaTimeline.tsx` (line 43)

Both components call `d3.select(svgRef.current)` inside `useEffect`, which is safe for client-side rendering. However, the `DashaTimeline` accesses `window.addEventListener('resize', ...)` at line 36, and `containerRef.current.clientWidth` at line 30. While these are inside `useEffect` (which only runs client-side), there is no guard against `typeof window === 'undefined'`. If Next.js ever pre-renders these during build, the `window` access in the resize handler setup could fail. These should have an explicit `typeof window !== 'undefined'` guard or be wrapped in `dynamic()` with `ssr: false`.

### 6. Profile page "Generate Full Report" links to raw API endpoint

**File:** `web/src/app/(main)/profile/[id]/page.tsx`, lines 137-140

```tsx
<Link
  href={`/api/v1/reports/generate`}
  className="px-4 py-2 rounded-md border border-border hover:bg-muted/50 transition text-sm"
>
  Generate Full Report
</Link>
```

This is a `<Link>` to an API route. Clicking it will navigate the browser to a POST-only endpoint, likely showing a 405 Method Not Allowed error or raw JSON. This needs to link to a proper reports page that triggers generation via fetch.

---

## High Priority Issues

### 7. Header uses a dummy bell icon, not the built AlertBell component

**File:** `web/src/components/layout/Header.tsx`, lines 12-16

The Header renders a static `<Bell>` icon with a hardcoded red dot:
```tsx
<button className="relative p-2 rounded-md hover:bg-muted/50 transition">
  <Bell className="w-5 h-5" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
</button>
```

Meanwhile, a full-featured `AlertBell` component exists at `web/src/components/notifications/AlertBell.tsx` with dropdown, mark-as-read, severity colors, and proper state management. The Header should use `AlertBell` instead.

### 8. Dashboard ProfileCard component is not used -- dashboard renders plain Link cards

**Files:** `web/src/components/dashboard/ProfileCard.tsx` vs `web/src/app/(main)/dashboard/page.tsx`

The `ProfileCard` component has a rich design with avatar, relation badge, mini kundli, current dasha pill, glassmorphism overlay, hover glow, and action buttons. The actual dashboard page renders plain `<Link>` elements with basic text. The `ProfileCard` is completely unused.

### 9. StarField background component is never rendered

**File:** `web/src/components/shared/StarField.tsx`

Both `StarField` (canvas-based) and `StarFieldCSS` alternatives are defined but never imported by any layout or page. The auth layout references a `.stars` CSS class (line 9 of `(auth)/layout.tsx`), but this class is never defined in `globals.css`. The Celestial Dark theme calls for "subtle star field animation" per ARCHITECTURE.md, but the actual background is just a solid color.

### 10. Sidebar is missing key navigation items

**File:** `web/src/components/layout/Sidebar.tsx`, lines 9-13

The sidebar only has three navigation items:
- Dashboard
- Transits
- Settings

Missing from navigation:
- **Charts** (no link to chart visualization pages)
- **Reports** (no link to report generation/history)
- **Chat** (no link to AI chat)
- **Profile switcher** (FEATURES.md F6.1 specifies "Quick-switch between profiles dropdown in header")

### 11. KundliChart has fixed 600x600 dimensions -- not responsive

**File:** `web/src/components/kundli/KundliChart.tsx`, line 24

```tsx
const [dimensions] = useState({ width: 600, height: 600 });
```

The dimensions are hardcoded and never update. The SVG element at line 56 receives fixed `width={600}` and `height={600}`. On mobile devices (< 600px viewport), this will cause horizontal scrolling. The `DashaTimeline` correctly uses `containerRef.current.clientWidth` for responsive sizing, but the `KundliChart` does not.

### 12. TransitWheel has the same fixed dimensions problem

**File:** `web/src/components/transit/TransitWheel.tsx`, line 23

```tsx
const [dimensions] = useState({ width: 600, height: 600 });
```

Same issue as KundliChart -- hardcoded at 600x600, will overflow on mobile.

### 13. ChatInterface uses mock data instead of real SSE streaming

**File:** `web/src/components/chat/ChatInterface.tsx`, lines 57-110

The entire response flow is mocked with a `setTimeout` loop simulating character-by-character streaming. The `onSendMessage` callback is called *after* the mock response is complete (line 108), which means even if a parent provides real SSE logic, the mock response will still display first. The component needs to be rewritten to accept an SSE event source or a streaming callback pattern.

### 14. TransitWheel uses mock transit data

**File:** `web/src/components/transit/TransitWheel.tsx`, lines 55-58

```tsx
const transitPlanets = natalChart.planets.map(p => ({
  ...p,
  longitude: (p.longitude + 45) % 360, // Mock: shift by 45 degrees
}));
```

Transit positions are faked by adding 45 degrees to natal positions. This makes the entire transit visualization meaningless. The component needs a `transitData` prop or an API call to fetch real planetary positions for the selected date.

---

## Component-by-Component Analysis

### KundliChart (`web/src/components/kundli/KundliChart.tsx`)

**What it does:** Renders North Indian (diamond) or South Indian (grid) style birth charts using D3.js SVG.

**What's good:**
- Clean prop interface with `ChartStyle`, `onHouseClick`, `onPlanetClick` callbacks
- Both chart styles are implemented with correct traditional layouts
- D3.js entrance animations with `d3.easeBounceOut` are a nice touch
- Retrograde markers (R) are displayed correctly
- Planet colors from shared constants

**What's wrong:**
- **Fixed 600x600 dimensions** (line 24) -- not responsive
- **North Indian house positions are incorrect** (lines 76-89): Houses 9-12 are positioned too close to center, overlapping with the inner diamond. In a traditional North Indian chart, houses 9, 10, 11, 12 occupy the triangular spaces between the outer and inner diamonds, not at `0.25` scale. The positioning math needs revision.
- **No hover tooltips** showing degrees and nakshatra as specified in FEATURES.md F2.1
- **No SVG/PNG export** capability mentioned in F2.1
- **Planet labels truncated to 2 characters** (line 196: `planet.name.substring(0, 2)`) -- "Me" could be Mercury or... ambiguous. Standard Vedic abbreviations (Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke) should be used with explicit mapping.
- **`onHouseClick` and `onPlanetClick` in useEffect dependency array** (line 46) -- callback refs will cause infinite re-renders if parent doesn't memoize them. Should use `useCallback` in parent or use refs.
- **Accessibility:** No ARIA labels on the SVG, no keyboard interaction, no way to tab through houses or planets.

### PlanetInfoPanel (`web/src/components/kundli/PlanetInfoPanel.tsx`)

**What it does:** Slide-in side panel showing detailed planet information.

**What's good:**
- Clean slide animation with spring physics
- Dignity color-coding is well-designed
- Nakshatra section is informative
- Retrograde explanation is helpful UX

**What's wrong:**
- **AnimatePresence wraps the entire component but exit animation will never trigger** (lines 40-42): The component does `if (!planet) return null` before the AnimatePresence wrapper, so when `planet` becomes null, the component returns null immediately without giving AnimatePresence a chance to animate out. The `if (!planet)` check needs to be inside AnimatePresence, with the inner motion.div having a `key`.
- **Fixed w-96 width** (line 46) -- on mobile, this will cover the entire screen or overflow. Needs responsive handling.
- **No close-on-Escape keyboard handler** -- panel has a close button but no keyboard shortcut.
- **No focus trap** -- focus can escape behind the panel.
- **`tooltip` prop on InfoRow** (line 117-118) uses HTML `title` attribute -- not accessible, not consistent with the dark theme. Should use a proper tooltip component.
- **Hardcoded hex colors** throughout (`#0f1729`, `#1e2d4a`, `#64748b`, `#e2e8f0`) instead of Tailwind design system tokens. This is a major theme compliance issue.

### DashaTimeline (`web/src/components/dasha/DashaTimeline.tsx`)

**What it does:** Horizontal scrollable timeline of Vimshottari dasha periods using D3.js.

**What's good:**
- Responsive width tracking via containerRef
- D3 zoom behavior implemented (lines 212-218)
- Current date pulsing marker is a nice visual cue
- Block labels hidden when blocks are too narrow (line 109: `if (blockWidth > 50)`)

**What's wrong:**
- **D3 zoom transform is applied incorrectly** (line 216): The zoom handler concatenates `translate(${margin.left}, ${margin.top}) ${event.transform}`. The D3 `event.transform` includes its own translate, so the combined transform will produce incorrect positioning. The zoom should be applied to a nested group, or the initial translate should be factored into the zoom constraint.
- **Elastic easing on width animation** (line 131: `d3.easeElasticOut`) causes blocks to overshoot their width, which looks like a rendering bug when blocks temporarily overlap. `d3.easeQuadOut` or `d3.easeCubicOut` would be more appropriate.
- **No antardasha rendering** -- FEATURES.md F2.4 specifies "Antardasha nested inside each Mahadasha" but only Mahadasha blocks are drawn.
- **Pulsing animation uses D3 transition chaining** (lines 152-173) which is fragile and can break if the element is removed during transition. CSS animation would be more reliable.
- **No accessibility** -- no ARIA labels, no keyboard navigation through periods.

### YogaCard (`web/src/components/yoga/YogaCard.tsx`)

**What it does:** Flippable card showing yoga name (front) and description (back) with strength/type color coding.

**What's good:**
- Card flip animation is smooth with spring physics
- Strength and type badges with appropriate color coding
- Classical source citation on back
- "Click to flip" hint that fades appropriately

**What's wrong:**
- **`perspective-1000` is not a valid Tailwind class** (line 25). Tailwind does not include perspective utilities by default. The inline `style={{ perspective: '1000px' }}` on line 29-31 compensates, making the class redundant but generating a Tailwind warning.
- **Flip hint is not accessible** -- uses click only, no keyboard support (Enter/Space).
- **Card back overflow** (line 115): Long descriptions in `overflow-y-auto` with rotated transform may cause scroll issues on some browsers.
- **Hardcoded colors** (`#0f1729`, `#0a0a1a`, `#1e2d4a`, `#e2e8f0`) instead of design tokens.

### YogaGrid (`web/src/components/yoga/YogaGrid.tsx`)

**What it does:** Filterable, sortable grid of yoga cards.

**What's good:**
- Filter by yoga type with clear active state
- Sort by strength or name
- Count display ("Showing X of Y")
- Empty state with cosmic animation
- `useMemo` for derived filtered/sorted list

**What's wrong:**
- **Emoji in empty state** (line 168: `<span className="text-4xl">...</span>`) -- renders inconsistently across platforms.
- **`layout` prop on `motion.div`** (line 117) without `LayoutGroup` wrapper will produce console warnings.
- **No keyboard navigation** between filter buttons.
- **Hardcoded colors** throughout instead of design tokens.

### ChatInterface (`web/src/components/chat/ChatInterface.tsx`)

**What it does:** Chat UI with message bubbles, suggested questions, copy functionality.

**What's good:**
- Suggested question chips for empty state
- Copy-to-clipboard with visual feedback
- Auto-scroll to bottom
- Streaming indicator with bouncing dots
- Source citations in assistant messages (NotebookLM style)

**What's wrong:**
- **Entirely mocked responses** (lines 57-110) -- hardcoded response text, no actual SSE integration. The mock bypasses the `onSendMessage` callback flow.
- **`onKeyPress` is deprecated** (line 113) -- should use `onKeyDown`.
- **No thumbs up/down feedback** as specified in FEATURES.md F4.4.
- **No date-aware query parsing** as specified in F4.3.
- **Source citations are not clickable** -- F4.5 says "Click citation -> jumps to that section in report viewer."
- **No message deletion or editing**.
- **No conversation history loading** -- the `initialMessages` prop is the only way to show history, but there's no pagination or loading state for fetching previous messages.
- **Hardcoded colors** throughout.

### ReportViewer (`web/src/components/reports/ReportViewer.tsx`)

**What it does:** Collapsible section-based markdown report viewer with PDF download and share buttons.

**What's good:**
- Section parsing from H2 headings is clever
- Expand/Collapse All controls
- Themed markdown rendering with custom ReactMarkdown components
- Report metadata in footer (model, ID)
- Language badge (English/Hindi)

**What's wrong:**
- **`node` destructured in ReactMarkdown components** (lines 199-231) generates React warnings. The `node` property should not be spread to DOM elements. The pattern `({ node, ...props })` is correct for filtering, but newer react-markdown versions may handle this differently.
- **No streaming support** -- the component expects a complete `report.content` string. FEATURES.md F3.2 specifies "SSE streaming -- text appears word by word like ChatGPT." There's no incremental rendering.
- **No favorite toggle** -- Report type has `isFavorite` but no UI to toggle it.
- **No language toggle** before generation as specified in F3.2.
- **No model selector** as specified in F3.2.
- **PDF button calls `onDownloadPDF` but has no loading state** -- PDF generation is async and may take seconds.
- **Share button calls `onShare` with no implementation guidance** -- what is shared? Link? Copy?
- **Hardcoded colors** throughout.

### SolarSystem3D (`web/src/components/solar-system/SolarSystem3D.tsx`)

**What it does:** 3D solar system visualization with planets at birth-time positions.

**What's good:**
- Planet sizes and orbit radii are differentiated
- OrbitControls for pan/zoom/rotate
- Selected planet pulse animation
- Stars background from drei
- HTML labels for planet names

**What's wrong:**
- **CRITICAL: No `dynamic()` wrapper with `ssr: false`** -- will crash during SSR (see Critical Issue #1).
- **Toggle button does nothing** (lines 95-99): The button shows "Birth Time" or "Current Time" based on `showBirthPositions` prop but has no onClick handler. The toggle functionality is not implemented.
- **`document.body.style.cursor` manipulation** (lines 216-219) is a side effect that persists globally and may conflict with other components.
- **Sun component renders at origin but is also in the planets array** -- if `chartData.planets` includes a Sun entry, it will render twice (once from the `<Sun />` component and once from the planets map). The Sun's `orbitRadius` is 0, so they'll overlap.
- **No heliocentric/geocentric toggle** as specified in F2.2.
- **Info overlay uses `absolute` positioning** (line 81) but the parent has `overflow-hidden`, which should be fine. However, the overlay only shows the planet name and a generic message, not actual planet details.
- **No zoom-to-planet functionality** on click as specified in F2.2.

### Sidebar (`web/src/components/layout/Sidebar.tsx`)

**What it does:** Fixed left navigation panel.

**What's good:**
- Active state highlighting using pathname
- Clean logout with supabase signOut
- Uses design system tokens (`text-primary`, `bg-primary/10`, `text-muted-foreground`)

**What's wrong:**
- **Missing navigation items**: No Charts, Reports, Chat links (see High Priority Issue #10).
- **No profile switcher** (FEATURES.md F6.1).
- **`pathname?.startsWith(item.href)`** (line 35): For `/dashboard`, this will also match `/dashboard/new`, which is correct. But for `/settings`, it would match `/settings/anything`. Not a bug per se but worth noting.
- **No mobile responsive behavior** -- fixed `w-64` sidebar with no hamburger menu or collapse mechanism. On mobile, this eats 256px of screen width.
- **No keyboard shortcut support** (e.g., Cmd+K for navigation).

### Header (`web/src/components/layout/Header.tsx`)

**What it does:** Top bar with breadcrumb placeholder and notification bell.

**What's good:**
- Uses design system tokens

**What's wrong:**
- **Breadcrumb is empty** (line 9: `{/* Breadcrumb will go here */}`)
- **Uses static bell icon** instead of AlertBell component (see High Priority Issue #7).
- **No profile switcher dropdown** as specified in FEATURES.md F6.1.
- **No user avatar or account menu**.
- **Notification dot has no ARIA label** -- screen readers cannot detect the notification count.

### AlertBell (`web/src/components/notifications/AlertBell.tsx`)

**What it does:** Notification bell with dropdown panel showing alert cards.

**What's good:**
- Proper dropdown with backdrop click-to-close
- Unread count badge with scale animation
- Mark-all-as-read functionality
- Time-ago formatting
- Severity color coding
- Empty state handling

**What's wrong:**
- **"View all notifications" button is non-functional** (line 125) -- no `onClick` handler, no `href`.
- **No ESC key to close** the dropdown.
- **No focus management** when dropdown opens -- focus doesn't move into the panel.
- **`whileHover={{ backgroundColor: '#0a0a1a' }}`** on AlertCard (line 163) uses framer-motion for a simple hover, which is heavier than a CSS `:hover` and may cause layout thrashing.
- **Not used anywhere** in the actual app.

### ProfileCard (`web/src/components/dashboard/ProfileCard.tsx`)

**What it does:** Rich profile card with avatar, relation badge, mini kundli, dasha info.

**What's good:**
- Beautiful glassmorphism design with hover glow
- Mini kundli SVG thumbnail
- Relation badge with color coding
- Current dasha display
- Action buttons with whileTap feedback

**What's wrong:**
- **Not used anywhere** -- dashboard renders plain Link elements instead.
- **Uses `<img>` instead of `next/image`** (line 69) -- missing Next.js image optimization and potential LCP issues.
- **`MiniKundli` is static** -- shows hardcoded sample planet dots, not actual chart data from the profile.
- **`onViewChart` and `onGenerateReport` are optional** but the component renders the buttons regardless. If no handlers are passed, clicking does nothing.
- **Hardcoded colors** throughout instead of design tokens.

### StarField (`web/src/components/shared/StarField.tsx`)

**What it does:** Canvas-based animated star field background.

**What's good:**
- Multi-layer parallax effect with z-depth
- Twinkle animation per star
- Glow effect for brighter stars
- CSS-only alternative provided
- Proper cleanup of animation frame and resize listener

**What's wrong:**
- **Not used anywhere** in the app.
- **Performance concern:** 100+ stars with radial gradients on every frame could cause jank on lower-end devices. Should use `will-change: transform` or consider WebGL.
- **`style jsx` in StarFieldCSS** (line 158) -- this requires the `styled-jsx` package which may not be configured in the Next.js setup.
- **Canvas covers full viewport** (`window.innerWidth/Height`) -- may cause issues in layouts where the star field should only cover a section.

### CalculateChartButton (`web/src/components/profile/CalculateChartButton.tsx`)

**What it does:** Button that triggers birth chart calculation via API.

**What's good:**
- Loading state with spinner
- Error display
- Uses design system tokens (`bg-primary`, `text-destructive`)
- Two visual modes (primary vs secondary)

**What's wrong:**
- **No success feedback** -- after calculation completes, it just calls `router.refresh()`. No toast or visual confirmation.
- **`setLoading(false)` only called in catch block** (line 53) -- on success, `loading` stays `true` until the page refreshes. If `router.refresh()` is slow, the button will appear stuck.
- **Defines its own `Profile` interface** (lines 8-15) that differs from the shared `Profile` type in `types/astro.ts`. The component's Profile uses `birth_date`/`birth_time` (snake_case from Supabase) while the shared type uses `birthData.dateOfBirth` (camelCase). This is a type safety gap.

---

## Missing Pages / Flows

### Pages that exist in CLAUDE.md repo structure but are NOT implemented:

| Route | Status | Impact |
|-------|--------|--------|
| `(main)/chart/[id]/page.tsx` | **MISSING** | Users cannot see interactive kundli, 3D solar system, dasha timeline, or yoga cards |
| `(main)/reports/[id]/page.tsx` | **MISSING** | Users cannot view generated reports in the web UI |
| `(main)/chat/[id]/page.tsx` | **MISSING** | Users cannot use the AI chart chat feature |

### Pages that exist but are stubs:

| Route | Status |
|-------|--------|
| `(main)/transits/page.tsx` | Stub: "Transit tracker coming soon..." |
| `(main)/settings/page.tsx` | Stub: "Settings panel coming soon..." |

### User flow gaps:

1. **After creating a profile** (`/dashboard/new`): User is redirected to `/profile/[id]`. The chart is auto-calculated (good), but the profile page shows a raw data table -- no visualizations. The "View Chart" button (which should link to the chart visualization page) does not exist.

2. **Generating a report**: The "Generate Full Report" link on the profile page points to a raw API endpoint. There is no UI for selecting report type, choosing language, selecting AI model, or viewing the streaming output.

3. **Viewing notifications**: The header bell is a dead button. The AlertBell component is built but not connected.

4. **AI Chat**: No way to reach the chat interface from any navigation or page.

5. **Transit tracking**: The transits page is a stub. The TransitWheel component is built but not integrated.

---

## Design System Compliance

### What's right:

- **CSS variables in `globals.css`** correctly define the Celestial Dark theme: background `240 10% 4%` maps to approximately `#0a0a1a`, primary `45 93% 47%` maps to the gold `#c9a227`.
- **Auth pages, dashboard, profile pages, sidebar, header** all use Tailwind design tokens (`bg-background`, `text-primary`, `text-muted-foreground`, `border-border`). These will consistently follow the theme.
- **`glass` utility class** in globals.css correctly implements glassmorphism.
- **Custom scrollbar** styling matches the dark theme.
- **Planet color classes** in globals.css (`.planet-sun`, `.planet-moon`, etc.) are defined.

### What's wrong:

1. **Visualization components use hardcoded hex colors instead of design tokens.** The following components bypass the Tailwind design system entirely:

   | Component | Hardcoded colors used |
   |-----------|----------------------|
   | KundliChart | `#0a0a1a`, `#1e2d4a`, `#64748b`, `#c9a227`, `#7c3aed`, `#ff3b30`, `#e2e8f0` |
   | PlanetInfoPanel | `#0f1729`, `#1e2d4a`, `#64748b`, `#c9a227`, `#7c3aed`, `#ff3b30`, `#e2e8f0`, `#0a84ff`, `#34c759`, `#ff9500` |
   | DashaTimeline | `#0a0a1a`, `#1e2d4a`, `#64748b`, `#c9a227`, `#7c3aed`, `#e2e8f0` |
   | YogaCard | `#0f1729`, `#0a0a1a`, `#1e2d4a`, `#e2e8f0`, `#64748b`, `#c9a227`, `#7c3aed` |
   | YogaGrid | Same as YogaCard |
   | ChatInterface | `#0a0a1a`, `#0f1729`, `#1e2d4a`, `#64748b`, `#e2e8f0`, `#7c3aed`, `#6d28d9`, `#c9a227` |
   | ReportViewer | `#0a0a1a`, `#0f1729`, `#1e2d4a`, `#64748b`, `#e2e8f0`, `#c9a227`, `#7c3aed`, `#0a84ff`, `#34c759` |
   | TransitWheel | `#0a0a1a`, `#0f1729`, `#1e2d4a`, `#64748b`, `#e2e8f0`, `#c9a227`, `#7c3aed` |
   | AlertBell | `#0f1729`, `#1e2d4a`, `#64748b`, `#e2e8f0`, `#7c3aed`, `#c9a227`, `#ff3b30`, `#ff9500`, `#0a84ff` |
   | ProfileCard | `#0f1729`, `#0a0a1a`, `#1e2d4a`, `#64748b`, `#e2e8f0`, `#7c3aed`, `#c9a227`, `#6d28d9` |
   | SolarSystem3D | `#0a0a1a`, `#0f1729`, `#1e2d4a`, `#7c3aed`, `#6d28d9` |

   While these hex values currently happen to match the theme, they will NOT update if the theme changes. If a light theme is ever implemented (FEATURES.md F7.3 specifies "Theme: Dark (default) / Light"), all these components will still render dark.

2. **Two styling systems in conflict:** Pages use `bg-card`, `text-foreground`, `border-border` (Tailwind tokens). Components use `bg-[#0f1729]`, `text-[#e2e8f0]`, `border-[#1e2d4a]` (hardcoded hex). This creates a maintenance burden and inconsistency risk.

3. **No shadcn/ui components installed.** CLAUDE.md specifies "UI: Shadcn/UI + Tailwind CSS" but the `web/src/components/ui/` directory does not exist. Forms use raw `<input>`, `<select>`, `<button>` elements. Shadcn/ui provides accessible, themed primitives (Button, Input, Select, Dialog, Sheet, DropdownMenu, etc.) that should be used.

4. **Planet color constants in `types/astro.ts`** (lines 198-208) don't match the CSS classes in `globals.css` (lines 78-86). For example, Venus is `#af52de` in the constant but `.planet-venus { @apply text-pink-400; }` in CSS (`pink-400` = `#f472b6`). The CSS classes are never used -- only the JS constants are.

---

## SSR / Next.js Compatibility Issues

1. **SolarSystem3D** -- CRITICAL: Will crash during SSR. Needs `dynamic()` with `ssr: false`. (See Critical Issue #1.)

2. **D3.js components (KundliChart, DashaTimeline, TransitWheel)** -- Currently safe because D3 operations are inside `useEffect`, but D3 itself imports may reference `window` or `document` at module level depending on the D3 version. Consider wrapping with `dynamic({ ssr: false })` as a precaution.

3. **StarField canvas component** -- Accesses `window.innerWidth/Height` inside `useEffect` (safe), but the class definition inside `useEffect` creates a closure over `canvas` that could theoretically reference stale values after resize. Not an SSR issue but a correctness concern.

4. **`suppressHydrationWarning` usage** -- Used on date inputs in login/signup forms and TransitWheel. This is acceptable for inputs whose values may differ between server and client renders, but it should be applied more surgically (on the specific value attribute, not the entire element).

5. **`style jsx` in StarFieldCSS** -- Requires `styled-jsx` support. Next.js includes this by default, but it should be verified in `next.config.js` if custom configuration has been applied.

---

## Accessibility Audit

### Severe Issues:

1. **No skip-to-content link** in the main layout for keyboard users.

2. **SVG charts (KundliChart, TransitWheel, DashaTimeline) have zero accessibility** -- no ARIA labels, no keyboard interaction, no screen reader descriptions. These are purely visual with no text alternatives.

3. **YogaCard flip is click-only** -- no keyboard support (Enter/Space to flip), no `role="button"`, no `tabIndex`.

4. **PlanetInfoPanel has no focus trap** -- when the panel slides open, keyboard focus can tab behind it to the underlying page.

5. **AlertBell dropdown has no focus management** -- opening the dropdown doesn't move focus into it, and tabbing can escape the dropdown.

6. **Form inputs in `dashboard/new`** -- Most `<label>` elements are not associated via `htmlFor`/`id` attributes. The birth place label, latitude, longitude, and timezone labels are bare text, not linked to their inputs.

7. **Color contrast concerns** -- `text-[#64748b]` (muted foreground) on `bg-[#0a0a1a]` (background) gives approximately 4.1:1 contrast ratio. This barely passes WCAG AA for normal text (4.5:1 required) and fails for small text. The muted text is used extensively for secondary information throughout all components.

### Moderate Issues:

8. **Sidebar navigation links** have no `aria-current="page"` for the active state.
9. **D3.js click handlers** don't have keyboard equivalents -- houses and planets in charts are only clickable via mouse.
10. **Notification badge** (`<span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />` in Header) has no screen reader text. Should use `aria-label` or visually hidden text.

---

## Mobile Responsiveness

### Issues:

1. **Sidebar is fixed at w-64 (256px)** with no collapse or hamburger menu. On a 375px mobile screen, this leaves only 119px for content, which is unusable.

2. **KundliChart and TransitWheel are fixed at 600x600px** -- will overflow on any screen under 600px wide.

3. **SolarSystem3D is fixed at h-[600px]** -- tall on mobile, may push content below the fold.

4. **Profile page grid `grid-cols-2 md:grid-cols-4`** -- on very small screens, the 2-column grid may squeeze birth details too tightly.

5. **New profile form** uses `grid-cols-2` for name/relation and date/time -- on mobile, these should stack to single column.

6. **PlanetInfoPanel is fixed at w-96 (384px)** -- covers the entire screen on mobile with no responsive handling.

7. **AlertBell dropdown is w-96** -- same mobile coverage issue.

8. **ChatInterface** -- `max-w-[80%]` on message bubbles works well. The suggested question chips `flex-wrap` is correct. This component is relatively mobile-friendly.

9. **YogaGrid** uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` -- this is properly responsive.

---

## Quick Wins

1. **Replace Header bell icon with AlertBell component** -- component exists, just needs to be imported and wired up with a data source.

2. **Replace dashboard Link cards with ProfileCard component** -- ProfileCard is built and beautiful, just needs to be imported. Wire `onViewChart` to navigate to `/profile/[id]`.

3. **Add StarField to auth layout** -- the auth layout already has a `.stars` div but the CSS class doesn't exist. Import `StarFieldCSS` (the lightweight CSS-only version) instead.

4. **Fix PlanetInfoPanel exit animation** -- move the `if (!planet) return null` check inside AnimatePresence and give the motion.div a key.

5. **Make KundliChart responsive** -- replace `useState({ width: 600, height: 600 })` with a `useEffect` that reads `containerRef.current.clientWidth`, same pattern as DashaTimeline.

6. **Add `htmlFor`/`id` pairs** to all form labels in the new profile page.

7. **Add `aria-label="N unread notifications"` to the notification badge.

8. **Change "Generate Full Report" link** on profile page from `<Link href="/api/v1/reports/generate">` to a `<button>` that calls an API via fetch, or link to a proper reports page.

9. **Add Chart, Reports, Chat links** to the sidebar navigation.

10. **Replace `onKeyPress` with `onKeyDown`** in ChatInterface.

---

## Recommendations Summary (Prioritized)

### P0 -- Blocking / Will Crash

| # | Item | Effort |
|---|------|--------|
| 1 | Wrap SolarSystem3D in `dynamic()` with `ssr: false` | 15 min |
| 2 | Fix "Generate Full Report" link pointing to raw API endpoint | 15 min |

### P1 -- Missing Core Flows (Users Cannot Use the App)

| # | Item | Effort |
|---|------|--------|
| 3 | Create `(main)/chart/[id]/page.tsx` integrating KundliChart, DashaTimeline, YogaGrid, SolarSystem3D | 2-3 hrs |
| 4 | Create `(main)/reports/[id]/page.tsx` integrating ReportViewer with report generation trigger | 2-3 hrs |
| 5 | Create `(main)/chat/[id]/page.tsx` integrating ChatInterface with real SSE from `/api/v1/chat` | 2-3 hrs |
| 6 | Replace ChatInterface mock streaming with actual SSE EventSource | 3-4 hrs |
| 7 | Replace TransitWheel mock transit data with real API call | 2 hrs |
| 8 | Add missing sidebar navigation items (Charts, Reports, Chat) | 30 min |

### P2 -- Design System / Theme Compliance

| # | Item | Effort |
|---|------|--------|
| 9 | Install shadcn/ui components (Button, Input, Select, Dialog, Sheet) | 1 hr |
| 10 | Refactor all visualization components to use Tailwind design tokens instead of hardcoded hex | 4-6 hrs |
| 11 | Wire ProfileCard into dashboard page replacing plain Link cards | 1 hr |
| 12 | Wire AlertBell into Header replacing static bell icon | 30 min |
| 13 | Add StarFieldCSS to auth layout (or StarField to main layout background) | 30 min |

### P3 -- Responsive / Mobile

| # | Item | Effort |
|---|------|--------|
| 14 | Make KundliChart and TransitWheel responsive (read container width) | 1 hr |
| 15 | Add mobile sidebar (hamburger menu + slide-out) | 2-3 hrs |
| 16 | Make PlanetInfoPanel responsive (full-width on mobile as a bottom sheet) | 1 hr |
| 17 | Stack form fields on mobile in new profile page | 30 min |

### P4 -- Accessibility

| # | Item | Effort |
|---|------|--------|
| 18 | Add skip-to-content link in main layout | 15 min |
| 19 | Add ARIA labels to SVG charts (chart role, planet/house descriptions) | 2 hrs |
| 20 | Add keyboard support to YogaCard (tabIndex, onKeyDown for flip) | 30 min |
| 21 | Add focus trap to PlanetInfoPanel and AlertBell dropdown | 1 hr |
| 22 | Add Escape-to-close for PlanetInfoPanel and AlertBell | 30 min |
| 23 | Fix color contrast for muted text (bump from `#64748b` to lighter value) | 30 min |
| 24 | Add `htmlFor`/`id` pairs to all form labels | 30 min |

### P5 -- Polish / Correctness

| # | Item | Effort |
|---|------|--------|
| 25 | Fix PlanetInfoPanel exit animation (AnimatePresence + key) | 15 min |
| 26 | Fix DashaTimeline D3 zoom transform math | 1 hr |
| 27 | Add antardasha rendering to DashaTimeline | 2-3 hrs |
| 28 | Fix North Indian chart house positioning (houses 9-12) | 1-2 hrs |
| 29 | Add success toast/feedback to CalculateChartButton | 30 min |
| 30 | Unify Profile type (resolve snake_case vs camelCase mismatch) | 1 hr |
| 31 | Add proper planet abbreviation mapping instead of substring(0,2) | 15 min |
| 32 | Implement SolarSystem3D toggle button (birth time vs current) | 1 hr |
| 33 | Replace D3 pulse animation with CSS for DashaTimeline current marker | 30 min |

---

*End of audit. Total estimated effort for all items: ~40-50 hours of focused development work. Prioritize P0 and P1 items to make the application functional, then address P2 for visual consistency, P3 for mobile users, and P4/P5 for polish.*
