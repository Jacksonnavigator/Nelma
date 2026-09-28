import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";

// Tab screens stay mounted, so a <StatusBar> element would win on every tab.
// Switch the style only while this screen is focused and hand it back on blur.
export const useLightStatusBar = (): void => {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, [])
  );
};
