import { CheckCircle2, Navigation, Pencil, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import type { SavedAddress } from "../../types/address";
import { hasCoordinates } from "../../utils/address";
import { IconButton } from "../ui/IconButton";

type DeliveryAddressCardProps = {
  address: SavedAddress;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const DeliveryAddressCard = ({ address, selected = false, onPress, onEdit, onDelete }: DeliveryAddressCardProps) => {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected ? styles.selected : null, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.label}>{t(address.label)}</Text>
          {selected ? <CheckCircle2 color={colors.green} size={20} /> : null}
        </View>
        <Text style={styles.address} numberOfLines={2}>{address.deliveryAddress}</Text>
        <Text style={styles.area}>{address.area}</Text>
        {hasCoordinates(address) ? (
          <View style={styles.locationRow}>
            <Navigation color={colors.success} size={13} strokeWidth={2.4} />
            <Text style={styles.locationText}>{t("Precise location attached")}</Text>
          </View>
        ) : null}
      </View>
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? <IconButton icon={Pencil} label="Edit address" onPress={onEdit} /> : null}
          {onDelete ? <IconButton icon={Trash2} label="Delete address" color={colors.danger} backgroundColor={colors.dangerBg} onPress={onDelete} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  selected: {
    backgroundColor: "#FBFEFF",
    borderBottomColor: colors.primary,
    borderBottomWidth: 2
  },
  copy: {
    flex: 1,
    gap: spacing.xxs
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  area: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.small
  },
  meta: {
    color: colors.text,
    fontFamily: typography.fonts.medium,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  address: {
    color: colors.text,
    fontFamily: typography.fonts.medium,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
    paddingTop: spacing.xxs
  },
  locationText: {
    color: colors.success,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  },
  actions: {
    gap: spacing.xs
  }
});
