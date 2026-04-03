import { useCallback } from 'react';
import translations from '@/i18n/translations';
import { Language } from '@/types/chefos';

export function useTranslation(language: Language) {
  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  return { t };
}
