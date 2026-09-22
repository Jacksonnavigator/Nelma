import * as SplashScreen from "expo-splash-screen";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, type ImageSourcePropType } from "react-native";

type StartupSplashProps = {
  ready: boolean;
  onFinish: () => void;
  source: VideoSource;
  poster: ImageSourcePropType;
};

const hideNativeSplash = () => {
  SplashScreen.hideAsync().catch(() => undefined);
};

export const StartupSplash = ({ ready, onFinish, source, poster }: StartupSplashProps) => {
  const [firstFrame, setFirstFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playbackFinished, setPlaybackFinished] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const player = useVideoPlayer(source, (video) => {
    video.loop = false;
    video.muted = true;
    video.audioMixingMode = "mixWithOthers";
  });

  const failPlayback = useCallback(() => {
    player.pause();
    setFailed(true);
    setPlaybackFinished(true);
    hideNativeSplash();
  }, [player]);

  useEffect(() => {
    const ended = player.addListener("playToEnd", () => setPlaybackFinished(true));
    const status = player.addListener("statusChange", ({ status }) => {
      if (status === "error") failPlayback();
    });
    if (player.status === "error") failPlayback();
    else player.play();
    return () => {
      ended.remove();
      status.remove();
      // useVideoPlayer owns disposal and may already have released the native player.
    };
  }, [player, failPlayback]);

  // A failed or stalled decoder must not leave the app stuck on launch.
  useEffect(() => {
    if (playbackFinished) return;
    const timeout = setTimeout(failPlayback, 15000);
    return () => clearTimeout(timeout);
  }, [playbackFinished, failPlayback]);

  useEffect(() => {
    if (!ready || !playbackFinished) return;
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: 450,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true
    });
    exit.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => exit.stop();
  }, [ready, playbackFinished, opacity, onFinish]);

  return (
    <Animated.View
      style={[styles.splash, { opacity }]}
      accessibilityLabel="NELMA Drinking Water"
    >
      {!failed ? (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={false}
          surfaceType="textureView"
          onFirstFrameRender={() => {
            setFirstFrame(true);
            hideNativeSplash();
          }}
        />
      ) : null}
      {!firstFrame || failed ? (
        <Image
          source={poster}
          style={styles.media}
          resizeMode="cover"
          onLoad={hideNativeSplash}
          onError={hideNativeSplash}
        />
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  splash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#B9EAFA",
    overflow: "hidden",
    zIndex: 1000
  },
  media: { position: "absolute", width: "100%", height: "100%" }
});
