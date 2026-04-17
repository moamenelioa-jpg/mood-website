"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ContactFormContextType {
  isOpen: boolean;
  openContactForm: () => void;
  closeContactForm: () => void;
}

const ContactFormContext = createContext<ContactFormContextType | undefined>(
  undefined
);

export function ContactFormProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContactForm = useCallback(() => setIsOpen(true), []);
  const closeContactForm = useCallback(() => setIsOpen(false), []);

  return (
    <ContactFormContext.Provider
      value={{ isOpen, openContactForm, closeContactForm }}
    >
      {children}
    </ContactFormContext.Provider>
  );
}

export function useContactForm() {
  const context = useContext(ContactFormContext);
  if (!context) {
    throw new Error(
      "useContactForm must be used within a ContactFormProvider"
    );
  }
  return context;
}
