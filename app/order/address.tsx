import { Redirect, router } from "expo-router";
import { ArrowRight, CalendarClock, Check, LocateFixed, MapPin, Save, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, CheckoutProgress, DeliveryAddressCard, Header, Input, PriceDisplay, Screen, ServiceAreaMap } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { haptics } from "../../services/haptics";
import { locationService } from "../../services/location";
import { useAuth } from "../../store/auth-context";
import { useOrders } from "../../store/order-context";
import type { DeliveryAddress, UpsertSavedAddressInput } from "../../types/address";
import type { DeliverySlotId } from "../../types/order";
import { emptyDeliveryAddress, hasCoordinates, normalizeDeliveryAddress, savedAddressToDeliveryAddress } from "../../utils/address";
import { buildDeliverySchedule, calculateDeliveryQuote, chargesForDeliveryQuote, deliverySlots, getDefaultDeliverySchedule, getDeliveryDateOptions } from "../../utils/delivery";
import { calculateOrderPricing } from "../../utils/order";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateDeliveryAddress, validateSavedAddress } from "../../utils/validation";

type AddressTextField = "deliveryAddress" | "area" | "phone" | "deliveryInstructions";

type PickedCoordinate = {
  latitude: number;
  longitude: number;
};

export default function DeliveryAddressScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    draft,
    clearDraft,
    savedAddresses,
    addressesLoading,
    pricingCatalog,
    loadSavedAddresses,
    setDeliveryAddress,
    setDeliverySchedule,
    setDeliveryCharges,
    setCustomerRemarks,
    createSavedAddress
  } = useOrders();
  const [form, setForm] = useState<DeliveryAddress>(draft.deliveryAddress ?? emptyDeliveryAddress(user?.phone ?? ""));
  const [errors, setErrors] = useState<FieldErrors<DeliveryAddress>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveForLater, setSaveForLater] = useState(false);
  const [addressLabel, setAddressLabel] = useState("My location");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(draft.deliverySchedule?.date ?? getDefaultDeliverySchedule().date);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlotId>(draft.deliverySchedule?.slot ?? "asap");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  const deliveryQuote = calculateDeliveryQuote(form);
  const charges = chargesForDeliveryQuote(deliveryQuote);
  const pricing = calculateOrderPricing(draft.orderType, draft.quantity, charges, pricingCatalog);
  const dateOptions = getDeliveryDateOptions();
  const deliverySchedule = buildDeliverySchedule(deliveryDate, deliverySlot);

  const setField = (key: AddressTextField) => (value: string) => {
    setSelectedAddressId(null);
    setErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectSavedAddress = (id: string) => {
    const saved = savedAddresses.find((address) => address.id === id);
    if (!saved) {
      return;
    }
    haptics.selection();
    setSelectedAddressId(id);
    setSaveForLater(false);
    setLabelError(null);
    setErrors({});
    setLocationMessage(hasCoordinates(saved) ? "Precise location attached" : null);
    setForm(savedAddressToDeliveryAddress(saved));
  };

  const dropManualPin = (coordinate: PickedCoordinate) => {
    haptics.selection();
    setSelectedAddressId(null);
    setForm((current) => ({
      ...current,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    }));
    setLocationMessage("Manual pin added. You can still edit the written address details.");
  };

  const useCurrentLocation = async () => {
    haptics.selection();
    setLocating(true);
    try {
      const result = await locationService.getCurrentCoordinates();
      if (result.status === "granted") {
        setSelectedAddressId(null);
        setForm((current) => ({
          ...current,
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
          ...(result.address ?? {})
        }));
        setLocationMessage(result.address ? "Current location and address details attached." : "Location attached. Add the written address if your device could not resolve it.");
        haptics.success();
      } else {
        setLocationMessage(result.message);
        haptics.light();
      }
    } finally {
      setLocating(false);
    }
  };

  const chooseDate = (date: string) => {
    haptics.selection();
    setDeliveryDate(date);
  };

  const chooseSlot = (slot: DeliverySlotId) => {
    haptics.selection();
    setDeliverySlot(slot);
  };

  const continueToPayment = async () => {
    const normalized = normalizeDeliveryAddress({ ...form, area: form.area || "Arusha" });
    const nextErrors = validateDeliveryAddress(normalized);
    setErrors(nextErrors);
    setLabelError(null);
    if (hasErrors(nextErrors)) {
      haptics.light();
      return;
    }

    if (saveForLater) {
      const savedInput: UpsertSavedAddressInput = {
        ...normalized,
        label: addressLabel
      };
      const savedErrors = validateSavedAddress(savedInput);
      if (savedErrors.label) {
        setLabelError(savedErrors.label);
        haptics.light();
        return;
      }
      setSaving(true);
      try {
        await createSavedAddress(savedInput);
      } finally {
        setSaving(false);
      }
    }

    setDeliveryAddress(normalized);
    setDeliverySchedule(deliverySchedule);
    setDeliveryCharges(charges);
    setCustomerRemarks(normalized.deliveryInstructions ?? "");

    haptics.selection();
    router.push("/order/payment");
  };

  return (
    <Screen padded={false} safeBottom={false} contentContainerStyle={styles.screen}>
      <View style={styles.body}>
        <CheckoutProgress current={3} />
        <Header title="Delivery address" subtitle="Choose where and when your water should arrive." />

        {savedAddresses.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("My addresses")}</Text>
              {addressesLoading ? <Text style={styles.helper}>{t("Loading...")}</Text> : null}
            </View>
            {savedAddresses.map((address) => (
              <DeliveryAddressCard key={address.id} address={address} selected={selectedAddressId === address.id} onPress={() => selectSavedAddress(address.id)} />
            ))}
          </View>
        ) : null}

        <View style={styles.formPanel}>
          <View style={styles.formTitleRow}>
            <View style={styles.formIcon}>
              <MapPin color={colors.primary} size={20} />
            </View>
            <View style={styles.formTitleCopy}>
              <Text style={styles.sectionTitle}>{t("Address details")}</Text>
              <Text style={styles.helper}>{t("Use an Arusha address; NM-AIST campus locations are prioritized.")}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setShowMap((current) => !current)} style={({ pressed }) => [styles.mapToggle, { opacity: pressed ? 0.75 : 1 }]}>
            <MapPin color={colors.primary} size={18} strokeWidth={2.3} />
            <Text style={styles.mapToggleText}>{t(showMap ? "Hide map" : hasCoordinates(form) ? "Adjust map pin" : "Add precise map pin")}</Text>
          </Pressable>
          {showMap ? <ServiceAreaMap
            latitude={form.latitude}
            longitude={form.longitude}
            pickable
            onPickCoordinate={dropManualPin}
            subtitle="Tap the map only when a precise pin is helpful."
            title="Delivery pin"
          /> : null}
          <Button title={hasCoordinates(form) ? "Update Current Location" : "Use My Current Location"} icon={LocateFixed} variant="secondary" onPress={useCurrentLocation} loading={locating} />
          {locationMessage ? <Text style={hasCoordinates(form) ? styles.successText : styles.helper}>{t(locationMessage)}</Text> : null}
          {hasCoordinates(form) ? <Text style={styles.locationChip}>{t("Pin attached")}</Text> : null}
          <Input label="Delivery location" value={form.deliveryAddress} onChangeText={setField("deliveryAddress")} error={errors.deliveryAddress} helper="Include campus, building, and room details." placeholder="NM-AIST, Hostel B, Room 204" />
          <Input label="Phone Number" value={form.phone || user?.phone || ""} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
          <Input label="Delivery Instructions" value={form.deliveryInstructions ?? ""} onChangeText={setField("deliveryInstructions")} helper="Optional: gate access or arrival notes." multiline style={styles.instructionsInput} />

          <View style={styles.feeCard}>
            <View style={styles.feeCopy}>
              <Text style={styles.feeTitle}>{t(deliveryQuote.zoneName)}</Text>
              <Text style={styles.helper}>{t(deliveryQuote.helper)}</Text>
            </View>
            <PriceDisplay amount={deliveryQuote.charge.amount} label="Delivery fee" align="right" />
          </View>

          <View style={styles.schedulePanel}>
            <View style={styles.formTitleRow}>
              <View style={styles.formIcon}>
                <CalendarClock color={colors.primary} size={20} />
              </View>
              <View style={styles.formTitleCopy}>
                <Text style={styles.sectionTitle}>{t("Delivery time")}</Text>
                <Text style={styles.helper}>{t("Pick the day and delivery window that works for you.")}</Text>
              </View>
            </View>
            <View style={styles.optionRow}>
              {dateOptions.map((option) => {
                const selected = deliveryDate === option.date;
                return (
                  <Pressable key={option.date} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => chooseDate(option.date)} style={({ pressed }) => [styles.optionPill, selected ? styles.optionSelected : null, { opacity: pressed ? 0.78 : 1 }]}>
                    <Text style={styles.optionTitle}>{t(option.label)}</Text>
                    <Text style={styles.optionSubtitle}>{option.helper}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.slotGrid}>
              {deliverySlots.map((slot) => {
                const selected = deliverySlot === slot.id;
                return (
                  <Pressable key={slot.id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => chooseSlot(slot.id)} style={({ pressed }) => [styles.slotCard, selected ? styles.optionSelected : null, { opacity: pressed ? 0.78 : 1 }]}>
                    <Text style={styles.optionTitle}>{t(slot.label)}</Text>
                    <Text style={styles.optionSubtitle}>{t(slot.window)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: saveForLater }} onPress={() => setSaveForLater((current) => !current)} style={({ pressed }) => [styles.checkboxRow, { opacity: pressed ? 0.72 : 1 }]}>
            <View style={[styles.checkbox, saveForLater ? styles.checkboxChecked : null]}>{saveForLater ? <Check color={colors.white} size={15} strokeWidth={3} /> : null}</View>
            <View style={styles.checkboxCopy}>
              <Text style={styles.checkboxText}>{t("Save this location")}</Text>
              <Text style={styles.helper}>{t("Use it faster next time.")}</Text>
            </View>
            <Save color={colors.mutedText} size={18} />
          </Pressable>
          {saveForLater ? <Input label="Location label" value={addressLabel} onChangeText={setAddressLabel} error={labelError ?? undefined} /> : null}
        </View>
      </View>

      <BottomActionBar
        buttonTitle="Continue"
        icon={ArrowRight}
        leading={<Button title="Cancel" variant="ghost" icon={X} onPress={() => { clearDraft(); router.replace("/(tabs)/home"); }} />}
        onPress={continueToPayment}
        loading={saving}
      >
        <PriceDisplay amount={pricing.total} label="Total" emphasize align="center" />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 0,
    justifyContent: "space-between"
  },
  body: {
    gap: spacing.lg,
    padding: spacing.xl
  },
  section: {
    gap: spacing.md
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  formPanel: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  formTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  formIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  formTitleCopy: {
    flex: 1,
    gap: 2
  },
  instructionsInput: {
    minHeight: 94,
    textAlignVertical: "top"
  },
  mapToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs
  },
  mapToggleText: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  successText: {
    color: colors.success,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  locationChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.pill,
    color: colors.success,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  feeCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  feeCopy: {
    flex: 1,
    gap: 2
  },
  feeTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  schedulePanel: {
    gap: spacing.md
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  optionPill: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 68,
    minWidth: 96,
    padding: spacing.sm
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  slotCard: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 70,
    padding: spacing.sm,
    width: "48%"
  },
  optionSelected: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.primary,
    borderWidth: 2
  },
  optionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    marginTop: 2
  },
  checkboxRow: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  checkbox: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxCopy: {
    flex: 1,
    gap: 2
  },
  checkboxText: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});
