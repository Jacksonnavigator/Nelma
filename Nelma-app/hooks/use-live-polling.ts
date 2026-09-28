import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

// Runs `refresh` every `intervalMs` while the screen is focused and the app is in the foreground,
// and once more whenever the app returns to the foreground.
export const useLivePolling = (refresh: () => void, intervalMs = 30000): void => {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);

  useFocusEffect(useCallback(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === "active") latest.current();
    }, intervalMs);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") latest.current();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]));
};
