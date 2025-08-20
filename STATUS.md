# Project Status: Math Challenger

This document summarizes the current state of the project and outlines opportunities for future development. It is intended as a quick handoff for agents extending the app.

## Overview
- Multi-platform arithmetic quiz game with progressive difficulty levels
- **Web App:** React + TypeScript single-page app powered by Vite
- **Android App:** React Native + Expo native mobile app
- Shared game logic between platforms for consistency

## Tech Stack

### Web App
- UI: React 18, React Router 6 (hash routing)
- Build: Vite 5, TypeScript 5 (strict)
- Styles: Plain CSS (`src/styles.css`)

### Android App
- Framework: React Native + Expo
- Storage: AsyncStorage for persistence
- UI: React Native components with StyleSheet

### Shared
- Game Logic: Pure TypeScript functions in `android-app/gameLogic.ts`
- Types: Shared type definitions across platforms

## App Structure

### Project Root
- `android-app/gameLogic.ts`: Shared game logic and types
- `README.md`: Multi-platform documentation

### Web App (`src/`)
- `index.html`: HTML entry, mounts React at `#root`
- `src/main.tsx`: App bootstrap and router setup
- `src/App.tsx`: Sets document title, renders `Game` component
- `src/components/Game.tsx`: Web UI implementation (imports from common)
- `src/styles.css`: Web styling (dark theme, responsive)
- `vite.config.ts`: Vite config with relative paths
- `scripts/relativize-dist.mjs`: Post-build URL relativization
- `dist/`: Built web artifacts

### Android App (`android-app/`)
- `App.tsx`: React Native UI implementation (imports from common)
- `package.json`: React Native + Expo dependencies
- `INSTRUCTIONS_APP.md`: Detailed Android build instructions
- `README.md`: Android-specific documentation

## Current Functionality
- Levels and problem generation:
  - Level 1: two operands in [0..9], addition.
  - Level 2: two operands in [0..50], addition.
  - Level 3: two or three operands in [0..99], addition.
  - Level 4: a − b with a in [4..20], b in [2..(a−1)] (non-negative result).
  - Level 5: two or three numbers with +/-; first number in [5..15], subsequent in [1..20]; running total kept non-negative.
  - Level 6: two or three numbers in [0..20] with +/-; negatives allowed.
  - Level 7: same as 6 with a 20s countdown timer.
  - Level 8: same as 7 but operands drawn from [1..99].
  - Level 9: multiplication of two numbers in [0..9].
  - Level 10: two or three numbers in [1..30] with +/−/× and operator precedence (× before +/−), with a 13s countdown timer.
- Answer choices:
  - Always three options (1 correct + 2 distractors).
  - For levels 3+: wrong choices are biased so that 0/1/2 share the same last digit as the correct answer with probabilities 10%/45%/45% respectively.
  - A distance cap keeps wrong answers “near” the correct answer; the cap scales with range but never exceeds 40. The cap is enforced first, then the last-digit bias (pickers respect the cap).
- Feedback & flow:
  - Correct: shows "Correct! 🎉", locks inputs, and advances after ~800ms.
  - Level-up: after a streak of 20, shows "you made it to the next level!" and advances after ~500ms.
  - Wrong: shows "Try again…" and disables the clicked option.
  - Timers: 20s countdown on levels 7 and 8; 13s countdown on level 10; timeouts reset streak.
- Persistence:
  - `level` and `streak` are saved in `localStorage` and restored on refresh.
- Accessibility:
  - `aria-live` announcements for operation, feedback, and timer; labeled level selector; buttons for choices.

## Layout & UX Notes
- Bottom half: choices are always shown side-by-side (3 columns) and aligned to the top of the bottom section for proximity to the formula.
- Symmetric horizontal padding prevents buttons from touching screen edges.
- Mobile: viewport disables zoom (`user-scalable=no`), which may impact accessibility (see Known Limitations).

## Build, Run, and Checks
- Dev: `npm run dev`
- Type-check: `npm run check`
- Build: `npm run build` (TypeScript build + Vite + post-build URL relativization)
- Preview: `npm run preview`

Notes on static hosting and local file usage:
- Vite config sets `base: './'` to emit relative asset URLs.
- The `relativize-dist.mjs` script additionally rewrites `/assets/...` to `assets/...` in `dist/index.html` to support `file://` opening and subpath hosting. With `base: './'`, this may be redundant, but it is kept to harden `dist/` for offline usage.

## Quality & Tooling
- TypeScript is enabled with strict settings (e.g., `noUncheckedIndexedAccess`).
- No linting or formatting setup (ESLint/Prettier) is present.
- No unit, integration, or e2e tests are present.
- No CI configured.

## Known Limitations / Gaps
- No division yet; mixed-operation mode with multiplication exists at Level 10 only.
- Scoring is streak-based only; no points/combos/leaderboard. Persistence is limited to `level` and `streak`.
- No sound effects or rich animations for feedback or level-up.
- No keyboard shortcuts (number keys/Enter/Escape) or explicit focus management on new question.
- Accessibility can be improved (reduced motion, high-contrast theme, focus traps).
- Mobile zoom disabled; consider an accessibility toggle to re-enable zoom.
- Internationalization missing (static English strings).
- Router has a single route; no deep links to settings.
- `dist/` is committed; decide policy for version control.

## Architectural Notes

### Shared Architecture
- **Pure Game Logic:** All game mechanics extracted to `android-app/gameLogic.ts`
- **Platform-Agnostic:** Core functions work identically on web and mobile
- **Type Safety:** Shared TypeScript types ensure consistency

### Web App Architecture
- Game state uses React state (`useState`) with shared logic functions
- UI-specific logic in `Game.tsx` (timers, persistence, routing)
- Timing handled with `setTimeout` and `locked` flag

### Android App Architecture
- React Native components with AsyncStorage persistence
- Touch-optimized UI with Alert dialogs for level selection
- Background timer management with proper cleanup

### Shared Patterns
- Choices keyed using `Date.now()`-derived IDs
- Consistent problem generation and validation
- Identical streak progression and color thresholds

## Suggested Backlog
- Functional
  - Division and mixed-ops mode (including multiplication beyond Level 9).
  - Optional timer for Level 9; alternative timer lengths per level.
  - Scoring system (points/combos), session summary, leaderboard.
  - Modes: timed blitz, practice (no auto-advance), custom ranges.
  - Persistence beyond level/streak (e.g., settings, mode, totals).
  - Keyboard shortcuts and better focus management on new questions.
  - Feedback polish: animations/toasts, confetti on level-up; optional sounds.
  - i18n scaffolding and language switcher.
  - PWA support for offline install and caching.
- Code quality & architecture
  - ✅ **COMPLETED:** Extract pure game helpers to shared `common/` folder
  - Add unit tests for shared game logic (vitest + RTL)
  - Add ESLint + Prettier; integrate CI for check/lint/test/build
  - Replace `Date.now()` in keys with stable/random IDs
  - Cross-platform testing strategy
- Deployment
  - Decide on committing `dist/`.
  - Add GitHub Pages/Static hosting workflow; verify hash routing.
  - If switching off hash routing, add server rewrites.
 - Accessibility
  - High-contrast theme, reduced motion options, and optional zoom toggle.

## Quick Start for Contributors
- Install: `npm install`
- Run: `npm run dev`
- Build: `npm run build` (open `dist/index.html` directly if desired)

## Status Summary
- **Multi-Platform:** Web app and Android app both fully functional
- **Shared Logic:** Game mechanics centralized in `common/` for consistency
- **Complete Feature Set:** All 10 levels implemented across both platforms
  - Levels 1–10: addition, subtraction, mixed +/-, multiplication, and precedence
  - Timers on levels 7–8 (20s) and level 10 (13s)
  - Streak progression (20 correct answers to advance)
- **Platform-Specific Features:**
  - Web: localStorage persistence, keyboard/mouse input
  - Android: AsyncStorage persistence, touch-optimized UI

## UI: Streak Display
- Levels 1–9: streak shows as `x/20` to indicate progress to the next level.
- Level 10 (final): shows only the streak number; displays a 🎉 when the streak goes above 20.
- Streak color thresholds (progressive):
  - 5: orange
  - 10: yellow
  - 15: light green
  - 18: green
- Streak-based progression with level-up message and delayed advance; level and streak persist via localStorage.
- Wrong-answer generation improved for levels 3+ (last-digit bias and distance cap).
- Tooling and tests still minimal; good candidates for next iteration.
