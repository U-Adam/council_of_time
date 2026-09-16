# The Council of Time — Brand Standard

**Status:** Locked
**Effective:** 2026-09-15

This file is the canonical visual-identity specification for The Council of Time. Product work may adapt layout and interface behavior, but it should not invent a competing logo, palette, wordmark treatment, favicon, social identity, or primary descriptor.

## 1. Core identity

### Canonical mark: the Witness Seal
Use `public/council-mark.svg` as the sole compact symbol.

The mark consists of:
- an observing eye — witness, attention, lived consequence;
- a compass star — inquiry and orientation without pretending to certainty;
- four measured nodes — systems, plurality, and disciplined method;
- a circular seal — continuity across time.

Do not substitute a standalone letter **C**, italicize “of,” add a mascot, introduce a second emblem, or redraw the seal casually.

### Wordmark
Write the name exactly as:

**The Council of Time**

Use an editorial serif for the name and a restrained sans-serif for interface/supporting copy. The production stacks remain deliberately dependency-light:
- Display / wordmark: `Georgia, "Times New Roman", serif`
- Interface / body: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Primary descriptor

**A serious table for difficult questions**

This is the Council’s primary public-facing descriptor and should remain prominent on the home experience and major brand surfaces.

### Methodological line

**The goal is clearer thinking, not consensus.**

This explains the method beneath the descriptor. It may accompany the primary descriptor, but it should not displace it.

## 2. Palette

| Token | Hex | Use |
| --- | --- | --- |
| Near Black | `#11100E` | Primary background, seal field |
| Ivory | `#F4EFE4` | Primary text |
| Seal Ivory | `#EFE6D8` | Eye/detail inside seal |
| Brass | `#B99249` | Seal ring, rules, institutional accent |
| Gold | `#D4A84F` | Active/high-emphasis accent |
| Muted | `#AAA298` | Secondary text |
| Rust | `#B96545` | Rare secondary accent only |

Gold and brass should feel structural, not luxurious. Rust is seasoning, not a competing brand color.

## 3. Logo usage

### Header
Use the Witness Seal beside the full wordmark. The seal may scale down, but its proportions and colors remain unchanged.

### Favicon / app icon
Use the Witness Seal alone. Never attempt to fit the full wordmark into favicon-sized contexts.

### Watermark
Use the Witness Seal alone at low opacity. Do not remove the eye or compass star to create a separate watermark symbol.

### Do not
- render the legacy circular **C** mark;
- distort or rotate the seal;
- recolor it with arbitrary theme colors;
- add glow, bevel, drop shadow, chrome, gradients, or faux-aged texture;
- place the mark inside a second decorative badge;
- use multiple versions of the identity on one screen.

## 4. Voice of the visual system

The identity should be able to sit beside an ancient manuscript, a Renaissance anatomical plate, a modern medical journal, and a contemporary cultural publication without impersonating any of them. It should feel serious without becoming ceremonial, scholarly without becoming institutional cosplay, and modern without becoming generic SaaS.

Use space, hierarchy, rules, typography, and evidence of method. Avoid ornamental gravitas.

## 5. Social sharing

Canonical social card: `public/social-share.png`

- Size: `1200 × 630`
- Mark: Witness Seal
- Name: The Council of Time
- Primary descriptor: **A serious table for difficult questions**
- Methodological line: **The goal is clearer thinking, not consensus.**
- Domain: `thecounciloftime.com`

Open Graph and X/Twitter metadata should reference the canonical domain and this image.

## 6. Metadata copy

**Title:** The Council of Time

**Description:** A serious table for difficult questions. The goal is clearer thinking, not consensus.

Supporting interface copy such as **Questions worth arguing about** may remain where it works contextually, but it is not the primary descriptor.

## 7. Change control

This standard is intentionally narrow. New pages and product features inherit it by default. Changes to the core mark, name treatment, primary descriptor, primary palette, favicon, or social card are brand changes and should be explicit decisions rather than incidental UI edits.
