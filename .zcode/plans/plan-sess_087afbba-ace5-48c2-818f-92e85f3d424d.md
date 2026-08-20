# Screen 9 (MomentOfTruthScreen) — "Two-Act Synthesis Cinematic"

**Single file: `src/components/onboarding/OnboardingScreens.tsx` only** (lines ~2194–2480 rewritten + new sub-components beside it). index.tsx, OnboardingVisuals, MomentResultCard (now screen 10's), CTA, paywall, screens 1–8: all untouched. The `onAnimationComplete` host contract (CTA unlock via `setSynthesisComplete`) is preserved.

## Act 1 — Synthesis (0 → ~4.7s, slower & smoother)

### `SynthesisRing` (new component)
Dual-arc scanner ring, replaces the single teal arc. 140px container:
- Static dashed guide circle (r46, `strokeDasharray "2 6"`, green ~18% opacity)
- Main arc: 270° gradient arc (r44, `url(#grad)` GREEN→GREEN_BRIGHT light / GREEN→GREEN_LIGHT dark), wrapper rotating 0→360° on a 2400ms linear native loop
- Counter arc: 90° arc (r35) in GREEN_LIGHT, counter-rotating on a 3600ms loop
- Soft radial green glow behind the mascot (RadialGradient, like screen 6's)
- `phase: 'synthesizing' | 'complete'`: on complete, arcs animate to full circle (dashoffset→0, 600ms, JS driver, one-shot) and rotation eases into a slow **8000ms ambient loop that never stops** — the continuous revolving ring the user asked for
- Mascot inside: 'thinking' during synthesis → 'happy' + scale pop (1→1.12→1, 450ms) at completion. reduceMotion: static full ring, happy mascot.

### `SynthesisCard` (new component) — the 4 config cards, now with titles
Layout: `[status 22px] [Title 13px/800 over detail 12px/500]`. Data:
1. **User profile** — "Configuring for {name|guest}"
2. **Shopping rhythm** — "{daily|weekly|monthly|occasional} packaged food"
3. **Allergen safeguard** — "Watching N substance(s)" / "No allergies — shield on standby"
4. **Scanner modules** — "Loading N module(s)"

States:
- **pending** — 35% opacity ghost, hollow-circle status
- **loading** — green border tint, green-tinted bg, pulsing green LED (reuse `LedLight` with green color/glow props), animated ellipsis on the detail line
- **complete** — check pops (scale 0.3→1.15→1 spring, green circle + glow), one green wash flash fading to neutral

Entrance per card: fade + translateY 14→0, 320ms out-cubic.

**Timing (the requested extra delay):** card i enters 'loading' at 250 + i·1150ms, completes ~1000ms later (cards complete at ≈1.25s / 2.4s / 3.55s / 4.7s — today it's a 900ms cadence). All timers ref-tracked with the existing cleanup pattern.

## Act 2 — Dossier Reveal (~4.7s → ~6.4s)

- **t≈5.1s:** title crossfades (two stacked ScreenHeadings, opacity swap 400ms) from *"Synthesizing your **BiteFix scanner**..."* / *"Your answers are becoming your personal scanner."* to *"{Name}, your scanner is **ready**."* / *"Built from your answers — here's what it watches for."* Ring flips to 'complete' phase; mascot pops happy.
- **t≈5.3s:** checklist crossfades out; **`ScannerDossier`** fades/scales in (0.96→1, 400ms):
  - Header: 64px mini SynthesisRing avatar (ambient rotation) + "{Name}'s Scanner" (16px/900) + verified row (green check-circle + "Personalized & Ready" in GREEN)
  - Divider, then the 4 parameters as final config rows, staggered 120ms: [green icon 16px] [label] [value right, 800] [✓] — icons: UserRound, ShoppingBag (new lucide import), ShieldCheck, Zap
  - Footer: "ACTIVE MODULES" eyebrow + chips of the user's selected priorities (labels via `PRIORITY_META` imported from OnboardingVisuals; chip = `${GREEN}12` bg, `${GREEN}35` border, GREEN 11px/800)
- **t≈6.4s:** `onAnimationComplete()` fires → host CTA unlocks.

## Cross-cutting
- **Color re-grade:** every `#14ae97` / `#13f5b0` on this screen → brand ramp (GREEN `#01922A`, GREEN_BRIGHT, GREEN_LIGHT, dark icon `#34D873`).
- **reduceMotion:** jump straight to final state — ready title, full static ring, dossier shown with all rows visible, `onAnimationComplete()` fired immediately (matches current behavior).
- **!isActive:** full reset to pending (existing pattern), replays on re-entry.
- Dark-mode variants for every tint/border/glow.
- New imports: `ShoppingBag` from lucide; `PRIORITY_META` from './OnboardingVisuals'. `MomentResultCard` import stays (still used by screen 10).

## Verify
`npx tsc --noEmit` clean; memory file updated with screen-9 design decisions.