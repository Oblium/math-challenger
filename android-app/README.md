# Math Challenger Android App

React Native port of the Math Challenger web app using Expo.

## Setup

1. **Prerequisites**
   - Node.js 18+
   - Expo CLI: `npm install -g @expo/cli`
   - For Android: Android Studio + SDK
   - For iOS: Xcode (macOS only)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Development**
   ```bash
   # Start Expo dev server
   npm start

   # Run on Android (requires Android emulator or device)
   npm run android

   # Run on iOS (requires Xcode/iOS simulator)
   npm run ios

   # Run in web browser
   npm run web
   ```

## Features Ported

- ✅ All 10 levels with progressive difficulty
- ✅ Streak tracking with color progression
- ✅ Timer functionality (levels 7, 8, 10)
- ✅ Persistent state (AsyncStorage)
- ✅ Touch-optimized UI
- ✅ Level selection via alerts
- ✅ Dark theme optimized for mobile

## Building for Production

### Android APK
```bash
# Build APK
npx expo build:android

# Or using EAS Build (recommended)
npx eas build --platform android
```

### iOS IPA (macOS only)
```bash
npx eas build --platform ios
```

## Architecture

- `App.tsx` - Main game component with React Native UI
- `src/gameLogic.ts` - Pure game logic ported from web version
- Uses AsyncStorage for persistent level/streak data
- Touch-optimized layout with responsive buttons

## Differences from Web Version

- Uses React Native components instead of HTML/CSS
- AsyncStorage instead of localStorage
- Alert dialogs for level selection
- Touch-optimized button sizes and spacing
- Mobile-first responsive design