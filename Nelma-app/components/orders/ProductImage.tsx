import { Droplets } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import type { BundledProductImage, ProductCatalogItem } from "../../constants/pricing";

const bundled: Record<BundledProductImage, number> = {
  new_bottle: require("../../assets/Bottle.jpeg"),
  refill: require("../../assets/refill.jpg")
};

type ProductImageProps = {
  product: Pick<ProductCatalogItem, "image" | "imageUrl" | "label">;
  style: StyleProp<ViewStyle>;
  resizeMode?: "contain" | "cover";
  iconSize?: number;
};

// The dashboard picture when there is one; if it fails to load, the picture shipped with the app,
// and a plain water mark for new products that have no picture yet.
export const ProductImage = ({ product, style, resizeMode = "contain", iconSize = 40 }: ProductImageProps) => {
  const [remoteFailed, setRemoteFailed] = useState(false);
  useEffect(() => setRemoteFailed(false), [product.imageUrl]);

  const source = product.imageUrl && !remoteFailed ? { uri: product.imageUrl } : product.image ? bundled[product.image] : null;
  if (!source) {
    return (
      <View accessibilityLabel={product.label} style={[style, styles.placeholder]}>
        <Droplets color={colors.primary} size={iconSize} strokeWidth={1.8} />
      </View>
    );
  }
  // The frame takes the caller's size and the picture is pinned to its edges. Percentage sizes on the
  // Image itself can collapse to zero on Android, which left the product cards blank on phones.
  return (
    <View accessibilityLabel={product.label} style={[style, styles.frame]}>
      <Image source={source} resizeMode={resizeMode} onError={() => setRemoteFailed(true)} style={styles.fill} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceBlue },
  frame: { overflow: "hidden" },
  fill: { bottom: 0, height: "100%", left: 0, position: "absolute", right: 0, top: 0, width: "100%" }
});
