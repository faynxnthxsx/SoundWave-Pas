import React, { useEffect, useState } from 'react';
import { ChevronDown, LoaderCircle, MapPin, Search } from 'lucide-react';
import { THAILAND_PROVINCES } from '../data/thailandProvinces';

const THAILAND_BOUNDS = '97.3,5.6,105.7,20.5';

export default function LocationPicker({ province, venue, location, latitude, longitude, onProvinceChange, onVenueChange, onLocationSelect }) {
  const [query, setQuery] = useState(venue || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearch, setHasSearch] = useState(false);
  const [provinceQuery, setProvinceQuery] = useState(province || '');
  const [provinceOpen, setProvinceOpen] = useState(false);

  useEffect(() => { setQuery(venue || ''); }, [venue]);
  useEffect(() => { setProvinceQuery(province || ''); }, [province]);

  const provinceMatches = provinceQuery.trim()
    ? THAILAND_PROVINCES.filter((name) => name.includes(provinceQuery.trim()))
    : THAILAND_PROVINCES;
  const chooseProvince = (value) => {
    onProvinceChange(value);
    onVenueChange('');
    setQuery('');
    setResults([]);
    setProvinceQuery(value);
    setProvinceOpen(false);
    onLocationSelect({ location: value ? `${value}, ประเทศไทย` : '', latitude: null, longitude: null });
  };

  useEffect(() => {
    if (query.trim().length < 3 || !province) {
      setResults([]);
      setHasSearch(false);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: `${query.trim()}, ${province}, Thailand` });
        const response = await fetch(`/api/locations/search?${params}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ค้นหาสถานที่ไม่สำเร็จ');
        if (active) {
          setResults(data.data || []);
          setHasSearch(true);
        }
      } catch {
        if (active) { setResults([]); setHasSearch(true); }
      } finally {
        if (active) setSearching(false);
      }
    }, 850);
    return () => { active = false; clearTimeout(timer); };
  }, [query, province]);

  const choose = (place) => {
    const name = place.name || place.displayName.split(',')[0];
    onVenueChange(name);
    onLocationSelect({ location: place.displayName, latitude: place.latitude, longitude: place.longitude });
    setQuery(name);
    setResults([]);
    setHasSearch(false);
  };

  const chooseTyped = () => {
    onVenueChange(query.trim());
    onLocationSelect({ location: [query.trim(), province, 'ประเทศไทย'].filter(Boolean).join(', '), latitude: null, longitude: null });
    setResults([]);
    setHasSearch(false);
  };

  const marker = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && latitude !== null && longitude !== null;
  const bbox = marker
    ? `${Number(longitude) - 0.035},${Number(latitude) - 0.022},${Number(longitude) + 0.035},${Number(latitude) + 0.022}`
    : THAILAND_BOUNDS;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker ? `&marker=${latitude},${longitude}` : ''}`;

  return (
    <div className="space-y-4">
      <div className="relative"><label className="block space-y-1.5"><span className="text-xs font-medium text-gray-300">จังหวัด</span><span className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input required pattern={THAILAND_PROVINCES.join('|')} title="เลือกจังหวัดจากรายการ 77 จังหวัด" autoComplete="off" role="combobox" aria-expanded={provinceOpen} aria-controls="thailand-province-options" aria-autocomplete="list" value={provinceQuery} onFocus={() => setProvinceOpen(true)} onBlur={() => setTimeout(() => { if (THAILAND_PROVINCES.includes(provinceQuery)) chooseProvince(provinceQuery); else setProvinceOpen(false); }, 120)} onChange={(event) => { setProvinceQuery(event.target.value); onProvinceChange(''); onLocationSelect({ location: '', latitude: null, longitude: null }); setProvinceOpen(true); }} onKeyDown={(event) => { if (event.key === 'Escape') setProvinceOpen(false); if (event.key === 'Enter' && provinceMatches.length === 1) { event.preventDefault(); chooseProvince(provinceMatches[0]); } }} className={`${controlClass} pl-9 pr-10`} placeholder="พิมพ์ค้นหา หรือเลือกจังหวัด" /><ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" /></span></label>{provinceOpen && <div id="thailand-province-options" role="listbox" className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-white/15 bg-[#171721] p-1 shadow-2xl">{provinceMatches.length ? provinceMatches.map((name) => <button key={name} type="button" role="option" aria-selected={province === name} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseProvince(name)} className={`block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10 ${province === name ? 'bg-cyan-200/10 text-cyan-100' : 'text-gray-200'}`}>{name}</button>) : <p className="px-3 py-2 text-xs text-gray-500">ไม่พบจังหวัดนี้</p>}</div>}<p className="mt-1 text-[10px] text-gray-500">พิมพ์ค้นหาหรือกดช่องเพื่อเลือกจาก 77 จังหวัด</p></div>

      <div className="relative">
        <label className="block space-y-1.5"><span className="text-xs font-medium text-gray-300">สถานที่จัดงาน</span><span className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input required value={query} onChange={(event) => { setQuery(event.target.value); onVenueChange(event.target.value); onLocationSelect({ location: [event.target.value, province, 'ประเทศไทย'].filter(Boolean).join(', '), latitude: null, longitude: null }); }} className={`${controlClass} pl-9 pr-10`} placeholder={province ? `พิมพ์ชื่อสถานที่ใน${province}` : 'เลือกจังหวัดก่อน แล้วพิมพ์ชื่อสถานที่'} /><span className="absolute right-3 top-1/2 -translate-y-1/2">{searching && <LoaderCircle size={15} className="animate-spin text-cyan-200" />}</span></span></label>
        {results.length > 0 && <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-white/15 bg-[#171721] p-1 shadow-2xl">{results.map((place) => <button key={place.id} type="button" onClick={() => choose(place)} className="flex w-full gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-white/10"><MapPin size={14} className="mt-0.5 shrink-0 text-cyan-200" /><span><span className="block text-xs font-semibold text-white">{place.name || place.displayName.split(',')[0]}</span><span className="mt-0.5 block text-[10px] leading-relaxed text-gray-400">{place.displayName}</span></span></button>)}</div>}
        {hasSearch && results.length === 0 && query.trim().length >= 3 && <div className="absolute z-30 mt-1 w-full rounded-xl border border-white/10 bg-[#171721] p-3 shadow-xl"><p className="text-[10px] text-gray-400">ไม่พบสถานที่ตรงคำค้น คุณยังใช้ชื่อที่พิมพ์ได้</p><button type="button" onClick={chooseTyped} className="mt-2 text-xs font-bold text-cyan-200 hover:text-white">ใช้ “{query}” ใน {province}</button></div>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111119]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-300"><MapPin size={13} className="text-cyan-200" />{venue || province || 'แผนที่ประเทศไทย'}</span><span className="text-[9px] text-gray-600">OpenStreetMap</span></div>
        <iframe title="แผนที่ประเทศไทยและสถานที่จัดงาน" src={mapUrl} className="h-48 w-full border-0 opacity-90" loading="lazy" />
        <p className="px-3 py-2 text-[9px] text-gray-500">© OpenStreetMap contributors{location ? ` · ${location}` : ''}</p>
      </div>
    </div>
  );
}

const controlClass = 'w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-cyan-300/60';
