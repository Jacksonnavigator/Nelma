import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../../constants/colors";
import { driverTheme, sheetShadow } from "../../constants/driver-theme";
import { radius } from "../../constants/theme";

// Soft sky glow behind the top of a screen, echoing the splash artwork.
export const SkyBackdrop = () => (
  <LinearGradient pointerEvents="none" colors={[driverTheme.skyTop, driverTheme.pageBg]} style={styles.sky} />
);

export const Sheet = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.sheet, sheetShadow, style]}>{children}</View>
);

export const BrandGradient = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <LinearGradient colors={driverTheme.brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.brand, style]}>
    {children}
  </LinearGradient>
);

export const Ripples = ({ size = 240, style }: { size?: number; style?: ViewStyle }) => (
  <Svg pointerEvents="none" width={size} height={size} viewBox="0 0 240 240" style={style}>
    {[36, 62, 88, 114].map((r, index) => (
      <Circle key={r} cx="120" cy="120" r={r} fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeOpacity={0.24 - index * 0.045} />
    ))}
  </Svg>
);

// Quiet empty-state artwork: a drop above its own ripples.
export const DropletArt = ({ size = 132 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 132 132">
    {[44, 32, 20].map((r, index) => (
      <Circle key={r} cx="66" cy="84" r={r} fill="none" stroke={colors.primary} strokeOpacity={0.14 + index * 0.1} strokeWidth={2} />
    ))}
    <Path d="M66 14 C66 14 40 44 40 62 C40 76.4 51.6 88 66 88 C80.4 88 92 76.4 92 62 C92 44 66 14 66 14 Z" fill={colors.primary} />
    <Path d="M55 62 C55 70 60 76 67 77" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3.5} strokeLinecap="round" fill="none" />
  </Svg>
);

// Pulsing dot for "on the way" so live work reads as live.
export const LiveDot = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.dot, { opacity }]} />;
};

type PressableScaleProps = Omit<PressableProps, "style"> & { style?: ViewStyle; children: ReactNode };

export const PressableScale = ({ children, style, onPressIn, onPressOut, ...rest }: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Pressable onPressIn={(event) => { animate(0.975); onPressIn?.(event); }} onPressOut={(event) => { animate(1); onPressOut?.(event); }} {...rest}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sky: { position: "absolute", top: 0, left: 0, right: 0, height: 280 },
  sheet: { backgroundColor: colors.white, borderRadius: radius.xl + 6, overflow: "hidden" },
  brand: { borderRadius: radius.xl + 10, overflow: "hidden" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7CF2C8" }
});
