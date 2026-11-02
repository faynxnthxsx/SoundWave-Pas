import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const LanguageContext = createContext({
  lang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (th) => th,
  trData: (text) => text,
  i18n,
});

// Context-aware Regex Replacements (units with numbers, Buddhist Era years, seat tooltips, etc.)
const REGEX_REPLACEMENTS = [
  [/\b2567\b/g, '2024'],
  [/\b2568\b/g, '2025'],
  [/\b2569\b/g, '2026'],
  [/\b2570\b/g, '2027'],
  [/\b2571\b/g, '2028'],
  [/(\d[\d,]*)\s*ใบ/g, '$1 tickets'],
  [/(\d[\d,]*)\s*คน/g, '$1 attendees'],
  [/(\d[\d,]*)\s*งานใหม่/g, '$1 new events'],
  [/(\d[\d,]*)\s*งาน/g, '$1 events'],
  [/(\d[\d,]*)\s*โซน/g, '$1 zones'],
  [/(\d[\d,]*)%\s*เข้างาน/g, '$1% checked in'],
  [/ทั้งหมด\s*(\d[\d,]*)\s*ที่นั่งสำเร็จ/g, '($1 seats) successfully'],
  [/ทั้งหมด\s*(\d[\d,]*)\s*ที่นั่งเรียบร้อย/g, '($1 seats) successfully'],
  [/(\d[\d,]*)\s*ที่นั่ง/g, '$1 seats'],
  [/ที่นั่ง\s+([A-Z0-9-]+)/g, 'Seat $1'],
  [/โซนที่\s*(\d+)/g, 'Zone $1'],
  [/รูป\s+(.+)/g, 'Photo of $1'],
  [/\s*น\.$/g, ''],
  [/\s*น\.\s*/g, ' '],
  [/\s+ได้$/g, ''],
  [/\s+และ\s+/g, ' & '],
];

const THAI_CHAR_RE = /[\u0E01-\u0E3A\u0E40-\u0E5B]/;
const EN_ALPHA_RE = /[A-Za-z]{2,}/;

function splitBilingualText(rawText, targetLang) {
  if (!rawText || typeof rawText !== 'string') return null;
  const separators = [' | ', ' / '];
  for (const sep of separators) {
    if (rawText.includes(sep)) {
      const parts = rawText.split(sep).map((s) => s.trim()).filter(Boolean);
      if (parts.length === 2) {
        const [p0, p1] = parts;
        const p0HasThai = THAI_CHAR_RE.test(p0);
        const p1HasThai = THAI_CHAR_RE.test(p1);
        if (p0HasThai && !p1HasThai && EN_ALPHA_RE.test(p1)) {
          return targetLang === 'en' ? p1 : p0;
        }
        if (!p0HasThai && p1HasThai && EN_ALPHA_RE.test(p0)) {
          return targetLang === 'en' ? p0 : p1;
        }
      }
    }
  }
  return null;
}

function translateThaiString(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText;
  const bilingual = splitBilingualText(rawText, 'en');
  if (bilingual) return bilingual;
  if (!THAI_CHAR_RE.test(rawText)) return rawText;

  const leading = rawText.match(/^\s*/)?.[0] || '';
  const trailing = rawText.match(/\s*$/)?.[0] || '';
  const trimmed = rawText.trim();

  // Lookup from i18next locale bundle (locales/en.json)
  const enBundle = i18n.getResourceBundle('en', 'translation') || {};
  const exactDict = enBundle.exact || {};
  const phraseDict = enBundle.phrases || {};

  if (exactDict[trimmed]) {
    return leading + exactDict[trimmed] + trailing;
  }

  let out = trimmed;
  for (const [th, en] of Object.entries(phraseDict)) {
    if (out.includes(th)) {
      out = out.split(th).join(en);
    }
  }
  for (const [re, replacement] of REGEX_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }

  return leading + out + trailing;
}

// WeakMaps to store original Thai text on DOM nodes and attributes so switching back to TH is 100% lossless
const originalTextNodeMap = new WeakMap();
const originalAttrMap = new WeakMap();
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

function applyDomTranslation(lang) {
  if (typeof document === 'undefined' || !document.body) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const parentTag = node.parentElement?.tagName;
    if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'TEXTAREA') continue;

    const currentVal = node.nodeValue || '';
    if (lang === 'en') {
      if (THAI_CHAR_RE.test(currentVal)) {
        originalTextNodeMap.set(node, currentVal);
        const translated = translateThaiString(currentVal);
        if (translated !== currentVal) {
          node.nodeValue = translated;
        }
      }
    } else if (originalTextNodeMap.has(node)) {
      const orig = originalTextNodeMap.get(node);
      originalTextNodeMap.delete(node);
      if (orig && node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
    }
  }

  const elements = document.body.querySelectorAll('[placeholder],[title],[aria-label]');
  elements.forEach((el) => {
    let savedAttrs = originalAttrMap.get(el);
    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      if (lang === 'en') {
        if (THAI_CHAR_RE.test(val)) {
          if (!savedAttrs) {
            savedAttrs = {};
            originalAttrMap.set(el, savedAttrs);
          }
          savedAttrs[attr] = val;
          const translated = translateThaiString(val);
          if (translated !== val) {
            el.setAttribute(attr, translated);
          }
        }
      } else if (savedAttrs && savedAttrs[attr]) {
        const origVal = savedAttrs[attr];
        delete savedAttrs[attr];
        if (el.getAttribute(attr) !== origVal) {
          el.setAttribute(attr, origVal);
        }
      }
    }
  });
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('soundwave_lang') || 'th';
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('soundwave_lang', lang);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    applyDomTranslation(lang);

    if (lang !== 'en') return undefined;

    const obsConfig = {
      childList: true,
      subtree: true,
      characterData: true,
    };

    const observer = new MutationObserver(() => {
      observer.disconnect();
      applyDomTranslation('en');
      observer.observe(document.body, obsConfig);
    });

    observer.observe(document.body, obsConfig);

    return () => {
      observer.disconnect();
    };
  }, [lang]);

  const toggleLang = useCallback(() => setLang((prev) => (prev === 'th' ? 'en' : 'th')), []);
  const t = useCallback(
    (thText, enText) => {
      if (enText === undefined && i18n.exists(thText)) {
        return i18n.t(thText, { lng: lang });
      }
      if (enText === undefined) {
        return lang === 'en' ? translateThaiString(thText) : thText;
      }
      return lang === 'en' ? enText : thText;
    },
    [lang]
  );
  const trData = useCallback(
    (rawText) => {
      if (!rawText || typeof rawText !== 'string') return rawText;
      if (lang !== 'en') {
        return splitBilingualText(rawText, 'th') || rawText;
      }
      return translateThaiString(rawText);
    },
    [lang]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, trData, i18n }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
