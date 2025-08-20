# Math Challenger Android App - Build Instructions

This document provides step-by-step instructions for building the Math Challenger Android APK.

## Prerequisites

### 1. Install Node.js and npm
```bash
# Install Node.js 18+ from https://nodejs.org/
# Verify installation
node --version
npm --version
```

### 2. Install Android Studio
- Download from https://developer.android.com/studio
- Install Android SDK, Android SDK Platform, Android Virtual Device
- Accept all license agreements during installation

### 3. Install Java Development Kit (JDK)
```bash
# Install JDK 11 or higher
# Ubuntu/Debian:
sudo apt install openjdk-11-jdk

# macOS (with Homebrew):
brew install openjdk@11

# Windows: Download from Oracle or use OpenJDK
```

### 4. Set Environment Variables
Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or equivalent):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# On Windows, set these in System Environment Variables:
# ANDROID_HOME: C:\Users\YourUsername\AppData\Local\Android\Sdk
# Add to PATH: %ANDROID_HOME%\platform-tools, %ANDROID_HOME%\cmdline-tools\latest\bin
```

Apply changes:
```bash
source ~/.bashrc  # or restart terminal
```

### 5. Install Expo CLI Tools
```bash
npm install -g @expo/cli eas-cli
```

## Building the APK

### Method 1: Expo Build Service (Recommended - Easiest)

This is the simplest method as Expo handles all the Android SDK complexity.

```bash
# Navigate to the android app directory
cd android-app

# Install dependencies (if not done already)
npm install

# Login to your Expo account (create one at expo.dev if needed)
expo login

# Initialize EAS build configuration
eas build:configure

# Build APK for testing/distribution
eas build --platform android --profile preview

# For production/Play Store (builds AAB):
eas build --platform android --profile production
```

The build will be processed on Expo's servers. You'll get a download link when complete.

### Method 2: Local Development Build

For local development and testing:

```bash
cd android-app

# Start the development server
npm start

# In another terminal, run on Android emulator/device
npx expo run:android
```

This creates a development build that connects to the Metro bundler.

### Method 3: Local Release Build

For a local release build (requires full Android SDK setup):

```bash
cd android-app

# Generate the native Android project
npx expo prebuild --platform android

# Build the release APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## Testing Your Build

### Using Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd YOUR_AVD_NAME

# Install and test your APK
adb install path/to/your/app.apk
```

### Using Physical Device
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect via USB
4. Install APK: `adb install path/to/your/app.apk`

## Build Profiles (EAS)

The `eas.json` file (auto-generated) contains build profiles:

- **development**: For development with Expo dev tools
- **preview**: Creates APK for testing/internal distribution  
- **production**: Creates AAB for Play Store submission

## Troubleshooting

### Common Issues

1. **"Android SDK not found"**
   - Verify ANDROID_HOME is set correctly
   - Ensure Android SDK is installed via Android Studio

2. **"Java not found"**
   - Install JDK 11+ and verify with `java --version`

3. **"License agreements not accepted"**
   ```bash
   yes | sdkmanager --licenses
   ```

4. **"Build failed on EAS"**
   - Check build logs in Expo dashboard
   - Verify package.json dependencies
   - Ensure no syntax errors in code

5. **"Metro bundler issues"**
   ```bash
   npx expo start --clear
   ```

### Getting Help

- Expo Documentation: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
- Android Developer Docs: https://developer.android.com/

## File Locations

After successful builds:
- **EAS builds**: Downloaded from Expo dashboard or provided URL
- **Local builds**: `android/app/build/outputs/apk/release/`
- **Development builds**: Installed directly on device/emulator

## Next Steps

1. Test the APK thoroughly on different devices
2. For Play Store: Use production profile to generate AAB
3. Set up app signing for release builds
4. Consider setting up automated builds with CI/CD

## Notes

- The app uses AsyncStorage for persistent data (level/streak)
- All game logic is shared between web and mobile versions
- Dark theme is optimized for mobile viewing
- Touch interactions are optimized for finger navigation