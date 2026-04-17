"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Language, translations, t as translate, getDirection, formatPriceLocalized } from "./translations";

// ==========================================
// TYPES
// ==========================================

interface LanguageContextType {
  language: Language;
  isArabic: boolean;
  dir: "ltr" | "rtl";
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  formatPrice: (amount: number) => string;
}

// ==========================================
// CONTEXT
// ==========================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ==========================================
// STORAGE KEY
// ==========================================

const LANGUAGE_STORAGE_KEY = "mood_language";
const DEFAULT_LANGUAGE: Language = "ar"; // Default to Arabic as requested

// ==========================================
// PROVIDER
// ==========================================

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (savedLanguage && (savedLanguage === "ar" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Update HTML attributes when language changes
  useEffect(() => {
    if (mounted) {
      const dir = getDirection(language);
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language, mounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translate(key, language);
    },
    [language]
  );

  const formatPrice = useCallback(
    (amount: number): string => {
      return formatPriceLocalized(amount, language);
    },
    [language]
  );

  const value: LanguageContextType = {
    language,
    isArabic: language === "ar",
    dir: getDirection(language),
    setLanguage,
    toggleLanguage,
    t,
    formatPrice,
  };

  // Prevent hydration mismatch by rendering nothing until mounted
  if (!mounted) {
    return (
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// ==========================================
// LANGUAGE SWITCHER COMPONENT
// ==========================================

interface LanguageSwitcherProps {
  className?: string;
  variant?: "button" | "icon" | "text";
}

export function LanguageSwitcher({ className = "", variant = "button" }: LanguageSwitcherProps) {
  const { language, toggleLanguage, t } = useLanguage();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center justify-center rounded-full p-2 transition hover:bg-gray-100 ${className}`}
        aria-label={t("nav.switchLang")}
      >
        <span className="text-lg">{language === "ar" ? "EN" : "ع"}</span>
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`text-sm font-semibold transition hover:opacity-70 ${className}`}
      >
        {language === "ar" ? "English" : "العربية"}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-full border border-[#edd1b6] bg-white/90 px-4 py-2 text-sm font-black text-[#5f3b1f] transition hover:border-[#d2a57b] ${className}`}
    >
      {language === "ar" ? "EN / AR" : "AR / EN"}
    </button>
  );
}

// ==========================================
// EXPORTS
// ==========================================

export { translations, type Language };
