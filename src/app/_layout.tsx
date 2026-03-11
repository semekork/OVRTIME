import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { Appearance } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

const BG = '#000000';
const TEXT = '#FFFFFF';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: BG,
    card: BG,
  },
};

export default function RootLayout() {
  useEffect(() => {
    Appearance.setColorScheme('dark');
    SystemUI.setBackgroundColorAsync(BG);
  }, []);

  return (
    <ThemeProvider value={customDarkTheme}>
      <StatusBar style="light" />
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: '',
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: BG },
        }}
      >
        {/* Tab screens — no header, the tab bar handles navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Full-screen stack screens with back button */}
        <Stack.Screen
          name="match/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: BG },
            headerTintColor: TEXT,
            headerTitleStyle: { fontWeight: '700', fontSize: 16, color: TEXT },
            headerBackTitle: '',
            // shows the native iOS < back chevron automatically
          }}
        />
        <Stack.Screen
          name="league/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: BG },
            headerTintColor: TEXT,
            headerTitleStyle: { fontWeight: '700', fontSize: 17, color: TEXT },
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: BG },
            headerTintColor: TEXT,
            headerTitleStyle: { fontWeight: '700', color: TEXT },
            headerBackTitle: '',
            headerTitle: 'Settings',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
