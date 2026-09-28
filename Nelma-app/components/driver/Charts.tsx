import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useRef } from "react";
import { Animated, type DimensionValue, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { colors } from "../../constants/colors";
import { driverTheme } from "../../constants/driver-theme";
import { spacing, typography } from "../../constants/theme";

// Water-level progress: a rounded track that fills with the brand gradient.
export const WaterProgress = ({ value }: { value: number }) => {
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: Math.max(0, Math.min(1, value)), duration: 700, useNativeDriver: false }).start();
  }, [fill, value]);
  return (
    <View style={styles.track}>
      <Animated.View style={{ width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }), height: "100%" }}>
        <LinearGradient colors={driverTheme.fillGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill} />
      </Animated.View>
    </View>
  );
};

// Day progress for dark headers: a mint-to-sky arc around whatever is passed as children.
export const ProgressRing = ({ value, size = 104, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={driverTheme.mintBright} />
            <Stop offset="1" stopColor="#00B8F0" />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={driverTheme.glassLine} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * clamped} ${circumference}`}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
};

export type WeekDay = { key: string; label: string; count: number; today: boolean };

export const WeekBars = ({ days, tone = "light" }: { days: WeekDay[]; tone?: "light" | "dark" }) => {
  const peak = Math.max(1, ...days.map((day) => day.count));
  const dark = tone === "dark";
  return (
    <View style={styles.bars}>
      {days.map((day) => {
        const height: DimensionValue = day.count > 0 ? (`${Math.max(16, (day.count / peak) * 100)}%` as DimensionValue) : 6;
        const idle = dark ? "rgba(255,255,255,0.10)" : driverTheme.aqua;
        const filled = dark ? "rgba(255,255,255,0.34)" : driverTheme.aquaLine;
        return (
          <View key={day.key} style={styles.barColumn}>
            <Text style={[styles.barCount, dark ? styles.onDark : null]}>{day.count > 0 ? day.count : ""}</Text>
            <View style={styles.barWell}>
              {day.today && day.count > 0 ? (
                <LinearGradient colors={dark ? [driverTheme.mintBright, "#00B8F0"] : driverTheme.fillGradient} style={[styles.bar, { height }]} />
              ) : (
                <View style={[styles.bar, { height, backgroundColor: day.count > 0 ? filled : idle }]} />
              )}
            </View>
            <Text style={[styles.barLabel, dark ? styles.barLabelDark : null, day.today ? (dark ? styles.barLabelTodayDark : styles.barLabelToday) : null]}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, backgroundColor: driverTheme.aquaLine, overflow: "hidden" },
  fill: { flex: 1, borderRadius: 5 },
  ringSvg: { position: "absolute", top: 0, left: 0 },
  ringCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  barColumn: { flex: 1, alignItems: "center", gap: 4 },
  barCount: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 16, minHeight: 16, fontVariant: ["tabular-nums"] },
  onDark: { color: colors.white },
  barWell: { width: "100%", height: 48, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 8 },
  barLabel: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 16 },
  barLabelDark: { color: "rgba(255,255,255,0.55)" },
  barLabelToday: { color: colors.primary, fontFamily: typography.fonts.bold },
  barLabelTodayDark: { color: driverTheme.mintBright, fontFamily: typography.fonts.bold }
});
