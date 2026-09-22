import { Redirect, router } from "expo-router";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppTopBar, Button, LoadingScreen, Screen } from "../components";
import { colors } from "../constants/colors";
import { getProductById } from "../constants/products";
import { radius, spacing, typography } from "../constants/theme";
import { useTranslation } from "../hooks/use-translation";
import { useAuth } from "../store/auth-context";
import { useCart } from "../store/cart-context";
import { formatCurrency } from "../utils/format";

export default function CartScreen() {
  const { status, user } = useAuth();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { t } = useTranslation();

  const cartItems = useMemo(() => {
    return cart.items
      .map((item) => ({
        ...item,
        product: getProductById(item.productId)
      }))
      .filter((item) => item.product);
  }, [cart.items]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  }, [cartItems]);

  const startOrder = () => router.push("/(tabs)/home");

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

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("No water selected")}</Text>
          <Text style={styles.emptyText}>{t("Start a first purchase or refill order for the Arusha service area.")}</Text>
          <Button title="Order NELMA Water" icon={ArrowRight} onPress={startOrder} />
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={styles.itemsList}
            data={cartItems}
            keyExtractor={(item) => item.productId}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.headerTitle}>{t("Cart")}</Text>
                <Text style={styles.headerSubtitle}>{t("NELMA products selected for checkout.")}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const product = item.product;
              if (!product) return null;

              return (
                <View style={styles.cartItem}>
                  <Image resizeMode="cover" source={{ uri: product.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text numberOfLines={2} style={styles.itemName}>{t(product.name)}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(product.price)}</Text>
                    <View style={styles.quantityRow}>
                      <Pressable accessibilityRole="button" onPress={() => updateQuantity(item.productId, item.quantity - 1)} style={styles.quantityButton}>
                        <Minus size={16} color={colors.primary} />
                      </Pressable>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <Pressable accessibilityRole="button" onPress={() => updateQuantity(item.productId, item.quantity + 1)} style={styles.quantityButton}>
                        <Plus size={16} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                  <Pressable accessibilityLabel={t("Remove item")} accessibilityRole="button" onPress={() => removeFromCart(item.productId)} style={styles.removeButton}>
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{t("Subtotal")}</Text>
                <Text style={styles.totalHint}>{t("Delivery address is confirmed in checkout.")}</Text>
              </View>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <Button title="Continue Order" onPress={startOrder} />
          </View>
        </>
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
  itemsList: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  listHeader: { alignItems: "center", marginBottom: spacing.xs },
  headerTitle: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 23, lineHeight: 30 },
  headerSubtitle: { color: colors.black, fontFamily: typography.fonts.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.xs, textAlign: "center" },
  cartItem: { alignItems: "center", backgroundColor: colors.white, borderColor: "#D3DFE8", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.md },
  itemImage: { backgroundColor: colors.surfaceBlue, borderRadius: 12, height: 82, width: 82 },
  itemDetails: { flex: 1, gap: spacing.xs, minWidth: 0 },
  itemName: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 15, lineHeight: 21 },
  itemPrice: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  quantityRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  quantityButton: { alignItems: "center", backgroundColor: colors.surfaceBlue, borderRadius: radius.pill, height: 30, justifyContent: "center", width: 30 },
  quantityValue: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 14, lineHeight: 19, minWidth: 28, textAlign: "center" },
  removeButton: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  footer: { backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, padding: spacing.lg },
  totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: colors.black, fontFamily: typography.fonts.bold, fontSize: 16, lineHeight: 22 },
  totalHint: { color: colors.black, fontFamily: typography.fonts.regular, fontSize: 12, lineHeight: 17, marginTop: 2 },
  totalValue: { color: colors.primary, fontFamily: typography.fonts.bold, fontSize: 21, lineHeight: 28 }
});
