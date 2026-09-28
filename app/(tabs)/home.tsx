import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  MapPin,
} from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppTopBar, ProductImage, Screen } from "../../components";
import { colors } from "../../constants/colors";
import { catalogItem, sortedProducts } from "../../constants/pricing";
import { typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { useOrders } from "../../store/order-context";
import type { Order, OrderType } from "../../types/order";
import { formatCurrency } from "../../utils/format";
import { orderStatusLabel } from "../../utils/status";

const jotformBlue = "#009FE3";

const heroImage =
  "https://images.unsplash.com/photo-1516116189403-10c54c714a28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNzg4OTl8MHwxfHNlYXJjaHw0fHxzcG9ydHMlMjBkcmlua3xlbnwwfHx8fDE3Njg4MjQ1NDR8MA&ixlib=rb-4.1.0&q=80&w=1080";

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { loadOrders, startOrder, reorder, orders, activeOrder, pricingCatalog } = useOrders();
  const { t } = useTranslation();
  const products = useMemo(() => sortedProducts(pricingCatalog), [pricingCatalog]);
  // Only offer "Order again" for something still on sale, so the tap never lands on a hidden product.
  const lastOrder = useMemo(
    () => orders.find((order) => order.id !== activeOrder?.id && order.status !== "cancelled" && Boolean(pricingCatalog[order.orderType])) ?? null,
    [orders, activeOrder, pricingCatalog]
  );
  const orderLine = (order: Order) => `${order.quantity} × ${t(catalogItem(pricingCatalog, order.orderType).label)}`;

  // Gentle pulse on the "out for delivery" indicator so it reads as a live status, not static text.
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const beginOrder = (orderType?: OrderType) => {
    haptics.selection();
    startOrder(orderType);
    if (orderType) {
      router.push("/order/quantity");
    }
  };

  const openOrder = (id: string) => {
    haptics.selection();
    router.push({ pathname: "/orders/[id]", params: { id } });
  };

  const orderAgain = (order: Order) => {
    haptics.selection();
    reorder(order);
    router.push("/order/quantity");
  };

  return (
    <Screen safeBottom={false} contentContainerStyle={styles.screen} keyboard={false} padded={false} scroll={false} style={styles.safe}>
      <View style={styles.appShell}>
        <AppTopBar />

        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>
          <ImageBackground resizeMode="cover" source={{ uri: heroImage }} style={styles.hero}>
            <LinearGradient
              colors={["rgba(15,23,42,0.15)", "rgba(15,23,42,0.55)"]}
              style={styles.heroShade}
            />
            <View style={styles.heroTopCut} />
            <View style={styles.heroCut} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{t("NELMA Water Delivery")}</Text>
              <Text style={styles.heroSubtitle}>{t("Fresh 20L drinking water delivered around the current service area.")}</Text>
            </View>
          </ImageBackground>

          <View style={styles.content}>
            <View style={styles.featureSection}>
              <LinearGradient colors={["#E8F4FF", "#F5FAFE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.introPanel}>
                <Text style={styles.introTitle}>{t("Fresh water.")}</Text>
                <Text style={styles.introTitle}>{t("Delivered to you.")}</Text>
                <Text style={styles.introSubtitle}>{t("Pure drinking water delivered across NM-AIST.")}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={!products.length}
                  onPress={() => beginOrder(products[0]?.type)}
                  style={({ pressed }) => [
                    styles.orderWaterButton,
                    { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                >
                  <Text style={styles.orderWaterButtonText}>{t("ORDER WATER")}</Text>
                  <ArrowRight color={colors.white} size={18} strokeWidth={2.6} />
                </Pressable>
              </LinearGradient>

              <View style={styles.sectionCard}>
                <SectionHeader title={t("What do you need?")} />
                <Text style={styles.sectionSubtitle}>{t("Pick an option below to get started")}</Text>
                <View style={styles.optionRow}>
                  {products.map((product) => (
                    <Pressable
                      key={product.type}
                      accessibilityRole="button"
                      accessibilityLabel={t(product.label)}
                      onPress={() => beginOrder(product.type)}
                      style={({ pressed }) => [
                        styles.optionCard,
                        styles.optionCardWide,
                        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                      ]}
                    >
                      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={styles.optionCardInner}>
                        <View style={styles.optionImageWrap}>
                          <ProductImage product={product} style={styles.productImage} />
                        </View>
                        <Text style={styles.optionLabel}>{t(product.label)}</Text>
                        {product.description ? <Text style={styles.optionDescription}>{t(product.description)}</Text> : null}
                        <Text style={styles.optionPrice}>{formatCurrency(product.unitPrice)}</Text>
                        <View style={styles.optionAction}>
                          <Text style={styles.optionActionText}>{t("ORDER")}</Text>
                          <ArrowRight color={colors.white} size={12} strokeWidth={3} />
                        </View>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </View>

              {activeOrder ? (
                <View style={[styles.sectionCard, styles.activeOrderCard]}>
                  <Text style={styles.plainSectionTitle}>{t("Active order")}</Text>
                  <Text style={styles.orderMeta}>{orderLine(activeOrder)}</Text>

                  <View style={styles.statusNoteRow}>
                    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                    <Text style={styles.statusNote}>{t(orderStatusLabel(activeOrder.status))}</Text>
                  </View>

                  <View style={styles.locationRow}>
                    <MapPin color="#475569" size={13} strokeWidth={2.2} />
                    <Text numberOfLines={1} style={styles.locationText}>{activeOrder.deliveryAddress.deliveryAddress}</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openOrder(activeOrder.id)}
                    style={({ pressed }) => [
                      styles.trackButton,
                      { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Text style={styles.trackButtonText}>{t("TRACK ORDER")}</Text>
                  </Pressable>
                </View>
              ) : null}

              {lastOrder ? (
                <View style={styles.sectionCard}>
                  <Text style={styles.plainSectionTitle}>{t("Order again")}</Text>
                  <Text style={styles.repeatTitle}>{orderLine(lastOrder)}</Text>
                  <Text style={styles.repeatPrice}>{formatCurrency(lastOrder.total, lastOrder.currency)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => orderAgain(lastOrder)}
                    style={({ pressed }) => [
                      styles.reorderButton,
                      { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Text style={styles.reorderButtonText}>{t("ORDER AGAIN")}</Text>
                  </Pressable>
                </View>
              ) : null}

              <LinearGradient colors={["#E0F2FE", "#F0F9FF"]} style={styles.helpCard}>
                <Text style={styles.helpText}>{t("Need help? Contact NELMA")}</Text>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
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
  appShell: {
    backgroundColor: colors.white,
    flex: 1
  },
  scroll: {
    backgroundColor: colors.white,
    flex: 1
  },
  scrollContent: {
    paddingBottom: 132
  },
  hero: {
    minHeight: 270,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
    marginBottom: 0,
    position: "relative"
  },
  heroShade: {
    ...StyleSheet.absoluteFill
  },
  heroTopCut: {
    position: "absolute",
    left: -30,
    right: -30,
    top: -125,
    height: 140,
    backgroundColor: colors.white,
    borderRadius: 220,
    zIndex: 2
  },
  heroCut: {
    position: "absolute",
    left: -30,
    right: -30,
    bottom: -125,
    height: 140,
    backgroundColor: colors.white,
    borderRadius: 220,
    zIndex: 2
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 10
  },
  heroTitle: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 26,
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "center"
  },
  heroSubtitle: {
    color: colors.white,
    fontFamily: typography.fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 4,
    maxWidth: 260,
    textAlign: "center"
  },
  content: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 0
  },
  featureSection: {
    gap: 4,
    paddingBottom: 8
  },
  // Floats up over the hero's rounded bottom edge for a layered, "card on top" feel.
  introPanel: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    marginTop: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  introTitle: {
    color: "#0F172A",
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    textAlign: "left",
    letterSpacing: -0.3
  },
  introSubtitle: {
    color: "#64748B",
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 8
  },
  orderWaterButton: {
    alignItems: "center",
    backgroundColor: jotformBlue,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    height: 44,
    justifyContent: "center",
    width: "100%",
    shadowColor: jotformBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  orderWaterButtonText: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.2
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: "#E0E7FF",
    borderRadius: 12,
    borderWidth: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1
  },
  // The one card that should visually outrank the others — it's the most actionable content on screen.
  activeOrderCard: {
    borderColor: jotformBlue,
    borderWidth: 1.5,
    shadowColor: jotformBlue,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0,159,227,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionTitle: {
    color: "#0F172A",
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.2
  },
  // Used by the two cards that kept their original plain-text (emoji) titles instead of the icon-badge header.
  plainSectionTitle: {
    color: "#0F172A",
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 9
  },
  sectionSubtitle: {
    color: "#64748B",
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    marginTop: -4,
    marginBottom: 8
  },
  optionRow: {
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    width: "100%"
  },
  optionCard: {
    borderColor: "#D0DCF0",
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: jotformBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3
  },
  optionCardWide: {
    minHeight: 250,
    width: "100%"
  },
  optionCardInner: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  optionImageWrap: {
    width: "100%",
    height: 185,
    position: "relative",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F6FB"
  },
  optionBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  productImage: {
    borderRadius: 12,
    height: "100%",
    resizeMode: "contain",
    width: "100%",
    backgroundColor: "#F0F6FB",
    borderWidth: 1,
    borderColor: "#E8F0FF"
  },
  optionLabel: {
    color: "#1E293B",
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: 4,
    textTransform: "uppercase"
  },
  optionDescription: {
    color: "#64748B",
    fontFamily: typography.fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    textAlign: "center"
  },
  optionPrice: {
    color: jotformBlue,
    fontFamily: typography.fonts.bold,
    fontSize: 17,
    lineHeight: 21,
    marginTop: 6,
    textAlign: "center",
    letterSpacing: -0.3,
    fontWeight: "700"
  },
  optionAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: jotformBlue,
    marginTop: "auto",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110
  },
  optionActionText: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
    letterSpacing: 0.4
  },
  orderMeta: {
    color: "#64748B",
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 8
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusBadgeText: {
    color: "#059669",
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    lineHeight: 13
  },
  statusNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EA580C"
  },
  statusNote: {
    color: "#EA580C",
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    lineHeight: 14
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10
  },
  locationText: {
    color: "#475569",
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    lineHeight: 14
  },
  trackButton: {
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2
  },
  trackButtonText: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2
  },
  repeatTitle: {
    color: "#0F172A",
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 4,
    letterSpacing: -0.2
  },
  repeatPrice: {
    color: jotformBlue,
    fontFamily: typography.fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    marginBottom: 10,
    letterSpacing: -0.3
  },
  reorderButton: {
    alignItems: "center",
    backgroundColor: jotformBlue,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: "100%",
    shadowColor: jotformBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  reorderButtonText: {
    color: colors.white,
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2
  },
  photoSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  photoSectionTitle: {
    color: "#0F172A",
    fontFamily: typography.fonts.bold,
    fontSize: 14,
    lineHeight: 17,
    marginBottom: 8,
    letterSpacing: -0.2
  },
  photoGrid: {
    flexDirection: "row",
    gap: 5
  },
  photoCard: {
    flex: 1,
    height: 125,
    overflow: "hidden",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  photoImage: {
    flex: 1,
    width: "100%",
    height: "100%"
  },
  helpCard: {
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  helpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  helpText: {
    color: "#0369A1",
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.1
  }
});
