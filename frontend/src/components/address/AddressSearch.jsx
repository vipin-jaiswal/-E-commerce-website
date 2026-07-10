import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { searchAddress } from '../../utils/geocoding';

export default function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchAddress(query);
        setResults(items);
        setOpen(items.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onSelect(item);
    setQuery(item.label);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for area, street, landmark…"
          autoComplete="off"
          className="w-full rounded-xl border border-gray-300 p-4 pl-11 pr-10 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {results.map((item, idx) => (
            <button
              type="button"
              key={`${item.latitude}-${item.longitude}-${idx}`}
              onClick={() => handleSelect(item)}
              className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-pink-50"
            >
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-pink-500" />
              <span className="text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
