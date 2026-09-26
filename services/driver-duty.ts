// The duty state the Route screen last heard from NELMA, shared with the location beacon.
// Unknown (null) until the first summary loads; the beacon stays off until it is known to be true.
type Listener = (onDuty: boolean | null) => void;

let onDuty: boolean | null = null;
const listeners = new Set<Listener>();

export const driverDuty = {
  get: (): boolean | null => onDuty,
  set(next: boolean | null): void {
    if (next === onDuty) return;
    onDuty = next;
    listeners.forEach((listener) => listener(onDuty));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
