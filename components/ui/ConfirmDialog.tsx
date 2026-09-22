import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal, ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, shadows, spacing, typography } from "../../constants/theme";
import { Button } from "./Button";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDialog = ({ visible, title, message, confirmLabel, cancelLabel = "Cancel", destructive = false, loading = false, onCancel, onConfirm }: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.overlay, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl, paddingLeft: insets.left + spacing.xl, paddingRight: insets.right + spacing.xl }]} onPress={onCancel}>
        <Pressable style={styles.dialog}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{t(title)}</Text>
            <Text style={styles.message}>{t(message)}</Text>
            <View style={styles.row}>
              <Button title={cancelLabel} variant="ghost" onPress={onCancel} />
              <Button title={confirmLabel} variant={destructive ? "danger" : "primary"} onPress={onConfirm} loading={loading} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  dialog: {
    maxHeight: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
    ...shadows.card
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h2,
    lineHeight: typography.lineHeight.h2
  },
  message: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  }
});
