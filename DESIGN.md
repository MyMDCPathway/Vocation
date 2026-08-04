---
name: Vocation
description: Empowered clarity for a career decision that shouldn't feel like paperwork
colors:
  primary: "#000000"
  primary-container: "#131b2e"
  primary-fixed: "#dae2fd"
  primary-fixed-dim: "#bec6e0"
  on-primary: "#ffffff"
  secondary: "#006a61"
  secondary-container: "#86f2e4"
  secondary-fixed: "#89f5e7"
  secondary-fixed-dim: "#6bd8cb"
  on-secondary: "#ffffff"
  tertiary: "#000000"
  tertiary-container: "#0b1c30"
  tertiary-fixed: "#d3e4fe"
  on-tertiary: "#ffffff"
  surface: "#f7f9fb"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f2f4f6"
  surface-container: "#eceef0"
  surface-container-high: "#e6e8ea"
  surface-container-highest: "#e0e3e5"
  surface-dim: "#d8dadc"
  on-surface: "#191c1e"
  on-surface-variant: "#45464d"
  outline: "#76777d"
  outline-variant: "#c6c6cd"
  error: "#ba1a1a"
  error-container: "#ffdad6"
  school-primary: "#0053a0"
typography:
  display:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "56px"
    letterSpacing: "-0.02em"
  display-mobile:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Hanken Grotesk, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "0.01em"
  label-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "normal"
rounded:
  sm: "0.125rem"
  DEFAULT: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  base: "8px"
  gutter: "24px"
  margin-mobile: "16px"
  margin-desktop: "40px"
  container-max: "1280px"
  stack-sm: "8px"
  stack-md: "16px"
  stack-lg: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.DEFAULT}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  milestone-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  chip:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
  chip-selected:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
---

# Design System: Vocation

## Overview

**Creative North Star: "Empowered Clarity"**

The feeling of a daunting career path broken down into manageable, professional
steps. This is **Professional Modernism**: corporate reliability paired with a
modern, encouraging tech aesthetic, built for career changers, graduates, and
professionals who need a UI that feels stable *and* motivating at the same
time. Nothing here is decorative for its own sake — every device on screen
exists to reduce the cognitive load of comparing complex career data.

The palette is almost monochrome by design. Near-black carries branding,
navigation, and headings — pure authority, no warmth borrowed from a hue. Into
that restraint drops one color that does all the emotional work: a **vibrant
teal**, reserved entirely for progress, action, and milestones reached. It
never decorates; it only ever means "this moved forward." The canvas beneath
both is a soft, barely-there gray-blue, built from a multi-step tonal scale so
information can separate into modules without a single hard line.

Depth is tonal and quiet: white cards on a soft gray canvas, a 1px border doing
most of the definition, shadow appearing only as feedback when a user actually
interacts with something. Geometry is disciplined rather than expressive — 4px
on inputs and small controls, 8px on cards, fully circular only for the
**roadmap nodes**, this system's signature: a vertical teal line threading
32px circular milestones, because progress toward a career is the one thing in
this product that has earned the metaphor of a journey.

Typography pairs two families on purpose: **Hanken Grotesk** for headlines —
sharp, contemporary, doing the "tech and human" work — and **Inter** for body
copy and every data label, chosen for legibility at small sizes in a
career-data-dense layout. This is the third visual world this product has
carried; the first two (a warm sand/confetti intake, then an all-blue
pill-everything system) are explicitly retired below.

**Anti-references.** Not a **cold AI product** (gradient-on-dark, glow, sparkle
icons, "powered by AI" chrome). Not a **growth-hacked funnel** (urgency badges,
countdowns, invented ROI figures, testimonial carousels). Not the **warm sand /
ink-violet / confetti** world this product shipped first. Not the **all-blue,
fully-round-everything** world it shipped second — that palette and its 16 /
32 / 48px radius scale are retired; this system's geometry is disciplined, not
extreme, and its accent is teal-on-black, not blue-on-blue.

**Key Characteristics:**
- Near-black + white as the voice of authority; teal as the only accent, and
  the only color allowed to mean progress
- Two type families: Hanken Grotesk headlines, Inter for everything else
- Soft multi-step gray-blue canvas; white cards with a 1px border first,
  shadow only as interactive feedback
- Disciplined geometry — 4px small, 8px cards, 12px large containers, full
  circles reserved for roadmap nodes
- The roadmap motif: a teal vertical line threading circular milestones,
  filled when complete, outlined when upcoming
- Left-accent milestone cards, 4px teal border, for progression status

## Colors

A near-monochrome authority palette with one accent doing all the emotional
signaling, on a soft multi-tier gray-blue scaffold.

### Primary
- **Deep Navy-Black** (`{colors.primary}`): Core branding, headings, primary
  button fills, navigation. Pure black rather than a tinted near-black — the
  system's authority is meant to read as absolute, not warm.
- **Navy Container** (`{colors.primary-container}`): The softer step used for
  filled brand surfaces and navigation backgrounds where flat black would be
  too heavy.

### Secondary
- **Vibrant Teal** (`{colors.secondary}` / `{colors.secondary-container}`):
  Progression and action, full stop. Completed roadmap nodes, primary "Next
  Step" and "Start Path" buttons, milestone accents. If it isn't marking
  forward motion, it isn't teal.

### Tertiary
- Shares primary's near-black; this system does not spend a third hue. Use
  `{colors.tertiary-container}` only for a deep-navy fill that needs to sit
  visually behind primary black (a background panel, never a foreground
  action).

### Neutral
- **Soft Canvas** (`{colors.surface}`): The page ground — a barely-tinted
  gray-blue, not pure white.
- **Card White** (`{colors.surface-container-lowest}`): Every card and input.
- **Scaffold** (`{colors.surface-container-low}` → `{colors.surface-container-highest}`):
  Progressive tonal steps for nested modules and quiet fills.
- **Ink** (`{colors.on-surface}`) / **Ink Variant** (`{colors.on-surface-variant}`):
  Primary and supporting text.
- **Outline** (`{colors.outline}`) / **Outline Variant** (`{colors.outline-variant}`):
  The 1px borders that do most of this system's structural work.

### Runtime
- **School Primary** (`{colors.school-primary}`): Retinted at runtime from the
  selected school's brand color, on the pathway and plan surfaces only. Not a
  constant — see the Two-Palette Rule below.

### Named Rules

**The Teal-Means-Progress Rule.** Teal is not a brand accent to sprinkle for
warmth. It appears exactly where something moved forward — a completed
milestone, a primary "Next Step" action, a filled roadmap node. A teal element
that isn't marking progress is a bug in this system, not a style choice.

**The Border-First Rule.** A card's definition comes from a 1px
`outline-variant` border before anything else. Shadow is reserved for the
moment a user actually hovers or interacts — it is feedback, not decoration.

**The Two-Palette Rule.** `--school-*` retints at runtime and belongs to
pathway and plan surfaces only. The tokens above are constant and own
everything else. They never mix on one element.

## Typography

**Headline Font:** Hanken Grotesk (fallback `sans-serif`)
**Body / Label Font:** Inter (fallback `sans-serif`)

**Character:** Hanken Grotesk carries every heading — sharp and contemporary,
doing double duty as "tech" and "human." Inter carries body copy and every
data label, chosen specifically for its legibility at small sizes, which
matters constantly here: tuition figures, wage ranges, and program names are
dense, small, and have to stay readable.

### Hierarchy
- **Display** (Hanken Grotesk 700, 48px/56px, −0.02em): Welcoming headers only.
  Drops to 24px/600 weight on mobile.
- **Headline** (Hanken Grotesk 600, 32px/40px, −0.01em): Section headings.
- **Title** (Hanken Grotesk 600, 24px/32px): Card titles, sub-sections.
- **Body** (Inter 400, 18px/28px): Lead paragraphs. Hold to 65–75ch.
- **Label** (Inter 500, 14px/20px, +0.01em): Buttons, inputs, nav.
- **Label Small** (Inter 600, 12px/16px): Metadata, chips, roadmap markers.

### Named Rules

**The Two-Voice Rule.** A heading is always Hanken Grotesk; a data point,
label, or paragraph is always Inter. If a heading has drifted onto Inter, or a
wage figure has drifted onto Hanken Grotesk, the pairing that gives this
system its character has broken.

## Layout

A fixed-fluid hybrid: a 12-column, 1280px-max desktop grid organized into
8-column content blocks and 4-column sidebars, so line lengths never run
unreadably wide even on an ultrawide monitor. Mobile is a true single column
with 16px margins; cards and roadmaps stretch to the edge to maximize
horizontal room for text rather than floating in extra padding.

An 8px base unit governs all spacing. `stack-lg` (32px) is reserved
specifically for separating distinct steps in a career roadmap — each
milestone earns room to breathe, on purpose.

## Elevation & Depth

**Tonal layers and low-contrast outlines first; shadow only as interaction
feedback**, in three explicit levels:

1. **Background** — the soft canvas, flat.
2. **Cards / surfaces** — white, with a 1px `outline-variant` border. This is
   the default and requires nothing more.
3. **Interactive / hover** — a soft, diffused shadow
   (`0 4px 12px rgb(15 23 42 / 0.05)`) appears only in response to a user
   action. It is feedback, never a resting state.
4. **Overlays** — modals and dropdowns add a slightly stronger shadow plus a
   4px backdrop blur, to pull focus entirely onto the task.

**The Shadow-Is-Feedback Rule.** A card at rest never carries a shadow. If a
shadow is visible and nothing is being hovered, focused, or dragged, it is
wrong.

## Shapes

**Soft and precise**, not extreme. 4px (`DEFAULT`) on inputs and small
buttons — sharp enough to read as professional. 8px (`lg`) on cards and main
containers. 12px (`xl`) reserved for the largest containers only. Fully round
(`full`) is reserved for roadmap nodes and chips — a visual metaphor for a
journey, not a general decoration.

**The Node-Is-Round Rule.** Circular geometry means "a point on a journey."
A roadmap milestone is always a circle; a content card is never circular and
never pill-shaped.

## Components

### Buttons
- **Primary:** Solid near-black, white text, 8px radius. Bold and authoritative
  — the default action.
- **Secondary (Action):** Vibrant teal container, teal text. Reserved
  specifically for "Next Step," "Start Path," "Apply" — anything that
  advances the journey.
- **Ghost:** Transparent, `on-surface-variant` text and border. Tertiary
  actions like "Save for later."

### Cards
- **Standard:** White, 1px `outline-variant` border, 8px radius, 24px padding.
- **Milestone cards:** A 4px left-accent border in teal marks progression
  status — this system's one deliberate departure from "border-radius and
  border-accent don't mix," because the accent is a flag, not a frame.
- **Resource cards:** Plain white, 1px border, no accent — used when nothing
  about the card represents progress.

### Inputs
- **Style:** White fill, 1px `outline-variant` border darkening to near-black
  on focus, 4px radius.
- **Label:** Always persistent text above the field — never a placeholder
  standing in for a label. This system is used under cognitive fatigue by
  design; accessibility here is not optional polish.

### Roadmap Nodes (signature component)
A vertical teal line connects circular milestones. **Active:** 32px circle,
teal border, white center. **Completed:** solid teal fill, white checkmark.
**Upcoming:** `outline-variant` border, no fill. The line and its nodes are
the one place in this system where color alone carries meaning — teal is
always "done or doing," never decoration.

### Progress Indicators
Horizontal bars, `surface-container` track, teal fill, percentage in Label
Small at the top-right for immediate feedback.

## Do's and Don'ts

### Do:
- **Do** use near-black for authority and teal exclusively for progress —
  never the reverse.
- **Do** give every card a 1px `outline-variant` border before considering a
  shadow.
- **Do** reserve shadow for genuine interaction feedback, never a resting
  state.
- **Do** pair Hanken Grotesk headings with Inter body copy and labels,
  consistently.
- **Do** keep roadmap nodes circular and content cards rectangular.
- **Do** put persistent labels above every input field.
- **Do** state that plans are AI-generated estimates anywhere a plan or cost
  appears. This is a product commitment, not a design choice.

### Don't:
- **Don't** reintroduce either retired world: no warm sand, no ink-violet
  900-weight display type, no confetti; no all-blue palette, no
  fully-round-everything geometry, no 16/32/48px radius scale.
- **Don't** use teal for anything that isn't marking progress or a primary
  advancing action.
- **Don't** ship a card with a resting-state shadow.
- **Don't** put an eyebrow or kicker label above a heading.
- **Don't** invent an outcome figure. Every wage, ROI, cost, or duration must
  trace to real catalog data or a real BLS series, and say which.
- **Don't** ship a control for a capability that doesn't exist — no sign-in
  without auth, no "saved" affordance without persistence.
- **Don't** use `school-*` colors outside the pathway and plan surfaces.
- **Don't** add urgency badges, countdowns, scarcity language, or testimonial
  carousels. People act on this advice.
