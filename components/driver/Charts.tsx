import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, type DimensionValue, StyleSheet, Text, View } from "react-native";
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

export type WeekDay = { key: string; label: string; count: number; today: boolean };

export const WeekBars = ({ days }: { days: WeekDay[] }) => {
  const peak = Math.max(1, ...days.map((day) => day.count));
  return (
    <View style={styles.bars}>
      {days.map((day) => {
        const height: DimensionValue = day.count > 0 ? (`${Math.max(16, (day.count / peak) * 100)}%` as DimensionValue) : 6;
        return (
          <View key={day.key} style={styles.barColumn}>
            <Text style={styles.barCount}>{day.count > 0 ? day.count : ""}</Text>
            <View style={styles.barWell}>
              {day.today && day.count > 0 ? (
                <LinearGradient colors={driverTheme.fillGradient} style={[styles.bar, { height }]} />
              ) : (
                <View style={[styles.bar, { height, backgroundColor: day.count > 0 ? driverTheme.aquaLine : driverTheme.aqua }]} />
              )}
            </View>
            <Text style={[styles.barLabel, day.today ? styles.barLabelToday : null]}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, backgroundColor: driverTheme.aquaLine, overflow: "hidden" },
  fill: { flex: 1, borderRadius: 5 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  barColumn: { flex: 1, alignItems: "center", gap: 6 },
  barCount: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: 12, lineHeight: 16, minHeight: 16, fontVariant: ["tabular-nums"] },
  barWell: { width: "100%", height: 64, justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 8 },
  barLabel: { color: colors.subtleText, fontFamily: typography.fonts.medium, fontSize: 11, lineHeight: 16 },
  barLabelToday: { color: colors.primary, fontFamily: typography.fonts.bold }
});
