import NetInfo from "@react-native-community/netinfo";
import { createContext, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { env } from "../config/env";
import { useRequiredContext } from "../hooks/use-required-context";

// NetInfo's default reachability probe (Google) is blocked or slow on some networks and wrongly shows "offline".
// Probe our own API instead; any HTTP response, even an error, proves the internet works.
if (env.apiUrl && !env.useMocks) {
  NetInfo.configure({
    reachabilityUrl: env.apiUrl.replace(/\/+$/, "") + "/health",
    reachabilityTest: async () => true,
    reachabilityLongTimeout: 30 * 1000,
    reachabilityShortTimeout: 10 * 1000,
    reachabilityRequestTimeout: 60 * 1000
  });
}

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
};

const NetworkContext = createContext<NetworkState | undefined>(undefined);

export const NetworkProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<NetworkState>({ isConnected: true, isInternetReachable: true });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      setState({
        isConnected: Boolean(netState.isConnected),
        isInternetReachable: netState.isInternetReachable
      });
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => state, [state]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkState => useRequiredContext(NetworkContext, "useNetwork");
