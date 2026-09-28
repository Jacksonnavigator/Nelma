// The Expo push token this device registered for the signed-in account.
// Kept free of native imports so logout can read it on every platform.
let registeredToken: string | null = null;

export const registeredPushToken = {
  get: (): string | null => registeredToken,
  set: (token: string | null): void => {
    registeredToken = token;
  }
};
