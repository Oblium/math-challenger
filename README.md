Math Challenger

Simple React + TypeScript app that quizzes the user with basic arithmetic problems and three possible answers.

Requirements implemented
- Multiple levels:
  - Level 1: addition of 2 single-digit numbers (0–9).
  - Level 2: addition of 2 numbers (0–50).
  - Level 3: addition of 2–3 numbers (0–99).
  - Level 4: difference where first ∈ [4,20], second ∈ [2, a-1] (i.e., a > b, non-negative result).
  - Level 5: 2–3 numbers in [0,20] with random +/−; result constrained to be non-negative.
  - Level 6: 2–3 numbers in [0,20] with random +/−; result may be negative.
- Shows the operation centered in the top half.
- Bottom half shows 3 choices, one correct.
- On click:
  - Correct: shows positive feedback and generates a new problem (after a short delay).
  - Wrong: shows negative feedback and disables the clicked option (grays it out).

Getting started
- Prereqs: Node 18+ and npm (or pnpm/yarn).
- Install: `npm install`
- Dev server: `npm run dev` then open the printed URL.
- Type-check: `npm run check`
- Build: `npm run build`
- Preview build: `npm run preview`

Notes
- Routing uses `react-router-dom` with a single route (`/`) for the game.
- Styling keeps the screen split visually between top and bottom halves.
