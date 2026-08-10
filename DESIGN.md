---
name: Markas Kebaikan
description: A warm, airy sedekah & crowdfunding landing theme with a local AI donation assistant.
colors:
  primary: "#0D9488"
  primary-strong: "#0F766E"
  primary-soft: "#CCFBF1"
  accent-teal: "#2DD4BF"
  amber: "#D97706"
  amber-soft: "#FEF3C7"
  amber-bright: "#F59E0B"
  amber-deep: "#B45309"
  paper: "#ffffff"
  paper-soft: "#F8FAFC"
  paper-soft-strong: "#F1F5F9"
  ink: "#0F172A"
  ink-muted: "#475569"
  line: "#E2E8F0"
  line-strong: "#CBD5E1"
  success: "#059669"
  danger: "#E11D48"
  cover-teal-deep: "#134E4A"
  cover-teal-mid: "#115E59"
  slate: "#64748B"
  slate-deep: "#334155"
  danger-soft: "#FDF1F4"
  danger-line: "#F8D4DC"
  glow-teal: "rgba(13, 148, 136, 0.55)"
  glow-teal-soft: "rgba(13, 148, 136, 0.22)"
  ring-teal: "rgba(13, 148, 136, 0.5)"
  glow-teal-deep: "rgba(13, 148, 136, 0.6)"
  scrim-ink: "rgba(15, 23, 42, 0.45)"
  chip-ink: "rgba(15, 23, 42, 0.72)"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    lineHeight: 1.65
rounded:
  xs: "4px"
  sm: "10px"
  md: "16px"
  input: "10px"
  icon: "9px"
  chat: "8px"
  alert: "12px"
  icon-lg: "14px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "999px"
    padding: "13px 26px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "999px"
    padding: "13px 26px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "26px"
---

# Design System: Markas Kebaikan

## Overview

**Creative North Star: "The Spreading Ripple"**

A sedekah platform that feels like a bright, sunlit courtyard — warm, trustworthy, and
effortless. The world is slate paper (`#F8FAFC`) with white cards on 1px hairlines, one
teal accent (`#0D9488`) that only ever points at an action, and amber (`#D97706`)
reserved for warmth and highlights. It refuses the dark-neon crowdfunding template and
the metric-scrum hero. Density stays low: generous section padding, one idea per
section, short lines.

The system earns trust through restraint: a flat resting state, elevation only on
hover, a type scale with obvious steps (Plus Jakarta Sans display over Inter body),
and numerals that always line up. The ripple art in the hero visualizes how one small
donation spreads outward. Motion is authored once (the funding bars, the stats
count-up) rather than sprinkled as entrances everywhere.

**Key Characteristics:**
- Slate paper surfaces on 1px hairlines; elevation only as a hover response.
- One teal accent reserved for actions; amber belongs to warmth and highlights.
- Plus Jakarta Sans display over an Inter body; headings always balanced.
- One authored motion moment; everything else transitions on state.

## Colors

Slate paper and ink neutrals carry the page; teal is the single action accent; amber
is reserved for warmth, the "hot" campaign badge, and the days-left urgency label.

### Primary
- **Teal** (#0D9488): buttons, focus rings, active funding bar, links, chat send, stats accent.
- **Teal Deep** (#0F766E): hover for primary actions and the FAB.
- **Teal Soft** (#CCFBF1): hero halo, program icon tile, selected payment method, text selection.
- **Teal Bright** (#2DD4BF): the ripple heart's lighter gradient stop.

### Neutral
- **Paper** (#ffffff): page, cards, chat panel, modal.
- **Paper Soft** (#F8FAFC): page background, alt sections.
- **Paper Soft Strong** (#F1F5F9): stats band, soft bubbles, footer, progress tracks.
- **Ink** (#0F172A): headings and primary text.
- **Ink Muted** (#475569): body text, secondary labels (≥4.5:1 on paper).
- **Line** (#E2E8F0) / **Line Strong** (#CBD5E1): 1px hairlines and control borders.

### Tertiary
- **Amber** (#D97706): trust-chip checks, days-left label, hot campaign badge.
- **Amber Soft** (#FEF3C7): report-proof illustration band.
- **Amber Bright** (#F59E0B) / **Amber Deep** (#B45309): dawn cover gradient.
- **Success** (#059669) / **Danger** (#E11D48): completed badge and system errors.
- **Slate** (#64748B) / **Slate Deep** (#334155): umbrella cover gradient.

### Cover Gradients
Each campaign cover is a two-stop gradient drawn from the palette: teal-deep
(`#134E4A` → `#0D9488`), teal-mid (`#115E59` → `#0F766E`), amber
(`#F59E0B` → `#B45309`), slate (`#64748B` → `#334155`).

### Named Rules
**The One Accent Rule.** Teal is the only interactive color. It marks actions, focus,
and the active state of the funding meter; it never decorates a heading or a
background.
**The Amber Warmth Rule.** Amber is for warmth and highlights — trust checks, urgency,
and the hot campaign badge — never for primary actions.

## Typography

**Display Font:** Plus Jakarta Sans (with Segoe UI, system-ui fallbacks)
**Body Font:** Inter (with a Segoe UI system stack fallback)
**Label Font:** Body face, uppercase at 12.5px with 0.08em tracking

**Character:** Plus Jakarta Sans is a modern, friendly geometric cut that reads as warm
and contemporary — perfect for a community charity. Its 800 display weight gives the
hero presence without shouting; Inter keeps long copy legible.

### Hierarchy
- **Display** (800, clamp(38px, 5.2vw, 58px), 1.12, -0.025em): the hero headline only.
- **Headline** (700, clamp(28px, 3.6vw, 38px), 1.12, -0.025em): section headings.
- **Title** (700, 17–21px, 1.12, -0.02em): campaign titles, program titles, modal heading.
- **Body** (400, 16px, 1.65): paragraphs, measure ~60–65ch.
- **Label** (600, 12.5px, 0.08em, uppercase): stat labels under the count-up numbers.

All headings use `text-wrap: balance`; every number uses `font-variant-numeric:
tabular-nums`.

### Named Rules
**The Tabular Rule.** Every numeral that can be compared — funding totals, donatur
counts, percent, days, prices, chat timestamps — uses tabular-nums so columns and
updates never jitter.

## Layout

A 1120px container (`24px` side padding) centers every section. Spacing rhythm is
tight inside a group (`8px`–`16px`) and generous between sections (`96px` vertical),
with more space above a heading than below it. Section blocks are two-column grids
that collapse to one column under `900px`; campaign cards are an `auto-fit` grid with
a `290px` minimum. The hero pairs a copy column with the ripple art column. Sections
alternate paper and paper-soft-strong bands to separate reading rhythms without
borders.

## Elevation & Depth

Flat by default. Depth is conveyed by tonal layering (paper against paper-soft) and by
a 1px hairline border on every card. Elevation appears only as a response to state: a
soft drop shadow on hover (`0 18px 44px -16px rgba(15,23,42,0.18)`) for cards, and
small ambient shadows on the sticky nav and toast. The ripple art carries its own
teal glow as product illustration, not surface elevation.

### Shadow Vocabulary
- **Shadow Sm** (`0 1px 2px rgba(15,23,42,0.06)`): sticky nav when scrolled, funding bar.
- **Shadow Md** (`0 18px 44px -16px rgba(15,23,42,0.18)`): card hover, chat panel, modal, toast.

### Named Rules
**The Flat-By-Default Rule.** A card at rest is hairline-on-paper. Shadows are earned
by hover, focus, or being an overlay; they never sit under a resting card with its
border.

## Shapes

Pill radii for buttons, chips, badges, and the toast (999px); `16px` for cards, chat
bubbles, panels, and modals; `10px` for inputs and preset tiles; `9px` for pay-method
icon tiles; `8px` for the chat model select; `12px` for the system-error chip; `4px`
only for focus outlines. Iconography is inline 1.5–2.2px-stroke SVG in the same
geometric voice as the product. The ripple is drawn from flat geometric rings and
dots — a vector diagram of giving spreading outward, never a shaded illustration.

## Components

### Buttons
- **Shape:** pill (999px), Plus Jakarta Sans 700, 15px, `13px 26px` padding.
- **Primary:** teal on white text; hover deepens to teal-deep with a soft teal glow;
  `:active` nudges down 1px.
- **On-accent:** white pill on the teal CTA band; hover tints to teal-soft.
- **Ghost:** transparent, hairline border; hover turns the border and label teal.
- **Focus:** 2px teal outline, 3px offset, never `outline: none`.

### Cards
- **Corner Style:** 16px.
- **Background:** white; **Border:** 1px hairline; the hot campaign swaps its badge to
  amber.
- **Shadow Strategy:** none at rest; shadow-md on hover.
- **Internal Padding:** `22px`; campaign cards carry a 16/9 gradient cover with a
  white glyph on top.

### Inputs / Fields
- **Style:** paper-soft-strong fill, 1px line-strong stroke, `10px` radius.
- **Focus:** border shifts to teal; no glow.
- **Disabled:** primary buttons drop to 0.45 opacity (chat send while streaming).

### Navigation
- Fixed white bar on a hairline; Plus Jakarta Sans 18px brand with a teal heart mark;
  links in muted ink at 14px/500; on scroll the bar gains shadow-sm. Links hide under
  `900px`.

### Donation Modal
- A `460px` teal-modal 3-step flow: Nominal → Identitas & Doa → Pembayaran, followed
  by a success state with a reference code. Step indicator circles fill left-to-right;
  preset amounts and payment methods are toggle tiles; the "Hamba Allah" checkbox
  anonymizes the donor. Uses a `<dialog>` with backdrop scrim.

### Report Modal
- A `520px` modal showing the usage-of-funds breakdown for completed campaigns: an
  illustration band, itemized rows on hairlines, a total, and a verification note.

### Chat Widget
- A fixed teal FAB (58px, pill) at the bottom-right opens a white panel (400px, 16px,
  shadow-md). The header shows connection state in status color; the model picker is a
  bordered select. User bubbles are teal; assistant bubbles are paper-soft on a
  hairline; system errors are a pale-danger chip with a danger label.

### Funding Bar
- A `8px` teal track that fills left-to-right as the campaign's percent; raised
  amount in bold tabular numerals and target below, with donatur count and days left.

## Do's and Don'ts

### Do:
- **Do** keep one accent color (teal) for all interactive elements and reserve amber
  for warmth and highlights.
- **Do** use tabular-nums for every comparable numeral.
- **Do** balance all headings and keep the display weight at 800.
- **Do** prefer a flat resting state with a hairline border; earn elevation on hover.
- **Do** respect `prefers-reduced-motion`: collapse all animation and transition
  durations.

### Don't:
- **Don't** use gradient text, glass blur, or neon glows — emphasis comes from weight,
  size, and the teal accent.
- **Don't** add entrance animations on every section; one authored moment (the funding
  fill and stats count-up) is the motion budget.
- **Don't** use emoji or unicode glyphs as icons — inline SVG in one consistent stroke.
- **Don't** place a kicker/eyebrow above headings; headings carry their own weight.
- **Don't** use soft shadows and a 1px border on the same resting card.
