import { Image, StyleSheet, View } from "react-native";

const logo = require("../../assets/logo.png");

type BrandMarkProps = {
  compact?: boolean;
  light?: boolean;
  size?: "small" | "default";
};

export const BrandMark = ({ compact = false, light = false, size = "default" }: BrandMarkProps) => {
  const isSmall = size === "small" || compact;

  return (
    <View accessibilityLabel="NELMA Drinking Water">
      <Image source={logo} resizeMode="contain" style={isSmall ? styles.logoSmall : styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  logo: { height: 72, width: 126 },
  logoSmall: { height: 42, width: 74 }
});