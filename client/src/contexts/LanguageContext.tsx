import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import enTranslations from '../locale/en.json';
import zhHansTranslations from '../locale/zh-hans.json';
import zhHantTranslations from '../locale/zh-hant.json';
import jaTranslations from '../locale/ja.json';
import esTranslations from '../locale/es.json';
import deTranslations from '../locale/de.json';

import enCategoryTranslations from '../locale/category-en.json';
import zhHansCategoryTranslations from '../locale/category-zh-hans.json';
import zhHantCategoryTranslations from '../locale/category-zh-hant.json';
import jaCategoryTranslations from '../locale/category-ja.json';
import esCategoryTranslations from '../locale/category-es.json';
import deCategoryTranslations from '../locale/category-de.json';

// Define the supported languages
export type SupportedLanguage = 'en' | 'zh-hans' | 'zh-hant' | 'ja' | 'es' | 'de';

// Define the structure for translation objects
type TranslationValue = string | Record<string, any>;
type TranslationRecord = Record<string, TranslationValue>;

// Define the type for the language context
type LanguageContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string; // translation function
};

// Create the initial context value
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary with imported JSON files
const translations: Record<SupportedLanguage, TranslationRecord> = {
  en: { ...enTranslations, category: enCategoryTranslations },
  'zh-hans': { ...zhHansTranslations, category: zhHansCategoryTranslations },
  'zh-hant': { ...zhHantTranslations, category: zhHantCategoryTranslations },
  ja: { ...jaTranslations, category: jaCategoryTranslations },
  es: { ...esTranslations, category: esCategoryTranslations },
  de: { ...deTranslations, category: deCategoryTranslations }
};

// Helper function to detect browser language
const detectBrowserLanguage = (): SupportedLanguage => {
  // Get browser language from navigator
  const browserLang = navigator.language.toLowerCase();
  
  // Match exact language codes for more precise detection
  
  // English variants (en, en-us, en-gb, etc.)
  if (browserLang === 'en' || browserLang.startsWith('en-')) {
    return 'en';
  }
  
  // Traditional Chinese variants
  if (browserLang === 'zh-tw' || 
      browserLang === 'zh-hk' || 
      browserLang === 'zh-mo' || 
      browserLang === 'zh-hant' ||
      browserLang.startsWith('zh-hant-')) {
    return 'zh-hant';
  }
  
  // Simplified Chinese variants
  if (browserLang === 'zh-cn' || 
      browserLang === 'zh-sg' || 
      browserLang === 'zh-hans' ||
      browserLang.startsWith('zh-hans-')) {
    return 'zh-hans';
  }
  
  // Japanese variants
  if (browserLang === 'ja' || 
      browserLang === 'ja-jp' || 
      browserLang.startsWith('ja-')) {
    return 'ja';
  }
  
  // Spanish variants
  if (browserLang === 'es' || 
      browserLang.startsWith('es-')) {
    return 'es';
  }
  
  // German variants
  if (browserLang === 'de' || 
      browserLang === 'de-de' || 
      browserLang === 'de-at' || 
      browserLang === 'de-ch' || 
      browserLang.startsWith('de-')) {
    return 'de';
  }
  
  // If no exact match found, default to English
  return 'en';
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get saved language from localStorage, or detect from browser, default to 'en'
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('language');
    
    // Handle valid language codes in the new format
    if (saved === 'en' || saved === 'zh-hans' || saved === 'zh-hant' || saved === 'ja' || saved === 'es' || saved === 'de') {
      return saved as SupportedLanguage;
    }
    
    // Handle legacy camelCase format
    if (saved === 'zhHans') {
      // Update localStorage to the new format
      localStorage.setItem('language', 'zh-hans');
      return 'zh-hans';
    }
    
    if (saved === 'zhHant') {
      // Update localStorage to the new format
      localStorage.setItem('language', 'zh-hant');
      return 'zh-hant';
    }
    
    // Handle very legacy 'zh' code by mapping to 'zh-hans'
    if (saved === 'zh') {
      // Update localStorage to the new format
      localStorage.setItem('language', 'zh-hans');
      return 'zh-hans';
    }
    
    // If no saved preference or invalid value, detect from browser
    return detectBrowserLanguage();
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function that handles nested keys like "nav.home"
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};