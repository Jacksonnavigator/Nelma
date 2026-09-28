import { Droplets } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { colors } from "../../constants/colors";
import type { BundledProductImage, ProductCatalogItem } from "../../constants/pricing";

const bundled: Record<BundledProductImage, number> = {
  new_bottle: require("../../assets/Bottle.jpeg"),
  refill: require("../../assets/refill.jpg")
};

type ProductImageProps = {
  product: Pick<ProductCatalogItem, "image" | "imageUrl" | "label">;
  style: StyleProp<ImageStyle>;
};

// The dashboard picture when there is one; if it fails to load, the picture shipped with the app,
// and a plain water mark for new products that have no picture yet.
export const ProductImage = ({ product, style }: ProductImageProps) => {
  const [remoteFailed, setRemoteFailed] = useState(false);
  useEffect(() => setRemoteFailed(false), [product.imageUrl]);

  const source = product.imageUrl && !remoteFailed ? { uri: product.imageUrl } : product.image ? bundled[product.image] : null;
  if (!source) {
    return (
      <View accessibilityLabel={product.label} style={[style, styles.placeholder]}>
        <Droplets color={colors.primary} size={40} strokeWidth={1.8} />
      </View>
    );
  }
  return <Image accessibilityLabel={product.label} source={source} resizeMode="contain" onError={() => setRemoteFailed(true)} style={style} />;
};

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceBlue }
});
