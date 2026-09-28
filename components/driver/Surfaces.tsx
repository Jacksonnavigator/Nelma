import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
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

// Full-bleed dark header. Content sits on top; the ripples bleed off the right edge.
export const HeaderBand = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <LinearGradient colors={driverTheme.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.band, style]}>
    <Ripples size={340} style={styles.bandRipples} />
    {children}
  </LinearGradient>
);

// A soft water-line edge that lets a header melt into the page below it.
export const WaveEdge = ({ color = driverTheme.pageBg, height = 28 }: { color?: string; height?: number }) => (
  <Svg pointerEvents="none" width="100%" height={height} viewBox="0 0 390 28" preserveAspectRatio="none" style={styles.wave}>
    <Path d="M0 14 C 60 2, 110 2, 170 12 S 290 26, 390 8 L 390 28 L 0 28 Z" fill={color} opacity={0.45} />
    <Path d="M0 20 C 70 8, 140 10, 200 18 S 320 28, 390 16 L 390 28 L 0 28 Z" fill={color} />
  </Svg>
);

// Drawn street map for the stop header. It is decoration only, never a real map,
// so it always renders even without coordinates or a network.
export const MapArt = ({ height = 170 }: { height?: number }) => (
  <Svg pointerEvents="none" width="100%" height={height} viewBox="0 0 390 170" preserveAspectRatio="xMidYMid slice">
    <Rect x="0" y="0" width="390" height="170" fill="#DDEFFB" />
    <G fill="#EAF6FE">
      {[[-10, -6, 96, 58], [100, -6, 78, 58], [196, -6, 110, 44], [322, -6, 90, 70], [-10, 70, 70, 52], [76, 70, 118, 36], [210, 60, 96, 62], [322, 82, 90, 40], [-10, 136, 120, 50], [128, 120, 70, 60], [214, 136, 100, 40], [330, 136, 80, 50]].map(([x, y, w, h]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" />
      ))}
    </G>
    <Path d="M-10 64 H400 M-10 128 H400 M92 -10 V180 M204 -10 V180 M316 -10 V180" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
    <Path d="M64 110 C 84 72, 150 60, 214 64 S 272 86, 286 100" stroke={colors.primary} strokeWidth="4" strokeDasharray="1 9" strokeLinecap="round" fill="none" />
    <Circle cx="64" cy="110" r="7" fill="#FFFFFF" stroke={colors.primary} strokeWidth="3" />
    <Circle cx="286" cy="104" r="22" fill={colors.primary} opacity={0.12} />
    <Circle cx="286" cy="104" r="12" fill={colors.primary} opacity={0.18} />
    <Path d="M286 50 C 274 50 265 59 265 71 C 265 86 286 104 286 104 C 286 104 307 86 307 71 C 307 59 298 50 286 50 Z" fill={driverTheme.deep} />
    <Circle cx="286" cy="71" r="7.5" fill="#FFFFFF" />
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
export const LiveDot = ({ color }: { color?: string }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.dot, color ? { backgroundColor: color } : null, { opacity }]} />;
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
  band: { overflow: "hidden" },
  bandRipples: { position: "absolute", right: -120, top: -110 },
  wave: { position: "absolute", left: 0, right: 0, bottom: -1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: driverTheme.mintBright }
});
