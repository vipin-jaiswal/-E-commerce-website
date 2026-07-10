import React, { useEffect, useRef, useState } from "react";
import { X, Search, ArrowRight, ChevronDown, Clock3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUGGESTIONS = [
  "Vitamin C Serum",
  "Sunscreen SPF 50",
  "Retinol Cream",
  "Hyaluronic Acid",
  "Niacinamide",
];

const RECENT_KEY = "dyva_recent_searches";

export default function SearchBar({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [showPopular, setShowPopular] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      setRecentSearches(saved ? JSON.parse(saved) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowPopular(true);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;

    const normalized = term.trim();
    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSearch = (q) => {
    const term = q || query;

    if (!term.trim()) return;

    saveRecentSearch(term);
    onClose();

    navigate(
      `/products?q=${encodeURIComponent(term.trim())}`
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">

      {/* Modal */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up dark:bg-slate-900">

        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-slate-700">
          <Search
            size={20}
            className="text-gray-400 flex-shrink-0 dark:text-slate-400"
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSearch()
            }
            placeholder="Search products, concerns, ingredients..."
            className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-accent transition duration-300 dark:text-slate-400"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowPopular((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-ivory px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-pink-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <Sparkles size={14} />
              Popular Searches
              <ChevronDown size={14} className={`transition-transform duration-300 ${showPopular ? "rotate-180" : ""}`} />
            </button>

            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted dark:text-slate-400">
              Previous search by user
            </p>
          </div>

          {showPopular && (
            <div className="mt-4 rounded-2xl border border-border bg-ivory p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex flex-wrap gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="
                      text-sm
                      px-4
                      py-2
                      rounded-full
                      bg-white
                      text-charcoal
                      border border-border
                      hover:bg-accent
                      hover:text-pink-400
                      hover:scale-105
                      hover:shadow-lg
                      transition-all
                      duration-300
                      dark:bg-slate-900
                      dark:text-slate-100
                      dark:border-slate-700
                    "
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock3 size={14} className="text-muted dark:text-slate-400" />
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 tracking-widest uppercase">
              Previous Search by User
            </p>
          </div>

          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-pink-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted dark:text-slate-400">
              Your previous searches will appear here.
            </p>
          )}
        </div>

        {/* Search Button */}
        {query && (
          <div className="px-5 pb-5">
            <button
              onClick={() => handleSearch()}
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-accent
                hover:gap-3
                hover:text-accent-dark
                transition-all
                duration-300
              "
            >
              Search for "{query}"
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
