# Production Value Checklist

## Top-Line Priorities (Do These First)

- [ ] **Playable, stable demo loop (3–10 min)** with no crashes on Chrome and Firefox
- [ ] **Responsive UI and clear affordances** — players should always know available actions
- [ ] **Readable visual hierarchy** — HUD, resource counters, tech tree must be legible at demo resolution (1280×720, 1920×1080)
- [ ] **Tight trailer (60s)** that shows the game's best moments and ends on a strong emotional beat
- [ ] **Subtitles & captions** for all VO and critical UI guidance (English)
- [ ] **Optimize build size & load time** — < ~80MB ideal, < 30s load on 50 Mbps

## Core Gameplay

- [ ] No hard-crashes in main demo mission
- [ ] Player can complete the demo mission start→finish without special input
- [ ] All required controls explained in 30s tutorial overlay
- [ ] No blocked states — actions that deadlock the player
- [ ] Edge-case test: zero resources, max resources, no enemies visible
- [ ] Save/restore state for demo (if applicable) or reset button

## UI / UX

- [ ] All HUD text readable at 1280×720 and 1920×1080
- [ ] Buttons have hover + pressed states
- [ ] Modal dialogs disable underlying controls
- [ ] Input hint tooltips for first-time players
- [ ] Loading states for async operations
- [ ] Error messages are clear and actionable
- [ ] Consistent spacing & iconography
- [ ] Colorblind-friendly palettes + icons for resource types

## Polish (Visual/Audio)

- [ ] Smooth transitions between states (fade/crossfade 150–300ms)
- [ ] Camera shake only on major events and with user-toggle
- [ ] Dialogue has ducked music and lip-sync for cutscenes (if applicable)
- [ ] SFX prioritization: dialogue > UI > SFX > music (ducking implemented)
- [ ] No visual glitches or artifacts
- [ ] Consistent animation timing
- [ ] Proper z-index layering

## Performance

- [ ] Stable 30+ FPS in browser demo on mid-range laptop (Chrome)
- [ ] Main scenes load within acceptable time (progress bar shown)
- [ ] Memory usage < browser allocation (avoid out-of-memory)
- [ ] No memory leaks (test for 10+ minutes)
- [ ] Bundle size optimized (code splitting, lazy loading)
- [ ] Assets compressed and optimized

## Accessibility & Safety

- [ ] English subtitles for all VO; accurate and synchronized
- [ ] Colorblind-friendly palettes + icons for resource types
- [ ] Trigger warnings for flashing/strobe effects
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility (ARIA labels)
- [ ] High contrast mode option

## Submission Assets

- [ ] 60–90s trailer (16:9) + vertical short
- [ ] Playable link (Itch.io) and step-by-step play instructions for judges
- [ ] "How AI was used" doc and prompt logs
- [ ] 3 annotated screenshots showing key systems (resources, tech tree, terrain)
- [ ] Build Report PDF with metrics
- [ ] Subtitle files (SRT/WebVTT)
- [ ] Known issues list and version number

## Browser Compatibility

- [ ] Chrome (latest stable) — primary
- [ ] Firefox (latest) — secondary
- [ ] Edge (Chromium) — optional
- [ ] Safari (Mac) — test if possible

## Network Testing

- [ ] Test on fast connection (50+ Mbps)
- [ ] Test on throttled connection (5–10 Mbps)
- [ ] Progressive loading UI shows progress
- [ ] Graceful degradation on slow connections

## Playtest

- [ ] 10–20 human testers across skill levels
- [ ] Collect bug reports
- [ ] Test clarity of UI
- [ ] Measure perceived quality
- [ ] Verify demo felt polished

## Telemetry & Metrics

- [ ] Startup time (seconds to main menu) — target < 15s
- [ ] Average FPS during demo on test machines
- [ ] Memory usage (MB) at peak
- [ ] Crash count across playtests (should be zero)
- [ ] Load artifact size (MB)
- [ ] Subtitle coverage: number of VO lines subtitled and sync accuracy
- [ ] User-reported polish metrics: % players reporting "game felt smooth/professional"

