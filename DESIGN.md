# DESIGN.md - E-Procurement Admin Console

## Dials & Aesthetic Read
- **Domain**: Enterprise E-Procurement & Tender Administration Console (`eproc-admin`).
- **Dials**: `ENERGY 1 / RHYTHM 2 / MOTION 1` (calm operational console, balanced density, quiet purposeful transitions).
- **Direction**: High-contrast neutral surface architecture (`#fafafa` canvas, `#ffffff` cards, `#171717` ink) with monospace numeric precision (`Roboto Mono`) for IDR currency, tender codes, dates, and sequences.

## Palette & Surface Elevation
- **Background (`--color-background`)**: `#fafafa` (warm neutral workspace canvas).
- **Primary Surface (`--color-card`)**: `#ffffff` inside a recessed `.frame` container (`#f5f5f5`, `1px solid #e5e5e5`) with `.panel` inner elevation (`1px solid rgba(23,23,23,0.06)` and subtle 2px shadow).
  - *Elevation Rationale (R-37)*: `.frame` groups related procurement controls (e.g., filter bar + data table, or stage header + schedule rows) while `.panel` elevates the interactive data surface one step above the frame chrome.
- **Foreground Ink (`--color-foreground`)**: `#171717` primary, `#525252` secondary (`neutral-600`), `#737373` muted metadata (`neutral-500`). All text combinations meet WCAG AA contrast (`>= 4.5:1`).
- **Primary Action (`--color-primary`)**: `#171717` solid fill with `#fafafa` text.
- **Semantic Status Tokens**:
  - Active / Published / Verified: Emerald (`#ecfdf5` fill, `#047857` text, `#10b981` dot)
  - Draft / Pending / Working Day: Amber (`#fffbeb` fill, `#b45309` text, `#f59e0b` dot)
  - Cancelled / Error / Destructive: Rose (`#fff1f2` fill, `#be123c` text, `#f43f5e` dot)

## Typography
- **UI & Prose (`--font-sans`)**: `'Inter'`, `-0.011em` body tracking, `-0.025em` display tracking.
- **Tabular & Identifiers (`--font-mono`)**: `'Roboto Mono'`, `font-variant-numeric: tabular-nums` on all prices (IDR), quantities, durations, dates, and job numbers.

## Anti-Slop Commitments
- Every data view implements explicit **Loading** (skeleton/spinner), **Empty** (clear cause + primary action), and **Error** (API message + retry button) states.
- Zero fabricated metrics, fake deltas, or placeholder personas (`John Doe`).
- All interactive controls perform real state or API operations.
