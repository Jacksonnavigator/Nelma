import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { OrderFilter } from "../../types/order";

const options: Array<{ value: OrderFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

type ListFilterTabsProps = {
  value: OrderFilter;
  onChange: (value: OrderFilter) => void;
};

export const ListFilterTabs = ({ value, onChange }: ListFilterTabsProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={[styles.tab, selected ? styles.selected : null]}>
            <Text style={[styles.label, selected ? styles.selectedLabel : null]}>{t(option.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.md,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  selected: {
    backgroundColor: colors.white
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontWeight: "800"
  },
  selectedLabel: {
    color: colors.primary
  }
});
