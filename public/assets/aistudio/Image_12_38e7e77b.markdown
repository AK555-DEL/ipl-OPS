---
name: Auction Console
colors:
  surface: '#141026'
  surface-dim: '#141026'
  surface-bright: '#3a364e'
  surface-container-lowest: '#0e0b21'
  surface-container-low: '#1c192f'
  surface-container: '#201d33'
  surface-container-high: '#2b273e'
  surface-container-highest: '#36324a'
  on-surface: '#e6defe'
  on-surface-variant: '#d5c4ac'
  inverse-surface: '#e6defe'
  inverse-on-surface: '#312d45'
  outline: '#9d8f79'
  outline-variant: '#504533'
  surface-tint: '#ffbb1e'
  primary: '#ffdb9f'
  on-primary: '#412d00'
  primary-container: '#fdb813'
  on-primary-container: '#6b4b00'
  inverse-primary: '#7c5800'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffd6d8'
  on-tertiary: '#67001b'
  tertiary-container: '#ffafb4'
  on-tertiary-container: '#a50031'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea7'
  primary-fixed-dim: '#ffbb1e'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#141026'
  on-background: '#e6defe'
  surface-variant: '#36324a'
typography:
  headline-xl:
    fontFamily: JetBrains Mono
    fontSize: 3.25rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  title-tabular:
    fontFamily: JetBrains Mono
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.02em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-data:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  label-hotkey:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontWeight: '700'
    lineHeight: 0.75rem
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  gutter-md: 0.75rem
  margin: 0.75rem
  margin-panel: 1rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.625rem
  space-lg: 0.875rem
  space-xl: 1.25rem
---

## Brand & Style

This design system is engineered for zero-latency, high-stakes operational environments—specifically the high-pressure floor of a professional cricket auction broadcast control room. It balances the high-density information architecture of financial terminals (Bloomberg, Refinitiv) with the split-second clarity and drama of live television broadcast graphics.

The visual style blends **Technical Broadcast Control** with **High-Density Utility**:
- **Tone:** Authoritative, clinical, cinematic, instantaneous.
- **Visual Tension:** Pitch-dark inky backgrounds contrast with glowing live bid telemetry, vibrant team insignia, and immediate status states (green hammer, red pass).
- **Physicality:** Crisp 1px structural framing, recessed wells, luminous indicator pips, and prominent keyboard shortcut affordances that prioritize muscle memory over cursor precision.

## Colors

The palette is optimized for dark control rooms, eye strain reduction across 12-hour auction shifts, and instantaneous semantic recognition.

### Foundational Canvas & Structure
- **Canvas Base:** `#14111F` (Dark purple-ink deep background). Primary baseline for all main screen viewports.
- **Surface Panels:** `#1D1A2B` (Recessed instrument bays, data grid modules, telemetry stacks).
- **Elevated Surfaces:** `#252136` (Modals, popovers, active bidding paddle overlays, drawer panels).
- **Structural Borders:** `#3A3552` (Micro-lines, splitters, header borders).
- **Focused / Active Borders:** `#FDB813` (Golden marigold, indicates the current live operator focus ring).

### Telemetry & Typography
- **Primary Text:** `#F1EDF7` (Soft white text, 95% opacity against canvas).
- **Secondary / Data Headers:** `#A39DBA` (Muted slate, used for labels, field descriptors, and inactive metadata).
- **Tertiary / Grid Division:** `#544E72` (Subtle dividers, inactive key prompts).

### Functional & State Semantics
- **Auction Focal Point / Active Bid:** `#FDB813` (Golden Marigold) — draws operator eyes directly to the active hammer price and leading bidder.
- **Action Confirmed / Sold / Active Link:** `#10B981` (Emerald Green) — hammer down, contract settled, stream healthy.
- **Action Rejected / Unsold / Alert:** `#F43F5E` (Rose Red) — passed player, budget overflow, stream dropped.

### Franchise Badges & Telemetry Tokens
Franchise identity colors should never bleed across full surfaces; they exist strictly as high-impact accent badges, telemetry tags, and bid ring borders:
- **MI:** `#004BA0`
- **CSK:** `#FFFF3C` (Render with dark `#14111F` text)
- **RCB:** `#EC1C24`
- **KKR:** `#7A42C9` (Calibrated for dark mode readability against `#3A225D`)
- **RR:** `#EA1A85`
- **SRH:** `#F26522`
- **GT:** `#0B4973`
- **LSG:** `#00A6EB`
- **DC:** `#254580`
- **PBKS:** `#DD1F2D`

## Typography

Typography prioritizes rapid identification over decorative expression. 

- **Numeric & Real-Time Data (JetBrains Mono):** All currency displays (`₹ Cr`, `Lakh`), bid timers, countdowns, purse balances, and shortcut keys are strictly monospaced with enabled tabular figures (`tnum`). This prevents layout jitter during continuous rapid incrementing.
- **Player Names & Headings (Space Grotesk):** Engineered for quick-scan telemetry across room monitors, offering geometric precision and uppercase legibility.
- **Labels, Specs, and System Data (Inter):** Used for base telemetry, team rosters, slot counts, and player categorizations (e.g., Capped, Overseas, WK/BAT).

## Layout & Spacing

The system runs on an ultra-compact spatial rhythm designed to fit maximum operational information within a standard 1080p/4K operational viewport without requiring vertical scrolling.

### Layout Philosophy
- **Fixed Instrument Bays:** A CSS Grid layout with anchored panels:
  - **Left Rail (320px):** Upcoming queue, sets, and dynamic draft order.
  - **Center Deck (Fluid):** Primary active auction lot, live bidding ladder, fast-action transaction desk.
  - **Right Rail (400px):** 10-team purse telemetry, RTM (Right to Match) status matrix, foreign player quotas.
  - **Bottom Dock (48px):** Global system health, undo stack (`Ctrl+Z`), stream latency, and hotkey legends.
- **Density Over Spacing:** Empty layout space is reduced to the minimum viable distance to preserve legibility while maximizing simultaneous telemetry. Padding within items hovers strictly between `4px` (`space-xs`) and `10px` (`space-md`).

## Elevation & Depth

To maintain surgical focus, this system avoids soft blur drop shadows and decorative elevation tiers. Instead, depth is established strictly through **structural borders and calibrated luminescence**.

- **Level 0 (Floor Canvas):** `#14111F` — Recessed background for inactive zones.
- **Level 1 (Data Surfaces):** `#1D1A2B` framed with a `1px solid #3A3552` border.
- **Level 2 (Active Focus):** `#252136` framed with a high-contrast accent ring (`#FDB813` or franchise color).
- **Luminous Highlights (The "Live Glow"):** The leading bid indicator utilizes an intense interior edge glow rather than an exterior cast shadow (`box-shadow: inset 0 0 12px rgba(253, 184, 19, 0.15)`).
- **Telemetry Indicators:** Status pips utilize pure glow points (e.g., `box-shadow: 0 0 6px #10B981` for a live socket connection).

## Shapes

The interface adopts a high-precision, technical aesthetic (`roundedness: 1`):
- **Base Components:** Inputs, grid cells, and terminal panels use `0.25rem` (4px) rounded corners.
- **Status Indicators & Hotkeys:** `0.125rem` (2px) to `0.25rem` (4px) for keyboard badges, giving them the tactile appearance of physical chiclet keys.
- **Franchise Pills & Live Status Pips:** Pill shapes are reserved exclusively for team identifier badges, status dots, and live broadcasting toggles (`rounded-full`) to immediately distinguish contextual tags from clickable square buttons.

## Components

### 1. Bidding Trigger Pads
- Large tactile push-blocks designated per team (keys `1` through `0`).
- Background: `#1D1A2B`; Border: `1px solid #3A3552`.
- Hover/Active: Background shifts to franchise accent with heavy contrast text.
- Top-right corner displays monospaced hotkey chip: `#252136` background, `0.625rem` JetBrains Mono text.

### 2. Live Hammer & Price Display
- Centered prominent card with active bid sum rendered in `headline-xl` (`JetBrains Mono`, `#FDB813`).
- Subtext displays current incremental step (e.g., `+ ₹20,00,000 / Next: ₹8.40 Cr`).
- Base price and category tagged via sharp corner micro-chips.

### 3. Action Command Buttons (Sold / Unsold / Pass / Undo)
- **Sold Button:** Primary emerald `#10B981`, bold white uppercase text, paired with `Enter` hotkey indicator. Triggers sound and telemetry flash.
- **Unsold Button:** Destructive rose `#F43F5E`, paired with `Esc` or `U` hotkey badge.
- **Undo Command:** Flat outline button with `#3A3552` border, muted text, displaying `Ctrl+Z`.

### 4. Franchise Telemetry Cards (Purse & Slot Grid)
- Micro-cards displaying: Team Code (`CSK`, `MI`), Remaining Purse (`₹24.50 Cr`), Slots Remaining (`4/25`), Overseas Balance (`2/8`).
- Progress bars: 3px height indicating purse utilization relative to initial auction cap.

### 5. Keyboard Shortcut Tags
- Chiclet tags styled as physical keys: `1px solid #544E72`, background `#14111F`, text `#A39DBA`.
- Positioned inline next to actionable labels across all data entry forms.

### 6. Status Pips & Alerts
- Real-time network sync indicators: 6px circular dot with concentric pulse wave.
- Green (`#10B981`) = Sync latency < 40ms.
- Amber (`#FDB813`) = Socket packet retry.
- Red (`#F43F5E`) = Connection severed, local buffer engaged.