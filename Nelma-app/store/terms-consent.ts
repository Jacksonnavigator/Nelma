import { useCallback, useEffect, useSyncExternalStore } from "react";
import { TERMS_VERSION } from "../constants/terms";
import { localStore } from "../storage/local-store";

export const TERMS_KEY = "nelma.terms.accepted";

type Status = "loading" | "needed" | "accepted";
type ConsentRecord = { version: string; acceptedAt: string };

// One shared answer for the whole app, so accepting on the first screen opens every gate at once.
let status: Status = "loading";
let started = false;
const listeners = new Set<() => void>();

const set = (next: Status) => {
  status = next;
  listeners.forEach((listener) => listener());
};

const load = async () => {
  try {
    const saved = await localStore.getJson<ConsentRecord>(TERMS_KEY);
    set(saved?.version === TERMS_VERSION ? "accepted" : "needed");
  } catch {
    // If the phone's storage cannot be read, ask again rather than assume agreement.
    set("needed");
  }
};

export const termsConsent = {
  async accept(): Promise<void> {
    set("accepted");
    try {
      await localStore.setJson<ConsentRecord>(TERMS_KEY, { version: TERMS_VERSION, acceptedAt: new Date().toISOString() });
    } catch {
      // Accepted for this session; the person will be asked again next time.
    }
  },
  get: (): Status => status
};

export const useTermsConsent = (): { status: Status; accept: () => Promise<void> } => {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
    () => status
  );
  useEffect(() => {
    if (started) return;
    started = true;
    void load();
  }, []);
  const accept = useCallback(() => termsConsent.accept(), []);
  return { status: current, accept };
};
