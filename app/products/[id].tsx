import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, LoadingScreen, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { getProductById } from "../../constants/products";
import { radius, spacing, typography } from "../../constants/theme";
import { haptics } from "../../services/haptics";
import { useAuth } from "../../store/auth-context";
import { useFavorites } from "../../store/favorites-context";
import { useOrders } from "../../store/order-context";
import type { OrderType } from "../../types/order";
import type { Product } from "../../types/product";
import { formatCurrency } from "../../utils/format";

const orderTypeForProduct = (productId: string): OrderType => productId === "nelma-refill" ? "refill" : "first_purchase";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const { startOrder } = useOrders();

  useEffect(() => {
    if (id) {
      setProduct(getProductById(id) ?? null);
    }
  }, [id]);

  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (user?.role === "DRIVER") {
    return <Redirect href="/driver/(tabs)/deliveries" />;
  }

  if (!product) {
    return (
      <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
        <AppTopBar />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Product not found</Text>
          <Button title="Back Home" variant="ghost" onPress={() => router.replace("/(tabs)/home")} />
        </View>
      </Screen>
    );
  }

  const orderType = orderTypeForProduct(product.id);

  const toggleFavorite = () => {
    haptics.selection();
    if (isFavorite(product.id)) {
      removeFromFavorites(product.id);
      return;
    }
    addToFavorites(product.id);
  };

  const beginOrder = () => {
    haptics.selection();
    startOrder(orderType);
    router.push("/order/quantity");
  };

  return (
    <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      <View style={styles.localHeader}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.headerIconButton}>
          <ArrowLeft size={22} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Product</Text>
        <Pressable accessibilityLabel="Favorite product" accessibilityRole="button" onPress={toggleFavorite} style={styles.headerIconButton}>
          <Heart size={21} color={colors.danger} fill={isFavorite(product.id) ? colors.danger : "transparent"} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image resizeMode="cover" source={{ uri: product.image }} style={styles.productImage} />

        <View style={styles.details}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>Pure drinking water · 20L delivery</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Order This Product" onPress={beginOrder} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.white
  },
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  localHeader: {
    alignItems: "center",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  headerIconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42
  },
  headerTitle: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 17,
    lineHeight: 23
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 132
  },
  productImage: {
    backgroundColor: colors.surfaceBlue,
    borderRadius: 14,
    height: 286,
    width: "100%"
  },
  details: {
    gap: spacing.md,
    paddingTop: spacing.lg
  },
  productName: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 31
  },
  price: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    lineHeight: 31
  },
  description: {
    color: colors.black,
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    lineHeight: 23
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  badgeText: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    lineHeight: 17
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    padding: spacing.lg
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  emptyTitle: {
    color: colors.black,
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    lineHeight: 29,
    marginBottom: spacing.md
  }
});
