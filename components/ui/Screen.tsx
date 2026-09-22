import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { layout, spacing } from "../../constants/theme";
import { OfflineBanner } from "./OfflineBanner";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  keyboard?: boolean;
  safeBottom?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export const Screen = ({ children, scroll = true, padded = true, keyboard = true, safeBottom = true, style, contentContainerStyle }: ScreenProps) => {
  const bodyStyle = [styles.content, padded && styles.padded, contentContainerStyle];
  const content = scroll ? (
    <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustsScrollIndicatorInsets={false} contentContainerStyle={bodyStyle} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={bodyStyle}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={safeBottom ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}>
      <OfflineBanner />
      {keyboard ? <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>{content}</KeyboardAvoidingView> : content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  flex: {
    flex: 1
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: layout.maxPhoneWidth,
    width: "100%"
  },
  padded: {
    gap: spacing.lg,
    padding: layout.screenPadding,
    paddingBottom: spacing.xxl
  }
});
