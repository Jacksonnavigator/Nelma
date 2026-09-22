import { Link, router } from "expo-router";
import { Check, Languages, LocateFixed, MapPin, Navigation, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark, Button, Input, PasswordInput, Screen, ServiceAreaMap } from "../../components";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { haptics } from "../../services/haptics";
import { locationService } from "../../services/location";
import { useAuth } from "../../store/auth-context";
import type { DeliveryAddress } from "../../types/address";
import type { RegisterInput } from "../../types/auth";
import type { AddressLocationPreference, LanguagePreference } from "../../types/user";
import { emptyDeliveryAddress, hasCoordinates, normalizeDeliveryAddress } from "../../utils/address";
import { createTranslator } from "../../utils/i18n";
import { mobileLandingForUser } from "../../utils/role-routing";
import type { FieldErrors } from "../../utils/validation";
import { hasErrors, validateDeliveryAddress, validateRegistration } from "../../utils/validation";

const initialForm: RegisterInput = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  preferredLanguage: "en",
  addressLocationPreference: "single",
  signupAddress: null
};

const languageOptions: Array<{ value: LanguagePreference; title: string; subtitle: string }> = [
  { value: "en", title: "English", subtitle: "App language" },
  { value: "sw", title: "Swahili", subtitle: "Lugha ya Kiswahili" }
];

const locationOptions: Array<{ value: AddressLocationPreference; title: string; subtitle: string }> = [
  { value: "single", title: "One location", subtitle: "Use one regular delivery point." },
  { value: "multiple", title: "Multiple", subtitle: "Save more locations later." }
];

type AccountField = "fullName" | "phone" | "email" | "password" | "confirmPassword";
type LocationField = "deliveryAddress" | "area" | "phone" | "deliveryInstructions";

type PickedCoordinate = {
  latitude: number;
  longitude: number;
};

export default function RegisterScreen() {
  const { register, error } = useAuth();
  const [form, setForm] = useState<RegisterInput>(initialForm);
  const [location, setLocation] = useState<DeliveryAddress>(emptyDeliveryAddress(""));
  const [errors, setErrors] = useState<FieldErrors<RegisterInput>>({});
  const [locationErrors, setLocationErrors] = useState<FieldErrors<DeliveryAddress>>({});
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedLanguage = form.preferredLanguage ?? "en";
  const selectedLocationPreference = form.addressLocationPreference ?? "single";
  const t = createTranslator(selectedLanguage);
  const fieldError = (value?: string) => value ? t(value) : undefined;

  const setField = (key: AccountField) => (value: string) => {
    setErrors((current) => ({ ...current, [key]: undefined }));
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setLocationField = (key: LocationField) => (value: string) => {
    setLocationErrors((current) => ({ ...current, [key]: undefined }));
    setLocation((current) => ({ ...current, [key]: value }));
  };

  const chooseLanguage = (preferredLanguage: LanguagePreference) => {
    haptics.selection();
    setErrors((current) => ({ ...current, preferredLanguage: undefined }));
    setForm((current) => ({ ...current, preferredLanguage }));
  };

  const chooseLocationPreference = (addressLocationPreference: AddressLocationPreference) => {
    haptics.selection();
    setErrors((current) => ({ ...current, addressLocationPreference: undefined }));
    setForm((current) => ({ ...current, addressLocationPreference }));
  };

  const dropManualPin = (coordinate: PickedCoordinate) => {
    haptics.selection();
    setLocation((current) => ({
      ...current,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    }));
    setLocationMessage("Manual pin added. Complete the address details below.");
  };

  const useCurrentLocation = async () => {
    haptics.selection();
    setLocating(true);
    try {
      const result = await locationService.getCurrentCoordinates();
      if (result.status === "granted") {
        setLocation((current) => ({
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

  const submit = async () => {
    setSubmitError(null);
    const accountErrors = validateRegistration(form);
    const normalizedLocation = normalizeDeliveryAddress({
      ...location,
      phone: location.phone || form.phone
    });
    const nextLocationErrors = validateDeliveryAddress(normalizedLocation);
    const hasPin = hasCoordinates(normalizedLocation);

    setErrors(accountErrors);
    setLocationErrors(nextLocationErrors);

    if (!hasPin) {
      setLocationMessage("Use current location or tap the map to drop a delivery pin.");
    } else if (hasErrors(nextLocationErrors)) {
      setLocationMessage("Complete the delivery location details before creating the account.");
    }

    if (hasErrors(accountErrors) || hasErrors(nextLocationErrors) || !hasPin) {
      setSubmitError(Object.values(accountErrors).find(Boolean) ?? Object.values(nextLocationErrors).find(Boolean) ?? "Use current location or tap the map to drop a delivery pin.");
      haptics.light();
      return;
    }

    setSubmitting(true);
    try {
      const nextUser = await register({
        ...form,
        signupAddress: normalizedLocation
      });
      haptics.success();
      router.replace(mobileLandingForUser(nextUser));
    } catch {
      haptics.light();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <BrandMark />
        <Text style={styles.title}>{t("Create your account")}</Text>
        <Text style={styles.subtitle}>{t("Set your language and first Arusha delivery point so NELMA can prepare orders faster.")}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}><Languages color={colors.primary} size={20} /></View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>{t("Language")}</Text>
            <Text style={styles.helper}>{t("Choose how the app should serve you.")}</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {languageOptions.map((option) => {
            const selected = selectedLanguage === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => chooseLanguage(option.value)}
                style={({ pressed }) => [styles.option, selected ? styles.optionSelected : null, { opacity: pressed ? 0.78 : 1 }]}
              >
                <View style={[styles.optionCheck, selected ? styles.optionCheckSelected : null]}>{selected ? <Check color={colors.white} size={14} strokeWidth={3} /> : null}</View>
                <Text style={styles.optionTitle}>{t(option.title)}</Text>
                <Text style={styles.optionSubtitle}>{t(option.subtitle)}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.preferredLanguage ? <Text style={styles.errorText}>{t(errors.preferredLanguage)}</Text> : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{t("Account details")}</Text>
        <Input label={t("Full name")} value={form.fullName} onChangeText={setField("fullName")} error={fieldError(errors.fullName)} />
        <Input label={t("Phone number")} value={form.phone} onChangeText={setField("phone")} keyboardType="phone-pad" error={fieldError(errors.phone)} helper={t("Used for delivery calls and order updates.")} />
        <Input label={t("Email")} helper={t("Optional. You can sign in with your phone number.")} value={form.email} onChangeText={setField("email")} autoCapitalize="none" keyboardType="email-address" error={fieldError(errors.email)} />
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}><MapPin color={colors.primary} size={20} /></View>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>{t("Delivery location")}</Text>
            <Text style={styles.helper}>{t("Choose one location now, or keep space for multiple saved locations later.")}</Text>
          </View>
        </View>
        <View style={styles.optionRow}>
          {locationOptions.map((option) => {
            const selected = selectedLocationPreference === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => chooseLocationPreference(option.value)}
                style={({ pressed }) => [styles.option, selected ? styles.optionSelected : null, { opacity: pressed ? 0.78 : 1 }]}
              >
                <View style={[styles.optionCheck, selected ? styles.optionCheckSelected : null]}>{selected ? <Check color={colors.white} size={14} strokeWidth={3} /> : null}</View>
                <Text style={styles.optionTitle}>{t(option.title)}</Text>
                <Text style={styles.optionSubtitle}>{t(option.subtitle)}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.addressLocationPreference ? <Text style={styles.errorText}>{t(errors.addressLocationPreference)}</Text> : null}
        <ServiceAreaMap
          latitude={location.latitude}
          longitude={location.longitude}
          pickable
          onPickCoordinate={dropManualPin}
          subtitle={t("Use GPS or tap the Arusha map to place your first delivery pin.")}
          title={t("First delivery pin")}
        />
        <Button title={t(hasCoordinates(location) ? "Update Current Location" : "Use My Current Location")} icon={LocateFixed} variant="secondary" onPress={useCurrentLocation} loading={locating} />
        {locationMessage ? <Text style={hasCoordinates(location) ? styles.successText : styles.helper}>{t(locationMessage)}</Text> : null}
        {hasCoordinates(location) ? (
          <View style={styles.locationChip}>
            <Navigation color={colors.success} size={14} strokeWidth={2.4} />
            <Text style={styles.locationChipText}>{t("Pin attached")}</Text>
          </View>
        ) : null}
        <Input label={t("Full Address")} value={location.deliveryAddress} onChangeText={setLocationField("deliveryAddress")} error={fieldError(locationErrors.deliveryAddress)} />
        <Input label={t("Area")} value={location.area} onChangeText={setLocationField("area")} error={fieldError(locationErrors.area)} helper={t("For example: NM-AIST, Tengeru, or another Arusha area.")} placeholder="NM-AIST, Tengeru, Arusha" />
        <Input label={t("Delivery phone")} value={location.phone || form.phone} onChangeText={setLocationField("phone")} keyboardType="phone-pad" error={fieldError(locationErrors.phone)} />
        <Input label={t("Delivery Instructions")} value={location.deliveryInstructions ?? ""} onChangeText={setLocationField("deliveryInstructions")} multiline style={styles.instructionsInput} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>{t("Security")}</Text>
        <PasswordInput label={t("Password")} value={form.password} onChangeText={setField("password")} error={fieldError(errors.password)} />
        <PasswordInput label={t("Confirm password")} value={form.confirmPassword} onChangeText={setField("confirmPassword")} error={fieldError(errors.confirmPassword)} />
        {submitError || error ? <Text accessibilityRole="alert" style={styles.error}>{t(submitError || error || "")}</Text> : null}
        <Button title={t("Create Account")} icon={UserPlus} onPress={submit} loading={submitting} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>{t("Already have an account?")}</Text>
        <Link href="/(auth)/login" style={styles.footerLink}>{t("Sign in")}</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "flex-start"
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.h1,
    lineHeight: typography.lineHeight.h1,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center"
  },
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  sectionIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  sectionCopy: {
    flex: 1,
    gap: 2
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
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  option: {
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xxs,
    minHeight: 92,
    minWidth: 128,
    padding: spacing.md
  },
  optionSelected: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.primary,
    borderWidth: 2
  },
  optionCheck: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  optionCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionTitle: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  locationChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMint,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  locationChipText: {
    color: colors.success,
    fontFamily: typography.fonts.bold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny,
    textTransform: "uppercase"
  },
  instructionsInput: {
    minHeight: 88,
    textAlignVertical: "top"
  },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    color: colors.danger,
    fontFamily: typography.fonts.bold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small,
    padding: spacing.md
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  successText: {
    color: colors.success,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center"
  },
  footerText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  footerLink: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  }
});



