import { Redirect, router } from "expo-router";
import { ArrowRight, Check, LocateFixed, MapPin, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomActionBar, Button, CheckoutProgress, Header, Input, PriceDisplay, Screen, ServiceAreaMap } from "../../components";
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
import { buildDeliverySchedule, calculateDeliveryQuote, chargesForDeliveryQuote, deliverySlotsFor, getDefaultDeliverySchedule, getDeliveryDateOptions } from "../../utils/delivery";
import { formatCurrency } from "../../utils/format";
import { calculateOrderPricing } from "../../utils/order";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateDeliveryAddress, validateSavedAddress } from "../../utils/validation";

type AddressTextField = "deliveryAddress" | "area" | "phone" | "deliveryInstructions";

type PickedCoordinate = {
  latitude: number;
  longitude: number;
};

// A saved address needs a name; take it from the address itself so the customer is not asked for one.
const labelFor = (address: DeliveryAddress): string => {
  const first = address.deliveryAddress.split(",").map((part) => part.trim()).find((part) => part.length >= 2);
  return (first ?? "My location").slice(0, 40);
};

export default function DeliveryAddressScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    draft,
    clearDraft,
    savedAddresses,
    pricingCatalog,
    deliveryConfig,
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
  const [addingNew, setAddingNew] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(draft.deliverySchedule?.date ?? getDefaultDeliverySchedule().date);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlotId>(draft.deliverySchedule?.slot ?? "asap");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [noteOpen, setNoteOpen] = useState(Boolean(draft.deliveryAddress?.deliveryInstructions));

  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  const showSaved = savedAddresses.length > 0 && !addingNew;

  // Pick a saved address up front, so a returning customer only has to tap Continue:
  // the one this order already uses, otherwise the first. An unsaved address already on
  // the order opens the form with it filled in instead.
  useEffect(() => {
    if (!showSaved || selectedAddressId) return;
    const current = draft.deliveryAddress;
    const match = current ? savedAddresses.find((address) => address.deliveryAddress.trim() === current.deliveryAddress.trim()) : undefined;
    if (current?.deliveryAddress.trim() && !match) {
      setAddingNew(true);
      return;
    }
    const pick = match ?? savedAddresses[0];
    setSelectedAddressId(pick.id);
    setForm(current && match ? { ...savedAddressToDeliveryAddress(match), deliveryInstructions: current.deliveryInstructions ?? match.deliveryInstructions } : savedAddressToDeliveryAddress(pick));
  }, [showSaved, selectedAddressId, savedAddresses, draft.deliveryAddress]);

  if (!draft.orderType) {
    return <Redirect href="/(tabs)/home" />;
  }

  const deliverySlots = deliverySlotsFor(deliveryConfig);
  // A time picked before staff changed the windows falls back to the soonest delivery.
  const activeSlot = deliverySlots.some((slot) => slot.id === deliverySlot) ? deliverySlot : "asap";
  const deliveryQuote = calculateDeliveryQuote(form, deliveryConfig);
  const charges = chargesForDeliveryQuote(deliveryQuote);
  const pricing = calculateOrderPricing(draft.orderType, draft.quantity, charges, pricingCatalog);
  const dateOptions = getDeliveryDateOptions();
  const deliverySchedule = buildDeliverySchedule(deliveryDate, activeSlot, deliveryConfig);
  const phone = form.phone || user?.phone || "";
  const phoneOpen = editingPhone || !phone || Boolean(errors.phone);
  const pinned = hasCoordinates(form);

  const setField = (key: AddressTextField) => (value: string) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectSavedAddress = (id: string) => {
    const saved = savedAddresses.find((address) => address.id === id);
    if (!saved) return;
    haptics.selection();
    setSelectedAddressId(id);
    setErrors({});
    setForm(savedAddressToDeliveryAddress(saved));
  };

  const startNewAddress = () => {
    haptics.selection();
    setAddingNew(true);
    setSelectedAddressId(null);
    setErrors({});
    setLocationMessage(null);
    setNoteOpen(false);
    setForm(emptyDeliveryAddress(user?.phone ?? ""));
  };

  const backToSaved = () => {
    haptics.selection();
    setAddingNew(false);
    setSelectedAddressId(null);
    setSaveForLater(false);
    setErrors({});
  };

  const dropManualPin = (coordinate: PickedCoordinate) => {
    haptics.selection();
    setForm((current) => ({ ...current, latitude: coordinate.latitude, longitude: coordinate.longitude }));
    setLocationMessage(null);
  };

  const useCurrentLocation = async () => {
    haptics.selection();
    setLocating(true);
    try {
      const result = await locationService.getCurrentCoordinates();
      if (result.status === "granted") {
        setForm((current) => ({
          ...current,
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
          ...(result.address ?? {})
        }));
        setErrors((current) => ({ ...current, deliveryAddress: undefined }));
        setLocationMessage(result.address ? null : "Location found. Add the building or room below.");
        haptics.success();
      } else {
        setLocationMessage(result.message);
        haptics.light();
      }
    } finally {
      setLocating(false);
    }
  };

  const continueToPayment = async () => {
    const normalized = normalizeDeliveryAddress({ ...form, phone, area: form.area || "Arusha" });
    const nextErrors = validateDeliveryAddress(normalized);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      if (showSaved) setAddingNew(true); // Only happens if a saved address is incomplete; show the form so it can be fixed.
      haptics.light();
      return;
    }

    if (saveForLater && !showSaved) {
      const savedInput: UpsertSavedAddressInput = { ...normalized, label: labelFor(normalized) };
      if (!hasErrors(validateSavedAddress(savedInput))) {
        setSaving(true);
        try {
          await createSavedAddress(savedInput);
        } catch {
          // Saving for next time is a convenience; never block the order on it.
        } finally {
          setSaving(false);
        }
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
        <Header title="Where should we deliver?" />

        {showSaved ? (
          <View style={styles.list}>
            {savedAddresses.map((address, index) => {
              const selected = selectedAddressId === address.id;
              return (
                <Pressable
                  key={address.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => selectSavedAddress(address.id)}
                  style={({ pressed }) => [styles.option, index > 0 ? styles.optionDivider : null, selected ? styles.optionSelected : null, pressed ? styles.pressed : null]}
                >
                  <View style={[styles.radio, selected ? styles.radioOn : null]}>{selected ? <Check color={colors.white} size={13} strokeWidth={3} /> : null}</View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{t(address.label)}</Text>
                    <Text numberOfLines={1} style={styles.optionAddress}>{address.deliveryAddress}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={startNewAddress} style={({ pressed }) => [styles.option, styles.optionDivider, pressed ? styles.pressed : null]}>
              <View style={styles.plus}><Plus color={colors.primary} size={15} strokeWidth={2.6} /></View>
              <Text style={styles.linkText}>{t("Use a different address")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.group}>
            <Button title={pinned ? "Location added" : "Use my current location"} icon={pinned ? Check : LocateFixed} variant="secondary" onPress={useCurrentLocation} loading={locating} />
            {locationMessage ? <Text style={styles.helper}>{t(locationMessage)}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => setShowMap((current) => !current)} style={styles.inlineLink}>
              <MapPin color={colors.primary} size={15} />
              <Text style={styles.linkSmall}>{t(showMap ? "Hide map" : pinned ? "Adjust pin on map" : "Or pick on the map")}</Text>
            </Pressable>
            {showMap ? (
              <ServiceAreaMap latitude={form.latitude} longitude={form.longitude} pickable onPickCoordinate={dropManualPin} title="Delivery pin" subtitle="Tap where the water should go." />
            ) : null}

            <Input label="Address" value={form.deliveryAddress} onChangeText={setField("deliveryAddress")} error={errors.deliveryAddress} placeholder="NM-AIST, Hostel B, Room 204" />

            {phoneOpen ? (
              <Input label="Phone number" value={phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
            ) : (
              <View style={styles.phoneRow}>
                <Text style={styles.helper}>{t("Driver will call")} <Text style={styles.phone}>{phone}</Text></Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setEditingPhone(true)}>
                  <Text style={styles.linkSmall}>{t("Change")}</Text>
                </Pressable>
              </View>
            )}

            {noteOpen ? (
              <Input label="Note for the driver" value={form.deliveryInstructions ?? ""} onChangeText={setField("deliveryInstructions")} placeholder="Gate code, landmark, call on arrival" multiline style={styles.noteInput} />
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setNoteOpen(true)} style={styles.inlineLink}>
                <Plus color={colors.primary} size={15} strokeWidth={2.6} />
                <Text style={styles.linkSmall}>{t("Add a note for the driver")}</Text>
              </Pressable>
            )}

            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: saveForLater }} onPress={() => setSaveForLater((current) => !current)} style={styles.inlineLink}>
              <View style={[styles.box, saveForLater ? styles.boxOn : null]}>{saveForLater ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}</View>
              <Text style={styles.checkText}>{t("Save this address for next time")}</Text>
            </Pressable>

            {savedAddresses.length ? (
              <Pressable accessibilityRole="button" onPress={backToSaved} style={styles.inlineLink}>
                <Text style={styles.linkSmall}>{t("Back to my saved addresses")}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.group}>
          <Text style={styles.sectionTitle}>{t("When?")}</Text>
          <View style={styles.chips}>
            {dateOptions.map((option) => {
              const selected = deliveryDate === option.date;
              return (
                <Pressable key={option.date} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { haptics.selection(); setDeliveryDate(option.date); }} style={[styles.chip, selected ? styles.chipOn : null]}>
                  <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{t(option.label === "Next day" ? option.helper : option.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chips}>
            {deliverySlots.map((slot) => {
              const selected = activeSlot === slot.id;
              return (
                <Pressable key={slot.id} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={t(slot.label)} onPress={() => { haptics.selection(); setDeliverySlot(slot.id); }} style={[styles.chip, styles.timeChip, selected ? styles.chipOn : null]}>
                  <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>{t(slot.chip)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helper}>{t(deliverySchedule.label)} · {t(deliverySchedule.window)}</Text>
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
        <Text style={styles.fee}>
          {deliveryQuote.charge.amount > 0 ? t("Includes delivery") + " " + formatCurrency(deliveryQuote.charge.amount) : t("Free delivery")}
        </Text>
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 0, justifyContent: "space-between" },
  body: { gap: spacing.xl, padding: spacing.xl },
  group: { gap: spacing.md },
  list: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, backgroundColor: colors.white, overflow: "hidden" },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  optionSelected: { backgroundColor: colors.surfaceBlue },
  pressed: { opacity: 0.8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionCopy: { flex: 1, gap: 1 },
  optionLabel: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  optionAddress: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  plus: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceBlue },
  linkText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: typography.body, lineHeight: typography.lineHeight.body },
  inlineLink: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs, minHeight: 32 },
  linkSmall: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  helper: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  phoneRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  phone: { color: colors.text, fontFamily: typography.fonts.semibold },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  boxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkText: { color: colors.text, fontFamily: typography.fonts.medium, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  sectionTitle: { color: colors.text, fontFamily: typography.fonts.bold, fontSize: typography.h3, lineHeight: typography.lineHeight.h3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  // Up to three times per row so windows such as "09:00 - 12:00" never squeeze.
  timeChip: { flexBasis: "30%", flexGrow: 1 },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.text, fontFamily: typography.fonts.semibold, fontSize: typography.small, lineHeight: typography.lineHeight.small },
  chipTextOn: { color: colors.white },
  fee: { color: colors.mutedText, fontFamily: typography.fonts.medium, fontSize: typography.tiny, lineHeight: typography.lineHeight.tiny, textAlign: "center" }
});
