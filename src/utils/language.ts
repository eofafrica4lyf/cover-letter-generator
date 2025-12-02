import { franc } from 'franc-min';

const LANGUAGE_MAP: Record<string, string> = {
  'eng': 'en',
  'deu': 'de',
  'fra': 'fr',
  'spa': 'es',
  'ita': 'it',
  'por': 'pt',
  'nld': 'nl',
  'pol': 'pl',
  'rus': 'ru',
  'cmn': 'zh',
  'jpn': 'ja',
  'kor': 'ko',
};

const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
};

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  languageName: string;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length < 10) {
    return {
      language: 'en',
      confidence: 0,
      languageName: 'English'
    };
  }

  const detected = franc(text);
  
  // franc returns 'und' if it can't determine the language
  if (detected === 'und') {
    return {
      language: 'en',
      confidence: 0.5,
      languageName: 'English'
    };
  }

  const language = LANGUAGE_MAP[detected] || 'en';
  const languageName = LANGUAGE_NAMES[language] || 'English';
  
  // Calculate confidence based on text length
  // Longer texts generally give more confident results
  const confidence = Math.min(0.9, 0.5 + (text.length / 1000) * 0.4);

  return {
    language,
    confidence,
    languageName
  };
}

export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    code,
    name
  }));
}
