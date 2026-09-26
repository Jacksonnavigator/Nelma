import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { repositories } from "../repositories";
import { driverDuty } from "../services/driver-duty";

const BEACON_INTERVAL_MS = 60_000;

// While the driver is on duty and the app is open, share their position with dispatch once a minute.
// Foreground only: nothing is read when the app is in the background or the driver is off duty.
// Permission is asked once per app session; a refusal simply turns the beacon off.
export const useLocationBeacon = (): void => {
  const [onDuty, setOnDuty] = useState(driverDuty.get());
  const asked = useRef(false);

  useEffect(() => {
    const unsubscribe = driverDuty.subscribe(setOnDuty);
    return () => {
      unsubscribe();
      driverDuty.set(null); // Leaving the driver area (sign out) forgets the duty state.
    };
  }, []);

  useEffect(() => {
    if (onDuty !== true || Platform.OS === "web") return;
    let stopped = false;
    const beacon = async () => {
      if (stopped || AppState.currentState !== "active") return;
      try {
        const { locationService } = await import("../services/location");
        const prompt = !asked.current;
        asked.current = true;
        const position = await locationService.getDriverPosition(prompt);
        if (position && !stopped) await repositories.driver.shareLocation(position);
      } catch {
        // Best effort: dispatch simply sees an older position.
      }
    };
    void beacon();
    const timer = setInterval(() => void beacon(), BEACON_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void beacon();
    });
    return () => {
      stopped = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, [onDuty]);
};
