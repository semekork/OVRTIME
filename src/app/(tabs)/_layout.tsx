import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { Appearance } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000000",
    card: "#000000",
  },
};

export default function TabLayout() {
  useEffect(() => {
    Appearance.setColorScheme("dark");
    SystemUI.setBackgroundColorAsync("#000000");
  }, []);

  return (
    <ThemeProvider value={customDarkTheme}>
      <StatusBar style="light" />
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
