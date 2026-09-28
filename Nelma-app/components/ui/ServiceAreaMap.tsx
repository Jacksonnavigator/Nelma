import React, { useEffect, useMemo } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTranslation } from "../../hooks/use-translation";
import { colors } from "../../constants/colors";
import { radius, spacing, typography } from "../../constants/theme";
import { buildMapHtml, parseMapMessage, toMapCoordinate, type MapCoordinate } from "./map-html";

type ServiceAreaMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  compact?: boolean;
  pickable?: boolean;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  onPickCoordinate?: (coordinate: MapCoordinate) => void;
};

type BrowserMessageEvent = {
  data?: unknown;
};

type BrowserGlobal = typeof globalThis & {
  addEventListener?: (type: "message", listener: (event: BrowserMessageEvent) => void) => void;
  removeEventListener?: (type: "message", listener: (event: BrowserMessageEvent) => void) => void;
};

const defaultSubtitle = "Actual OpenStreetMap view for Nelson Mandela African Institute of Science and Technology and nearby Arusha neighborhoods.";

export const ServiceAreaMap = ({
  latitude,
  longitude,
  compact = false,
  pickable = false,
  title = "Arusha service map",
  subtitle = defaultSubtitle,
  style,
  onPickCoordinate
}: ServiceAreaMapProps) => {
  const { t } = useTranslation();
  const selectedCoordinate = toMapCoordinate(latitude, longitude);
  const html = useMemo(() => buildMapHtml(latitude, longitude, pickable), [latitude, longitude, pickable]);

  useEffect(() => {
    if (!pickable || !onPickCoordinate) {
      return undefined;
    }
    const browser = globalThis as BrowserGlobal;
    const handleMessage = (event: BrowserMessageEvent) => {
      const message = parseMapMessage(event.data);
      if (message) {
        onPickCoordinate({ latitude: message.latitude, longitude: message.longitude });
      }
    };

    browser.addEventListener?.("message", handleMessage);
    return () => browser.removeEventListener?.("message", handleMessage);
  }, [onPickCoordinate, pickable]);

  return (
    <View style={[styles.card, compact ? styles.compactCard : null, style]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{t(title)}</Text>
        <Text style={styles.subtitle}>{t(subtitle)}</Text>
      </View>
      <View style={[styles.mapFrame, compact ? styles.mapFrameCompact : null]}>
        {React.createElement("iframe", {
          allow: "geolocation",
          key: html,
          sandbox: "allow-scripts",
          srcDoc: html,
          style: webMapStyle,
          title: "NELMA actual delivery map"
        })}
      </View>
      <View style={styles.infoRow}>
        <View style={styles.dot} />
        <Text style={styles.infoText}>{t(pickable ? "Pan, zoom, and tap the actual map to drop a delivery pin." : "Actual OpenStreetMap tiles for the NELMA service area.")}</Text>
      </View>
      {selectedCoordinate ? (
        <Text style={styles.coordinateText}>{t("Selected pin")}: {selectedCoordinate.latitude.toFixed(4)}, {selectedCoordinate.longitude.toFixed(4)}</Text>
      ) : (
        <Text style={styles.coordinateText}>{t("No pin selected yet.")}</Text>
      )}
    </View>
  );
};

const webMapStyle = {
  border: "0",
  display: "block",
  height: "100%",
  width: "100%"
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md
  },
  compactCard: {
    padding: spacing.sm
  },
  copy: {
    gap: spacing.xxs
  },
  title: {
    color: colors.text,
    fontFamily: typography.fonts.bold,
    fontSize: typography.body,
    lineHeight: typography.lineHeight.body
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.small,
    lineHeight: typography.lineHeight.small
  },
  mapFrame: {
    aspectRatio: 320 / 188,
    backgroundColor: colors.surfaceBlue,
    borderRadius: radius.lg,
    minHeight: 188,
    overflow: "hidden",
    width: "100%"
  },
  mapFrameCompact: {
    borderRadius: radius.md,
    minHeight: 150
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 9,
    width: 9
  },
  infoText: {
    color: colors.mutedText,
    flex: 1,
    fontFamily: typography.fonts.semibold,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  },
  coordinateText: {
    color: colors.mutedText,
    fontFamily: typography.fonts.regular,
    fontSize: typography.tiny,
    lineHeight: typography.lineHeight.tiny
  }
});
