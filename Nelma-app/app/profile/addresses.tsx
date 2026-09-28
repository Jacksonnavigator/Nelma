import { LocateFixed, Plus, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, ConfirmDialog, DeliveryAddressCard, EmptyState, Header, Input, Screen, ServiceAreaMap } from "../../components";
import { colors } from "../../constants/colors";
import { spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { locationService } from "../../services/location";
import { useAuth } from "../../store/auth-context";
import { useOrders } from "../../store/order-context";
import type { SavedAddress, UpsertSavedAddressInput } from "../../types/address";
import { emptyDeliveryAddress, hasCoordinates } from "../../utils/address";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateSavedAddress } from "../../utils/validation";

const formForPhone = (phone: string): UpsertSavedAddressInput => ({
  ...emptyDeliveryAddress(phone),
  label: "My location"
});

const formFromAddress = (address: SavedAddress): UpsertSavedAddressInput => ({
  label: address.label,
  deliveryAddress: address.deliveryAddress,
  area: address.area,
  phone: address.phone,
  deliveryInstructions: address.deliveryInstructions,
  latitude: address.latitude ?? null,
  longitude: address.longitude ?? null
});

type SavedAddressTextField = "label" | "deliveryAddress" | "area" | "phone" | "deliveryInstructions";

type PickedCoordinate = {
  latitude: number;
  longitude: number;
};

export default function AddressesScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { savedAddresses, addressesLoading, loadSavedAddresses, createSavedAddress, updateSavedAddress, deleteSavedAddress } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertSavedAddressInput>(formForPhone(user?.phone ?? ""));
  const [errors, setErrors] = useState<FieldErrors<UpsertSavedAddressInput>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  const resetForm = () => {
    setEditingAddressId(null);
    setForm(formForPhone(user?.phone ?? ""));
    setErrors({});
  };

  const setField = (key: SavedAddressTextField) => (value: string) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const editAddress = (address: SavedAddress) => {
    setEditingAddressId(address.id);
    setForm(formFromAddress(address));
    setErrors({});
    setMessage(null);
    setShowForm(true);
  };

  const dropManualPin = (coordinate: PickedCoordinate) => {
    setForm((current) => ({
      ...current,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    }));
    setMessage("Manual pin added. You can still edit the written address details.");
  };

  const useCurrentLocation = async () => {
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
        setMessage(result.address ? "Current location and address details attached." : "Location attached. Add the written address if your device could not resolve it.");
      } else {
        setMessage(result.message);
      }
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const nextErrors = validateSavedAddress(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    try {
      if (editingAddressId) {
        await updateSavedAddress(editingAddressId, form);
        setMessage("Location updated.");
      } else {
        await createSavedAddress(form);
        setMessage("Location saved.");
      }
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Delivery locations" subtitle="Save the places where NELMA should bring your order." />
      {savedAddresses.length ? (
        <View style={styles.savedSection}>
          <View style={styles.savedHeader}>
            <Text style={styles.savedTitle}>{t("Saved locations")}</Text>
            <Text style={styles.savedCount}>{savedAddresses.length}</Text>
          </View>
          {savedAddresses.map((address) => (
            <DeliveryAddressCard
              key={address.id}
              address={address}
              onEdit={() => editAddress(address)}
              onDelete={() => setAddressToDelete(address.id)}
            />
          ))}
        </View>
      ) : <EmptyState title="No saved locations" message="Add your first delivery location to make checkout faster." />}
      {addressesLoading ? <Text style={styles.helper}>{t("Loading saved locations...")}</Text> : null}
      {message && !showForm ? <Text style={styles.successText}>{t(message)}</Text> : null}

      {!showForm ? <Button title="Add Location" icon={Plus} onPress={() => { resetForm(); setShowForm(true); }} /> : null}

      {showForm ? (
        <Card style={styles.form}>
          <View style={styles.formHeader}>
            <View style={styles.formTitleRow}>
              <Text style={styles.formEyebrow}>{t(editingAddressId ? "EDIT LOCATION" : "NEW LOCATION")}</Text>
              <Text style={styles.sectionTitle}>{t(editingAddressId ? "Edit delivery location" : "Add delivery location")}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => { setShowForm(false); resetForm(); }}><Text style={styles.cancelText}>{t("Cancel")}</Text></Pressable>
          </View>
          <ServiceAreaMap
            latitude={form.latitude}
            longitude={form.longitude}
            pickable
            onPickCoordinate={dropManualPin}
            subtitle="Use current location or tap the map to drop a manual pin around Arusha and NM-AIST."
            title="Delivery location pin"
          />
          <Button title={hasCoordinates(form) ? "Update Current Location" : "Use My Current Location"} icon={LocateFixed} variant="secondary" onPress={useCurrentLocation} loading={locating} />
          {message ? <Text style={hasCoordinates(form) ? styles.successText : styles.helper}>{t(message)}</Text> : null}
          <Input label="Location label" value={form.label} onChangeText={setField("label")} error={errors.label} placeholder="Hostel, lab, office, home" />
          <Input label="Full Address" value={form.deliveryAddress} onChangeText={setField("deliveryAddress")} error={errors.deliveryAddress} />
          <Input label="Area" value={form.area} onChangeText={setField("area")} error={errors.area} helper="For example: NM-AIST, Tengeru, or another Arusha area." placeholder="NM-AIST, Tengeru, Arusha" />
          <Input label="Phone Number" value={form.phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={errors.phone} />
          <Input label="Delivery Instructions" value={form.deliveryInstructions ?? ""} onChangeText={setField("deliveryInstructions")} multiline style={styles.instructionsInput} />
          <Button title={editingAddressId ? "Save Changes" : "Save Location"} icon={editingAddressId ? Save : Plus} onPress={save} loading={saving} />
        </Card>
      ) : null}

      <ConfirmDialog
        visible={Boolean(addressToDelete)}
        title="Delete location?"
        message="This saved delivery location will be removed from your NELMA account."
        confirmLabel="Delete"
        destructive
        onCancel={() => setAddressToDelete(null)}
        onConfirm={async () => {
          if (addressToDelete) {
            await deleteSavedAddress(addressToDelete);
            setAddressToDelete(null);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.md
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  formTitleRow: {
    gap: spacing.xs
  },
  formEyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeight.tiny
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  cancelText: {
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  instructionsInput: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  successText: {
    color: colors.success,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  savedSection: {
    marginTop: spacing.md
  },
  savedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs
  },
  savedTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h3,
    lineHeight: typography.lineHeight.h3
  },
  savedCount: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: 12,
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    minWidth: 28,
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    textAlign: "center"
  }
});
