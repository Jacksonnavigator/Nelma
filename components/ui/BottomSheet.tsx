import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal, ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";

type BottomSheetProps = React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>;

export const BottomSheet = ({ visible, title, onClose, children }: BottomSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t(title)}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "flex-end"
  },
  sheet: {
    maxHeight: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.lg,
    padding: spacing.xl
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    width: 48
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: "900"
  }
});
