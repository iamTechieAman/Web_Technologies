import { SupportedLanguage } from '@/types';
import { LANGUAGE_CONFIGS, getLanguageFromExtension as getLangFromExt } from './languageConfigs';

export const LANGUAGES = LANGUAGE_CONFIGS;

export const LANGUAGE_LIST = Object.entries(LANGUAGE_CONFIGS).map(([key, cfg]) => ({
  value: key as SupportedLanguage,
  label: cfg.name,
}));

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getLanguageFromExtension(filename: string): SupportedLanguage {
  return getLangFromExt(filename);
}

/**
 * Helper to wrap dynamic imports with retry logic to handle ChunkLoadError
 */
export function dynamicWithRetry<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  interval: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (remaining: number) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          if (remaining > 0 && (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk'))) {
            setTimeout(() => attempt(remaining - 1), interval);
          } else {
            reject(error);
          }
        });
    };
    attempt(retries);
  });
}
