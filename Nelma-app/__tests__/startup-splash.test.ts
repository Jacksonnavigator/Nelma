import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const video = vi.hoisted(() => ({
  listeners: new Map<string, (event?: unknown) => void>(),
  play: vi.fn(),
  pause: vi.fn(),
  status: "readyToPlay",
  released: false,
  loop: true,
  muted: false,
  audioMixingMode: "auto"
}));
const hideAsync = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("expo-splash-screen", () => ({ hideAsync }));
vi.mock("expo-video", async () => {
  const { useEffect } = await import("react");
  return {
    VideoView: "video",
    useVideoPlayer: (_source: unknown, setup: (player: typeof video) => void) => {
      setup(video);
      // Expo's hook releases the native player before later component cleanups run.
      useEffect(() => () => { video.released = true; }, []);
      return Object.assign(video, {
        addListener: (event: string, callback: (payload?: unknown) => void) => {
          video.listeners.set(event, callback);
          return { remove: () => video.listeners.delete(event) };
        }
      });
    }
  };
});
vi.mock("react-native", () => ({
  Image: "image",
  StyleSheet: { create: (styles: unknown) => styles },
  Easing: { quad: (value: number) => value, inOut: (easing: unknown) => easing },
  Animated: {
    View: "view",
    Value: class { constructor(public value: number) {} },
    timing: (_value: unknown, options: { duration: number }) => {
      let timer: ReturnType<typeof setTimeout>;
      return {
        start: (done: (result: { finished: boolean }) => void) => {
          timer = setTimeout(() => done({ finished: true }), options.duration);
        },
        stop: () => clearTimeout(timer)
      };
    }
  }
}));

import { StartupSplash } from "../components/startup-splash";

let renderer: ReactTestRenderer | undefined;
const onFinish = vi.fn();
const props = { onFinish, source: { uri: "splash.mp4" }, poster: { uri: "poster.png" } };
async function mount(ready: boolean) {
  await act(async () => { renderer = create(createElement(StartupSplash, { ...props, ready })); });
}
async function emit(event: string, payload?: unknown) {
  await act(async () => { video.listeners.get(event)?.(payload); });
}
async function advance(ms: number) {
  await act(async () => { vi.advanceTimersByTime(ms); });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.clearAllMocks();
  video.listeners.clear();
  video.released = false;
  video.pause.mockImplementation(() => {
    if (video.released) throw new Error("Native shared object has already been released");
  });
});
afterEach(async () => {
  await act(async () => { renderer?.unmount(); });
  renderer = undefined;
  vi.useRealTimers();
});

describe("video startup splash", () => {
  it("lets Expo release the player without calling native methods afterward", async () => {
    await mount(true);
    await act(async () => { renderer!.unmount(); });
    renderer = undefined;
    expect(video.released).toBe(true);
    expect(video.pause).not.toHaveBeenCalled();
    expect(video.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("plays once muted and waits for the whole video even when the app is ready", async () => {
    await mount(true);
    expect(video.play).toHaveBeenCalledOnce();
    expect(video.loop).toBe(false);
    expect(video.muted).toBe(true);
    await advance(5000);
    expect(onFinish).not.toHaveBeenCalled();
    await emit("playToEnd");
    await advance(450);
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("holds the last frame until app initialization completes", async () => {
    await mount(false);
    await emit("playToEnd");
    await advance(20000);
    expect(onFinish).not.toHaveBeenCalled();
    expect(video.pause).not.toHaveBeenCalled();
    await act(async () => { renderer!.update(createElement(StartupSplash, { ...props, ready: true })); });
    await advance(450);
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("reveals the video only after its first frame renders", async () => {
    await mount(true);
    expect(renderer!.root.findAllByType("image").length).toBe(1);
    await act(async () => { renderer!.root.findByType("video").props.onFirstFrameRender(); });
    expect(renderer!.root.findAllByType("image").length).toBe(0);
    expect(hideAsync).toHaveBeenCalled();
  });

  it("falls back to the poster and exits on a playback error", async () => {
    await mount(true);
    await emit("statusChange", { status: "error" });
    expect(renderer!.root.findAllByType("video").length).toBe(0);
    expect(renderer!.root.findAllByType("image").length).toBe(1);
    await advance(450);
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("recovers from a stalled player and cleans up listeners and timers", async () => {
    await mount(true);
    await advance(15000);
    await advance(450);
    expect(onFinish).toHaveBeenCalledOnce();
    await act(async () => { renderer!.unmount(); });
    renderer = undefined;
    expect(video.listeners.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
