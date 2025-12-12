import React, { createContext, useContext, useState, ReactNode } from 'react';
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    // Get language from localStorage or default to 'es'
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      return savedLanguage || 'es';
    }
    return 'es';
  });

  const translations: Record<string, Record<string, string>> = {
    es: esTranslations as Record<string, string>,
    en: enTranslations as Record<string, string>
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
