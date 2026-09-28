import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { radius, typography } from "../../constants/theme";
import { initialsFromName } from "../../utils/format";

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
};

export const Avatar = ({ name, uri, size = 56 }: AvatarProps) => {
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]} accessibilityLabel={name + " profile picture"} />;
  }

  return (
    <View style={[styles.avatar, styles.fallback, { height: size, width: size, borderRadius: size / 2 }]}> 
      <Text style={styles.initials}>{initialsFromName(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.accent
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  initials: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: "900"
  }
});
