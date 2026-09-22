import NetInfo from "@react-native-community/netinfo";
import { createContext, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useRequiredContext } from "../hooks/use-required-context";

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
