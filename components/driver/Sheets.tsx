import { Banknote, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import { driverTheme } from "../../constants/driver-theme";
import { radius, spacing, typography } from "../../constants/theme";
import { useTranslation } from "../../hooks/use-translation";
import { locationService } from "../../services/location";
import type { DeliveryIssueInput, DeliveryIssueReason, DriverDeliveryHandover, Order, ProofSkipReason } from "../../types/order";
import { customerDisplayName, needsCashConfirmation } from "../../utils/driver-deliveries";
import { formatCurrency } from "../../utils/format";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const LOCATION_WAIT_MS = 6000;

const withTimeout = async <T,>(work: Promise<T>, ms: number): Promise<T | null> => {
  return Promise.race([work, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
};

const Choice = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected ? styles.choiceSelected : null]}>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>{selected ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}</View>
      <Text style={styles.choiceText}>{t(label)}</Text>
    </Pressable>
  );
};

const skipReasons: Array<{ value: ProofSkipReason; label: string }> = [
  { value: "customer_has_no_phone", label: "Customer has no phone or app" },
  { value: "code_not_working", label: "The code is not working" }
];

type HandoverSheetProps = {
  visible: boolean;
  order: Order;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (handover: DriverDeliveryHandover) => void;
};

export const HandoverSheet = ({ visible, order, loading, error, onCancel, onConfirm }: HandoverSheetProps) => {
  const { t } = useTranslation();
  const needsCash = needsCashConfirmation(order);
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [code, setCode] = useState("");
  const [noCode, setNoCode] = useState(false);
  const [skipReason, setSkipReason] = useState<ProofSkipReason | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCashConfirmed(false);
      setCode("");
      setNoCode(false);
      setSkipReason(null);
    }
  }, [visible]);

  const proofReady = noCode ? skipReason !== null : /^\d{4}$/.test(code);
  const ready = proofReady && (!needsCash || cashConfirmed);

  const confirm = async () => {
    setLocating(true);
    // The location is a soft record of where the handover happened; it never blocks the delivery.
    const located = await withTimeout(locationService.getCurrentCoordinates().catch(() => null), LOCATION_WAIT_MS);
    setLocating(false);
    onConfirm({
      ...(needsCash ? { cashCollected: order.total } : {}),
      ...(noCode && skipReason ? { proofSkipReason: skipReason } : { deliveryCode: code }),
      ...(located && located.status === "granted" ? { latitude: located.coordinates.latitude, longitude: located.coordinates.longitude } : {})
    });
  };

  return (
    <BottomSheet visible={visible} title="Complete delivery" onClose={loading ? () => undefined : onCancel}>
      <View style={styles.body}>
        <Text style={styles.lead}>{t("Handing over to")} {customerDisplayName(order)}</Text>

        {needsCash ? (
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: cashConfirmed }} onPress={() => setCashConfirmed((value) => !value)} style={styles.cash}>
            <View style={styles.cashIcon}><Banknote color={driverTheme.amberText} size={20} /></View>
            <View style={styles.cashCopy}>
              <Text style={styles.cashAmount}>{t("Collect")} {formatCurrency(order.total, order.currency)}</Text>
              <Text style={styles.cashHint}>{t("I collected the full amount in cash")}</Text>
            </View>
            <View style={[styles.box, cashConfirmed ? styles.boxChecked : null]}>{cashConfirmed ? <Check color={colors.white} size={14} strokeWidth={3} /> : null}</View>
          </Pressable>
        ) : null}

        {noCode ? (
          <View style={styles.choices}>
            <Text style={styles.sectionLabel}>{t("Why is there no code?")}</Text>
            {skipReasons.map((reason) => <Choice key={reason.value} label={reason.label} selected={skipReason === reason.value} onPress={() => setSkipReason(reason.value)} />)}
          </View>
        ) : (
          <Input
            label="Delivery code"
            helper="Ask the customer for the 4-digit code in their NELMA app."
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            style={styles.codeInput}
          />
        )}
        <Pressable accessibilityRole="button" onPress={() => { setNoCode((value) => !value); setSkipReason(null); }} style={styles.toggle}>
          <Text style={styles.toggleText}>{t(noCode ? "Enter the code instead" : "Customer cannot show a code")}</Text>
        </Pressable>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
        <Button title="Confirm delivery" onPress={() => void confirm()} disabled={!ready || locating} loading={loading || locating} />
        <Button title="Cancel" variant="ghost" onPress={onCancel} disabled={loading} />
      </View>
    </BottomSheet>
  );
};

const issueReasons: Array<{ value: DeliveryIssueReason; label: string; undo?: boolean }> = [
  { value: "customer_unreachable", label: "Customer is not answering" },
  { value: "wrong_address", label: "I cannot find the address" },
  { value: "customer_refused", label: "Customer refused or is not home" },
  { value: "started_by_mistake", label: "I started this delivery by mistake", undo: true },
  { value: "other", label: "Something else" }
];

type IssueSheetProps = {
  visible: boolean;
  canUndo: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: DeliveryIssueInput) => void;
  onContact: () => void;
};

export const IssueSheet = ({ visible, canUndo, loading, error, onClose, onSubmit, onContact }: IssueSheetProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<DeliveryIssueReason | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setNote("");
    }
  }, [visible]);

  const undoing = reason === "started_by_mistake";

  return (
    <BottomSheet visible={visible} title="Problem with this stop" onClose={loading ? () => undefined : onClose}>
      <View style={styles.body}>
        <Text style={styles.lead}>{t("Tell dispatch what happened. The delivery goes back to NELMA so it can be sorted out.")}</Text>
        <View style={styles.choices}>
          {issueReasons.filter((item) => !item.undo || canUndo).map((item) => (
            <Choice key={item.value} label={item.label} selected={reason === item.value} onPress={() => setReason(item.value)} />
          ))}
        </View>
        {reason && !undoing ? <Input label="Add a note (optional)" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="What should dispatch know?" /> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{t(error)}</Text> : null}
        <Button title={undoing ? "Undo start" : "Report problem"} variant={undoing ? "primary" : "danger"} onPress={() => reason && onSubmit({ reason, ...(note.trim() && !undoing ? { note: note.trim() } : {}) })} disabled={!reason} loading={loading} />
        <Button title="Contact NELMA" variant="ghost" onPress={onContact} disabled={loading} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  lead: { color: colors.mutedText, fontFamily: typography.fonts.regular, fontSize: 15, lineHeight: 22 },
  cash: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: driverTheme.amberBg },
  cashIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  cashCopy: { flex: 1, gap: 2 },
  cashAmount: { color: driverTheme.amberText, fontFamily: typography.fonts.bold, fontSize: 18, lineHeight: 24 },
  cashHint: { color: colors.text, fontFamily: typography.fonts.regular, fontSize: 13, lineHeight: 19 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: driverTheme.amberText, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  boxChecked: { backgroundColor: driverTheme.amberText },
  codeInput: { fontFamily: typography.fonts.bold, fontSize: 28, letterSpacing: 10, textAlign: "center" },
  choices: { gap: spacing.xs },
  sectionLabel: { color: colors.ink, fontFamily: typography.fonts.semibold, fontSize: 15, lineHeight: 22 },
  choice: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  choiceSelected: { borderColor: colors.primary, backgroundColor: driverTheme.aqua },
  choiceText: { flex: 1, color: colors.ink, fontFamily: typography.fonts.medium, fontSize: 15, lineHeight: 21 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  toggle: { minHeight: 40, justifyContent: "center" },
  toggleText: { color: colors.primary, fontFamily: typography.fonts.semibold, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontFamily: typography.fonts.medium, fontSize: 14, lineHeight: 20 }
});
