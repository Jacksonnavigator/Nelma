import { useContext } from "react";

export const useRequiredContext = <T>(context: React.Context<T | undefined>, name: string): T => {
  const value = useContext(context);
  if (!value) {
    throw new Error(name + " must be used inside its provider.");
  }
  return value;
};
