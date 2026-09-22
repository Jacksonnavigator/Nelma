import { useMemo } from "react";
import { useAuth } from "../store/auth-context";
import { createTranslator, normalizeLanguage } from "../utils/i18n";

export const useTranslation = () => {
  const { user } = useAuth();
  const language = normalizeLanguage(user?.preferredLanguage);
  const t = useMemo(() => createTranslator(language), [language]);
  return { language, t };
};
