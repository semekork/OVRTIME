# OVRTIME

OVRTIME is a highly performant, pixel-perfect clone of the "LiveScore" app built with React Native and Expo. It provides live sports scores, match details, and a seamless native experience to keep you up-to-date with your favorite leagues and matches. The app is completely free, requires no user authentication, and is powered by public APIs.

## Features

- **Live Scores & Updates:** Automatic score refreshing for live matches every 5 seconds (configurable via the Settings screen).
- **Extensive Coverage:** Track matches across over 30 global soccer leagues.
- **Dynamic Match Details:** Sub-screens for specific matches including head-to-head data.
- **League Pages:** Dive deep into league-specific data and standings.
- **Native User Experience:** Featuring a native search bar, bottom tabs, and iOS Live Activities via `@expo/widgets`.
- **Match Organization:** Matches grouped by League/Country with compact match rows and a star icon for marking favorites.
- **Premium Dark UI:** A striking interface characterized by a deep black background, dark grey separators, white text, and bright orange for live elements.
- **Easy Navigation:** Includes a horizontal scrollable date selector for looking at past and upcoming matches.

## Tech Stack

- **Framework:** [Expo SDK 55](https://expo.dev/) & [React Native](https://reactnative.dev/)
- **Routing:** [Expo Router v55](https://docs.expo.dev/router/introduction) with native tabs
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Data Fetching & State:** [TanStack Query](https://tanstack.com/query/latest)
- **Widgets:** iOS Live Activities utilizing `expo-widgets` (requires native build)
- **Data Source:** [TheSportsDB API](https://www.thesportsdb.com/) for up-to-date soccer scores and data

## Getting Started

### Prerequisites

- Node.js installed
- iOS Simulator or an Android Emulator
- [Expo CLI](https://docs.expo.dev/more/expo-cli/)

### 1. Install Dependencies

Clone this repository, navigate to the root directory, and run:

```bash
npm install
```

### 2. Run the App

For standard development:

```bash
npx expo start
```

*Note: Since this application leverages `@expo/widgets` for iOS Live Activities, it requires a custom native build (Development Build) rather than Expo Go. To run the app with live activities:*

```bash
# Run the iOS development build
npx expo run:ios
```

## Project Structure

- `src/` - Global components, context, styling layouts, and utility functions
- `app/` - File-based routing corresponding to application screens (Home, Search, Leagues, Match, Settings)

## Configuration

The automatic score refresh loop (default: 5 seconds for live matches) can be toggled and configured within the in-app **Settings** screen.

---

Built with focus on information density, utility, and premium native design patterns.
