import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import { NavigationBar } from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../constants/colors";
import { StartupSplash } from "../components/startup-splash";
import { AppProviders } from "../store/app-providers";
import { useAuth } from "../store/auth-context";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const StartupReady = ({ onReady }: { onReady: () => void }) => {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== "loading") onReady();
  }, [onReady, status]);
  return null;
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold
  });

  // Keep launch state outside account providers so login/logout cannot replay it.
  const [authReady, setAuthReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const markAuthReady = useCallback(() => setAuthReady(true), []);
  const finishSplash = useCallback(() => setSplashFinished(true), []);
  const fontsReady = fontsLoaded || Boolean(fontError);



  return (
    <View style={styles.root}>
      <AppProviders>
        <StartupReady onReady={markAuthReady} />
        {fontsReady ? <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} /> : null}
      </AppProviders>
      <NavigationBar style="dark" hidden={false} />
      <StatusBar style="dark" hidden={false} />
      {!splashFinished ? (
        <StartupSplash
          ready={fontsReady && authReady}
          onFinish={finishSplash}
          source={require("../assets/splash-video.mp4")}
          poster={require("../assets/splash-artwork.png")}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }
});
