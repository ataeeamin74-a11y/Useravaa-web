# Useravaa Career PWA Palette Lock v1

## Scope

This document is the palette source of truth for every public Useravaa Career PWA screen: root discovery, category, path, detail, saved paths, and compare. Future Brand Compliance QA for the Career PWA must use this document as the palette source of truth.

## Core Palette

- **UA Navy `#091B49`** — headlines, primary text, and key labels.
- **UA Blue `#245FFD`** — main CTA, active action, and primary interactive emphasis.
- **UA Teal `#01C3B9`** — brand highlights, selected accents, and non-CTA emphasis.
- **White `#FFFFFF`** — cards and main surfaces.
- **Soft BG `#F8FAFC`** — approved very light backgrounds.

## Controlled Accent Palette

- **Insight Yellow `#FFC801`** — allowed as a controlled small accent, especially for insight cues and essential technical-skill emphasis. Text on Yellow must use UA Navy.
- **Persimmon `#F86E4B`** — allowed as a controlled small accent, especially for essential soft-skill emphasis or a limited energy cue.
- **Connection Blue `#0974C5`** — allowed only where it already exists as a defined project token and only as a controlled secondary/product accent, such as tool-related information.

Yellow and Persimmon are required visible accents in both the root Career PWA and Level 4 detail. The root UI must include controlled Yellow and Persimmon accents in the hero highlight and/or domain-card accents.

Essential technical-skill emphasis uses Insight Yellow. Essential soft-skill emphasis uses Persimmon. Yellow and Persimmon are forbidden only for CTA, navigation, large surfaces, and promotional chrome.

Future Career PWA Brand Compliance QA must use this document as its source of truth and must fail if the root experience becomes Blue/Teal-only again.

## Strict Usage Rules

- Main CTA remains UA Blue.
- Brand highlights remain UA Teal.
- Headlines and primary text remain UA Navy.
- Backgrounds remain White or Soft BG.
- Yellow must not become a main CTA, navigation state, hero background, large surface, or promotional treatment.
- Persimmon must not become a main CTA, navigation state, hero background, large surface, or promotional treatment.
- Persimmon icon blocks always use White foreground/icons; Navy or another dark foreground is not allowed on Persimmon.
- Connection Blue must not replace UA Blue for main CTA or active primary actions.
- `ارتباط با مشتری` must use its approved Teal accent and must not use the rejected customer-operations blue.
- Do not introduce random Yellow, Gold, Orange, decorative Red, decorative Purple, off-brand Green, or generic advertising colors.
- Any gradient must run Teal to Blue only.

## Current Career Usage

- Hero phrase highlight: Insight Yellow with UA Navy text.
- Domain-card icon blocks: a balanced rotation of Insight Yellow, Persimmon, UA Blue, UA Teal, and controlled Connection Blue.
- Main and active actions: Blue.
- Essential technical-skill chip: visible controlled Yellow with Navy text.
- Essential tool chip and secondary tool tags: controlled Connection Blue.
- Essential soft-skill chip: visible controlled Persimmon.
- Cards and content surfaces: White or Soft BG.

## Launch Interaction and Display Locks

- The mascot is mandatory on desktop and mobile. It must never intercept pointer input.
- Clickability is a release blocker and must be checked on both `localhost` and `127.0.0.1` during launch QA.
- Card count labels do not show `دسته`.
- Card count labels use `مسیر شغلی`, never the shortened `مسیر` label by itself.
