import { useEffect, useState } from "react";
import { driverOutbox } from "../services/driver-outbox";
import { useAuth } from "../store/auth-context";

// Live view of this driver's unsent actions and the ones NELMA rejected on replay.
export const useDriverOutbox = () => {
  const { user } = useAuth();
  const [state, setState] = useState(driverOutbox.snapshot());

  useEffect(() => {
    driverOutbox.setOwner(user?.id);
  }, [user?.id]);

  useEffect(() => {
    setState(driverOutbox.snapshot());
    return driverOutbox.subscribe(() => setState(driverOutbox.snapshot()));
  }, []);

  return state;
};
