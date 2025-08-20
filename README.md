# Math Challenger

Multi-platform arithmetic quiz game with progressive difficulty levels.

## Platforms

### Web App (React + TypeScript)
Simple React + TypeScript app that quizzes the user with basic arithmetic problems and three possible answers.

### Android App (React Native + Expo)
Native Android version with touch-optimized UI and mobile-specific features.

## Project Structure

```
math-challenger/
├── common/src/           # Shared game logic between platforms
├── src/                  # Web app (React + Vite)
├── android-app/          # Android app (React Native + Expo)
└── dist/                 # Built web app
```

## Features Implemented

- **10 Progressive Levels:**
  - Level 1: Addition of 2 single-digit numbers (0–9)
  - Level 2: Addition of 2 numbers (0–50)
  - Level 3: Addition of 2–3 numbers (0–99)
  - Level 4: Subtraction where first ∈ [4,20], second ∈ [2, a-1] (non-negative result)
  - Level 5: 2–3 numbers with +/−; first in [5,15], others in [1,20]; result non-negative
  - Level 6: 2–3 numbers in [0,20] with +/−; negatives allowed
  - Level 7: Level 6 + 20s countdown timer
  - Level 8: Level 7 with numbers [1,99]
  - Level 9: Multiplication of 2 numbers (0–9)
  - Level 10: 2–3 numbers [1,30] with +/−/× and operator precedence, 13s timer

- **Gameplay Features:**
  - Streak system with 20 correct answers to advance levels
  - Progressive streak colors (5: orange, 10: yellow, 15: light green, 18: green)
  - Smart wrong answer generation with last-digit bias
  - Persistent level and streak across sessions
  - Countdown timers on advanced levels
  - Immediate feedback on answers

## Getting Started

### Web App
```bash
# Prerequisites: Node 18+ and npm
npm install
npm run dev          # Development server
npm run check        # Type checking
npm run build        # Production build
npm run preview      # Preview build
```

### Android App
```bash
cd android-app
npm install
npm start           # Start Expo dev server
npm run android     # Run on Android emulator/device
```

For detailed Android build instructions, see [`android-app/INSTRUCTIONS_APP.md`](android-app/INSTRUCTIONS_APP.md).

## Technical Details

- **Shared Logic:** All game mechanics are in `android-app/gameLogic.ts`
- **Web:** React 18 + TypeScript + Vite with hash routing
- **Android:** React Native + Expo with AsyncStorage persistence
- **Styling:** Dark theme optimized for both web and mobile
- **Persistence:** localStorage (web) / AsyncStorage (mobile)

## Architecture Notes

- Pure functional game logic separated from UI components
- Platform-specific UI implementations sharing core game rules
- Responsive design for different screen sizes
- Accessibility features with ARIA labels and live regions
