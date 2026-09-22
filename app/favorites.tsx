import { Redirect, router } from "expo-router";
import { ArrowRight, Heart, Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, LoadingScreen, Screen } from "../components";
import { colors } from "../constants/colors";
import { products } from "../constants/products";
import { radius, spacing, typography } from "../constants/theme";
import { useTranslation } from "../hooks/use-translation";
import { useAuth } from "../store/auth-context";
import { useCart } from "../store/cart-context";
import { useFavorites } from "../store/favorites-context";
import { formatCurrency } from "../utils/format";

export default function FavoritesScreen() {
  const { status, user } = useAuth();
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  const favoriteProducts = useMemo(() => products.filter((product) => favorites.has(product.id)), [favorites]);

  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }
  if (user?.role === "DRIVER") {
    return <Redirect href="/driver/(tabs)/deliveries" />;
  }

  return (
    <Screen contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <AppTopBar />
      {favoriteProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("No favorites yet")}</Text>
          <Text style={styles.emptyText}>{t("Save a NELMA water option when you want quick access later.")}</Text>
          <Button title="Order NELMA Water" icon={ArrowRight} onPress={() => router.push("/(tabs)/home")} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={favoriteProducts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.headerTitle}>{t("Favorites")}</Text>
              <Text style={styles.headerSubtitle}>{t("NELMA water options you saved.")}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productItem}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/products/[id]", params: { id: item.id } })}
                style={({ pressed }) => [styles.productContent, { opacity: pressed ? 0.76 : 1 }]}
              >
                <Image resizeMode="cover" source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.productDetails}>
                  <Text numberOfLines={2} style={styles.productName}>{t(item.name)}</Text>
                  <Text style={styles.ratingText}>{t("Rated")} {item.rating} {t("by")} {item.reviewCount} {t("customers")}</Text>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                </View>
              </Pressable>
              <View style={styles.actions}>
                <Pressable accessibilityLabel={t("Remove favorite")} accessibilityRole="button" onPress={() => removeFromFavorites(item.id)} style={styles.iconButton}>
                  <Heart size={20} color={colors.danger} fill={colors.danger} />
                </Pressable>
                <Pressable accessibilityLabel={t("Add to cart")} accessibilityRole="button" onPress={() => addToCart(item.id, 1)} style={styles.addButton}>
                  <Plus size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.white },
  screen: { backgroundColor: colors.white, flex: 1 },
  emptyContainer: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  emptyIconWrap: { marginBottom: spacing.lg },
  emptyTitle: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 23, lineHeight: 30, textAlign: "center" },
  emptyText: { color: colors.black, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.xs, textAlign: "center" },
  list: { flex: 1 },
  listContent: { gap: spacing.md, padding: spacing.lg, paddingBottom: 132 },
  listHeader: { alignItems: "center", marginBottom: spacing.xs },
  headerTitle: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 23, lineHeight: 30 },
  headerSubtitle: { color: colors.black, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.xs, textAlign: "center" },
  productItem: { alignItems: "center", backgroundColor: colors.white, borderColor: "#D3DFE8", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.md },
  productContent: { flex: 1, flexDirection: "row", gap: spacing.md, minWidth: 0 },
  productImage: { backgroundColor: colors.surfaceBlue, borderRadius: 12, height: 86, width: 86 },
  productDetails: { flex: 1, gap: spacing.xs, justifyContent: "center", minWidth: 0 },
  productName: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  ratingText: { color: colors.black, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 17 },
  price: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  actions: { alignItems: "center", gap: spacing.sm },
  iconButton: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  addButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, height: 36, justifyContent: "center", width: 36 }
});
