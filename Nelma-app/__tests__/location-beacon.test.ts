import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const shareLocation = vi.hoisted(() => vi.fn(async () => undefined));
const getDriverPosition = vi.hoisted(() => vi.fn(async (_prompt: boolean) => ({ latitude: -3.37, longitude: 36.68 })));
vi.mock("react-native", () => ({
  AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
  Platform: { OS: "android" }
}));
vi.mock("../repositories", () => ({ repositories: { driver: { shareLocation } } }));
vi.mock("../services/location", () => ({ locationService: { getDriverPosition } }));

import { useLocationBeacon } from "../hooks/use-location-beacon";
import { driverDuty } from "../services/driver-duty";

const Probe = () => {
  useLocationBeacon();
  return null;
};

let renderer: ReactTestRenderer | undefined;
const flush = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  await act(async () => { renderer = create(createElement(Probe)); });
});
afterEach(async () => {
  await act(async () => { renderer?.unmount(); });
  vi.useRealTimers();
});

describe("location beacon", () => {
  it("stays silent until the driver is known to be on duty", async () => {
    await flush();
    expect(getDriverPosition).not.toHaveBeenCalled();
    await act(async () => { driverDuty.set(false); });
    await flush();
    expect(shareLocation).not.toHaveBeenCalled();
  });

  it("shares the position while on duty and asks for permission only once", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    await act(async () => { driverDuty.set(true); });
    await flush();
    expect(shareLocation).toHaveBeenCalledWith({ latitude: -3.37, longitude: 36.68 });
    await act(async () => { vi.advanceTimersByTime(60_000); });
    await flush();
    expect(getDriverPosition.mock.calls.map(([prompt]) => prompt)).toEqual([true, false]);

    await act(async () => { driverDuty.set(false); });
    await act(async () => { vi.advanceTimersByTime(120_000); });
    await flush();
    expect(shareLocation).toHaveBeenCalledTimes(2);
  });

  it("forgets the duty state when the driver area closes", async () => {
    await act(async () => { driverDuty.set(true); });
    await act(async () => { renderer?.unmount(); });
    renderer = undefined;
    expect(driverDuty.get()).toBeNull();
  });
});
