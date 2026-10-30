import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  lang: 'th',
  setLang: () => {},
  toggleLang: () => {},
  t: (th) => th,
  trData: (text) => text,
});

// Exact & phrase-based dictionary for dynamic DB data (venues, descriptions, schedules, artists)
const EXACT_DATA_MAP = {
  'เธเธฃเธธเธเน€เธ—เธเธกเธซเธฒเธเธเธฃ': 'Bangkok, Thailand',
  'เธเธเธ—เธเธธเธฃเธต': 'Nonthaburi, Thailand',
  'เธเธฅเธเธธเธฃเธต': 'Chonburi, Thailand',
  'เธ เธนเน€เธเนเธ•': 'Phuket, Thailand',
  'เธฃเธฒเธเธกเธฑเธเธเธฅเธฒเธเธตเธฌเธฒเธชเธ–เธฒเธ': 'Rajamangala National Stadium, Bangkok',
  'เธญเธดเธกเนเธเนเธ เธญเธฒเธฃเธตเธเนเธฒ เน€เธกเธทเธญเธเธ—เธญเธเธเธฒเธเธต': 'IMPACT Arena, Muang Thong Thani',
  'เธขเธนเนเธญเธเธต เนเธฅเธเน, เน€เธญเนเธกเธชเน€เธเธตเธขเธฃเน': 'UOB LIVE, EMSPHERE Bangkok',
  'เธเธฑเธเน€เธ”เธญเธฃเนเนเธ”เธก เธชเน€เธ•เน€เธ”เธตเธขเธก': 'Thunderdome Stadium, Muang Thong Thani',
  'เธชเธเธฒเธกเธเธตเธฌเธฒเนเธซเนเธเธเธฒเธ•เธด เธจเธธเธ เธเธฅเธฒเธจเธฑเธข': 'Suphachalasai National Stadium, Bangkok',
  'เธขเธนเน€เธเธตเนเธขเธ เธฎเธญเธฅเธฅเน, เธจเธนเธเธขเนเธเธฒเธฃเธเนเธฒเธขเธนเน€เธเธตเนเธขเธ เธกเธญเธฅเธฅเน': 'Union Hall, Union Mall Bangkok',
  'Oasis Outdoor Arena, เธชเธงเธเธเธถเนเธ เธฃเธฒเธเธเธธเธฃเธต': 'Oasis Outdoor Arena, Suan Phueng, Ratchaburi',
  'เธเธฃเธฐเธ•เธนเน€เธเธดเธ” & เธเธธเธ”เธฅเธเธ—เธฐเน€เธเธตเธขเธ Camping': 'Gates Open & Camping Check-in',
  'เธเธฃเธฐเธ•เธนเน€เธเธดเธ” & เน€เธเนเธเธญเธดเธเน€เธเนเธฒเนเธเธเนเธเธกเธเนเธเธดเนเธ': 'Gates Open & Camping Zone Check-in',
  'เนเธเธเธญเธฒเธซเธฒเธฃ Street Food & เน€เธเธฃเธทเนเธญเธเธ”เธทเนเธกเน€เธเธดเธ”เธเธฃเธดเธเธฒเธฃ': 'Street Food & Craft Beverage Village Opens',
  'เน€เธเธดเธ”เนเธเธเธญเธฒเธซเธฒเธฃ Street Food & เน€เธเธฃเธทเนเธญเธเธ”เธทเนเธก': 'Street Food & Craft Beverage Village Opens',
  'เน€เธฃเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธชเธ”เธ—เธฑเนเธ 3 เน€เธงเธ—เธต': 'Live Performances Begin Across All 3 Stages',
  'เน€เธฃเธดเนเธกเธเธฒเธฃเนเธชเธ”เธเธ”เธเธ•เธฃเธตเธ—เธฑเนเธ 3 เน€เธงเธ—เธตเธเธฃเนเธญเธกเธเธฑเธ': 'Live Music Performances Start Across All 3 Stages',
  'เธเธฒเธฃเนเธชเธ”เธ เนเธชเธ เธชเธต เน€เธชเธตเธขเธ Neon Light & Pyro Show': 'Special Neon Light & Pyrotechnics Spectacular',
  'เธเธฒเธฃเนเธชเธ”เธเนเธชเธเธชเธต Neon Lights & Pyro Show': 'Special Neon Lights & Pyro Show',
  'Headliner Stage โ€” เธงเธ Slot Machine เนเธชเธ”เธเธชเธ”': 'Headliner Stage โ€” Slot Machine Live Performance',
  'After Party DJ Set เนเธเธ Camping เธฅเธฒเธเธเธงเนเธฒเธ': 'After Party Electronic DJ Set at Camping Grounds',
  'After Party DJ Set เธ“ เนเธเธ Camping': 'After Party DJ Set at Starlight Camping Zone',
  'เธฃเนเธญเธเนเธเธงเธซเธเนเธฒเธเธญเธเนเธ—เธข เธเธฃเนเธญเธกเนเธเธงเนเน€เธ•เนเธกเธฃเธนเธเนเธเธ เนเธชเธ เธชเธต เน€เธชเธตเธขเธ เนเธฅเธฐเธงเธดเธเธงเธฅเธชเธธเธ”เธญเธฅเธฑเธเธเธฒเธฃเธเธดเธ”เธ—เนเธฒเธขเธเนเธณเธเธทเธ':
    'Thailandโ€s premier rock headliner delivering a full-scale arena production with immersive visuals and lasers.',
  'เธเธฅเธ”เธเธฅเนเธญเธขเธเธฅเธฑเธเธ”เธเธ•เธฃเธตเธชเธฐเธ—เนเธญเธเธชเธฑเธเธเธก เธเธฑเธเน€เธเธฅเธเธฎเธดเธ•เธ—เธตเนเนเธเธเน€เธเธฅเธเธ•เธฐเนเธเธเธฃเนเธญเธเธ•เธฒเธกเธเธฑเธเธชเธเธฑเนเธเธฅเธฒเธเธเธญเธเน€เธชเธดเธฃเนเธ•':
    'High-energy Thai rock anthems that unite the entire stadium in a massive sing-along.',
  'เธงเธเธเนเธญเธเธฃเนเธญเธเธเธงเธฑเธเนเธเธเธเธฃเธธเนเธเนเธซเธกเน เธฃเธงเธกเธ—เธธเธเธเธ—เน€เธเธฅเธเธญเธเธซเธฑเธเนเธฅเธฐเธเธฒเธงเธ”เนเธ”เธเธ•เธฃเธตเธชเธธเธ”เธเธถเนเธ':
    'Beloved modern pop-rock band performing chart-topping emotional anthems live.',
  'เน€เธเธฅเธเธฎเธดเธ•เธ•เธดเธ”เธซเธนเธฃเธฐเธ”เธฑเธเธฃเนเธญเธขเธฅเนเธฒเธเธงเธดเธง เธเธฑเธเธฅเธตเธฅเธฒเธเธฒเธฃเธฃเนเธญเธเธชเธฐเธเธ”เธญเธฒเธฃเธกเธ“เนเธชเธ”เน เธเธเน€เธงเธ—เธต':
    'Multi-million-stream alternative rock hits delivered with captivating live vocals.',
  'เธ—เนเธงเธเธ—เธณเธเธญเธเธ”เธฃเธตเธกเธเนเธญเธเธฅเธฐเธกเธธเธเนเธ เธเธงเธเน€เธเธฅเธดเนเธกเนเธเธเธฑเธเธเธฃเธฃเธขเธฒเธเธฒเธจเธเธฃเธฃเธกเธเธฒเธ•เธดเนเธ•เนเนเธชเธเธ”เธฒเธง':
    'Dreamy indie-pop melodies crafted for an enchanting outdoor night under the stars.',
  'เน€เธ”เธทเธญเธ”เธเธฅเนเธฒเธเธ–เธถเธเธเธตเธ”เธชเธธเธ”เธเธฑเธเนเธเธงเธ”เธเธ•เธฃเธตเธฎเธฒเธฃเนเธ”เธเธญเธฃเนเนเธฃเนเธเน€เธกเธ—เธฑเธฅ เธเธงเธเธกเธญเธเธเธดเธ•เธ•เธดเธ”เธเธญเธเน€เธงเธ—เธต':
    'Explosive rap-metal and nu-metal energy built for the front-row mosh pit.',
  'เธเธฑเธเธซเธงเธฐเธเธตเธ•เธฒเธฃเนเธกเธตเน€เธชเธเนเธซเน เน€เธกเนเธฅเธ”เธตเนเธเธงเธเนเธขเธเน€เธเธฒเน เนเธเธเนเธงเธเน€เธงเธฅเธฒเธเธฃเธฐเธญเธฒเธ—เธดเธ•เธขเนเธ•เธเธ”เธดเธ':
    'Vibrant indie-pop guitar grooves perfect for the golden sunset hour.',
  'เธญเธดเธเธ”เธตเนเธฃเนเธญเธเธเธฒเธเน€เธเธตเธขเธเนเธซเธกเน เธเธฒเธงเธ”เนเนเธเธเธตเน€เธ”เธฅเธดเธเน€เธเธเธฒเธฐเธ•เธฑเธงเธ—เธตเนเธซเธฒเธเธฑเธเธชเธ”เนเธ”เนเธขเธฒเธ':
    'Chiang Maiโ€s acclaimed indie-rock collective known for hypnotic psychedelic soundscapes.',
};

const PHRASE_REPLACEMENTS = [
  ['เน€เธ—เธจเธเธฒเธฅเธ”เธเธ•เธฃเธตเธฃเนเธญเธเนเธฅเธฐเธญเธดเธเธ”เธตเนเน€เธญเธฒเธ•เนเธ”เธญเธฃเนเธ—เธตเนเธขเธดเนเธเนเธซเธเนเธ—เธตเนเธชเธธเธ” เนเธชเธเธชเธตเธเธตเธญเธญเธเน€เธ•เนเธกเธเธดเธเธฑเธ” 3 เน€เธงเธ—เธต 15 เธจเธดเธฅเธเธดเธ เธเธฃเนเธญเธกเนเธเธเธเธฒเธเน€เธ•เนเธเธ—เนเธชเธฑเธกเธเธฑเธชเธเธฃเธฃเธกเธเธฒเธ•เธดเนเธฅเธฐเธญเธฒเธซเธฒเธฃเธชเธ•เธฃเธตเธ—เธเธนเนเธ”เธ•เธฅเธญเธ”เธเธทเธ',
   'The ultimate outdoor neon rock & indie music festival featuring 3 stages, 15 top artists, starlight camping grounds, and all-night street food.'],
  ['เนเธเธเธเธฑเธ•เธฃเธขเธทเธเธ•เธดเธ”เธเธญเธเน€เธงเธ—เธตเธซเธฅเธฑเธ เธชเธฑเธกเธเธฑเธชเธเธงเธฒเธกเน€เธ”เธทเธญเธ”เนเธเธเธเธดเธ”เธ•เธดเธ”เธจเธดเธฅเธเธดเธ เธเธฃเนเธญเธกเธเนเธญเธเธ—เธฒเธเธเธดเน€เธจเธฉ Fast Lane',
   'Front-row standing pit right against the main stage barrier with Fast Lane priority entry.'],
  ['เนเธเธเธเธฑเธ•เธฃเธขเธทเธเธเธถเนเธเธเธฅเธฒเธเธฅเธฒเธเธเธญเธเน€เธชเธดเธฃเนเธ• เธเธธเธ”เธฃเธฑเธเธเธฑเธเธฃเธฐเธเธเน€เธชเธตเธขเธเน€เธเธญเธฃเนเธฃเธฒเธงเธ”เนเธ—เธตเนเธ”เธตเธ—เธตเนเธชเธธเธ” เธเธฃเธฐเนเธ”เธ”เธกเธฑเธเธชเนเนเธ”เนเน€เธ•เนเธกเธ—เธตเน',
   'Central soundwave standing pit engineered for the best surround acoustics and high-energy crowd experience.'],
  ['เธญเธฑเธ’เธเธฑเธเธ—เธฃเนเธขเธเธฃเธฐเธ”เธฑเธเธกเธญเธเน€เธซเนเธเธ—เธฑเนเธ 3 เน€เธงเธ—เธตเนเธเธเธเธฒเนเธเธฃเธฒเธกเธฒ เธกเธตเน€เธเนเธฒเธญเธตเนเนเธฅเธฐเนเธ–เธงเธ—เธตเนเธเธฑเนเธเธชเนเธงเธเธ•เธฑเธง เธเธฃเนเธญเธกเธเธฒเธฃเนเนเธขเธเน€เธเธเธฒเธฐเนเธเธ',
   'Elevated VIP grandstand with reserved seating, panoramic views of all stages, and an exclusive lounge bar.'],
  ['เธเธทเนเธเธ—เธตเนเธเธฒเธเน€เธ•เนเธเธ—เนเนเธ•เนเนเธชเธเธ”เธฒเธง เธฃเธงเธกเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธเธฒเธเธ—เธฑเนเธ 2 เธงเธฑเธ เธซเนเธญเธเธญเธฒเธเธเนเธณเนเธฅเธฐเธเธธเธ”เธเธฒเธฃเนเธเนเธเธ•เธฅเธญเธ” 24 เธเธก.',
   'Starlight camping grounds including a 2-day festival pass, 24-hour showers, and charging stations.'],
  ['เธเธญเธเน€เธชเธดเธฃเนเธ•เนเธเธเธฃเธธเธเน€เธ—เธเธฏ เธงเธฑเธเธ—เธตเน', 'Live concert in Bangkok on'],
  ['เธเธญเธเน€เธชเธดเธฃเนเธ•เธงเธฑเธเธ—เธตเน', 'Official live concert on'],
  ['เธฃเธญเธเธเธฒเธฃเนเธชเธ”เธเธงเธฑเธเธ—เธตเน', 'Show dates:'],
  ['เธฃเธญเธเธเธฒเธฃเนเธชเธ”เธ', 'Show dates:'],
  ['เธเธฒเธเนเธชเธ”เธเธงเธฑเธเธ—เธตเน', 'Live event on'],
  ['เน€เธ—เธจเธเธฒเธฅเธ”เธเธ•เธฃเธตเนเธฅเธฐเธจเธดเธฅเธเธฐเธงเธฑเธเธ—เธตเน', 'Music & arts festival on'],
  ['เน€เธ—เธจเธเธฒเธฅเธ”เธเธ•เธฃเธตเธงเธฑเธเธ—เธตเน', 'Music festival on'],
  ['เธ•เธฒเธกเธฃเธฒเธขเธเธฒเธฃเธเธฒเธเนเธชเธ”เธเธเธญเธ ThaiTicketMajor', 'as listed on ThaiTicketMajor'],
  ['เธ•เธฒเธกเธเธฃเธฐเธเธฒเธจ ThaiTicketMajor', 'per official ThaiTicketMajor announcement'],
  ['เธเนเธญเธกเธนเธฅเธเธฑเธ•เธฃเนเธฅเธฐเธเธฒเธฃเธเธทเนเธญ:', 'Official ticket info:'],
  ['เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธ”เธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธเธฒเธ ThaiTicketMajor', 'Live synced from ThaiTicketMajor'],
  ['เธ”เธถเธเธชเธ”เธเธฒเธ ThaiTicketMajor', 'Live from ThaiTicketMajor'],
  ['เธเธฑเธ•เธฃเธขเธทเธเธ—เธฑเนเธงเนเธ', 'General Standing'],
  ['เธเธฑเธ•เธฃเธเธฑเนเธ VIP', 'VIP Seated'],
  ['เน€เธงเธ—เธตเธซเธฅเธฑเธ', 'Main Stage'],
  ['เน€เธงเธ—เธตเธญเธดเธเธ”เธตเนเธเธดเธเธเน', 'Indie Synth Stage'],
  ['เน€เธงเธ—เธตเธญเธฐเธเธนเธชเธ•เธดเธ & เธ”เธฃเธตเธกเธเนเธญเธ', 'Acoustic & Dream Pop Stage'],
  ['เน€เธชเธฒเธฃเน 28 เธ.เธข. 2026', 'Sat, 28 Nov 2026'],
  ['เธญเธฒเธ—เธดเธ•เธขเน 29 เธ.เธข. 2026', 'Sun, 29 Nov 2026'],
  ['เธ•เธธเธฅเธฒเธเธก 2569', 'October 2026'],
  ['เธเธคเธจเธเธดเธเธฒเธขเธ 2569', 'November 2026'],
  ['เธเธฑเธเธงเธฒเธเธก 2569', 'December 2026'],
  ['เธกเธเธฃเธฒเธเธก 2570', 'January 2027'],
  ['เธเธธเธกเธ เธฒเธเธฑเธเธเน 2570', 'February 2027'],
  ['เธกเธตเธเธฒเธเธก 2570', 'March 2027'],
  ['เธ.', 'hrs'],
];

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
    } catch {}
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === 'th' ? 'en' : 'th'));
  const t = (thText, enText) => (lang === 'en' ? enText : thText);

  const trData = (rawText) => {
    if (!rawText || typeof rawText !== 'string' || lang !== 'en') return rawText;
    const trimmed = rawText.trim();
    if (EXACT_DATA_MAP[trimmed]) return EXACT_DATA_MAP[trimmed];
    let out = rawText;
    for (const [th, en] of PHRASE_REPLACEMENTS) {
      if (out.includes(th)) {
        out = out.split(th).join(en);
      }
    }
    return out;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, trData }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
