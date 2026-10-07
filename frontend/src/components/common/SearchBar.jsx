import React, { useEffect, useRef, useState } from "react";
import { X, Search, ArrowRight, ChevronDown, Clock3, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUGGESTIONS = [
  "Hair color",
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
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/55 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8">

      {/* Modal */}
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl animate-fade-in-up dark:border-white/10 dark:bg-slate-900">

        {/* Search Input */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-slate-700 sm:px-5 sm:py-4"
        >
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
            aria-label="Search products, concerns, and ingredients"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white">
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel search"
            className="inline-flex items-center gap-1 rounded-full p-2 text-sm font-medium text-gray-500 transition hover:bg-primary-soft hover:text-primary dark:text-slate-400 dark:hover:bg-primary/10"
          >
            <X size={22} />
            <span>Cancel</span>
          </button>
        </form>

        <div className="px-4 pt-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowPopular((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white dark:border-primary/30 dark:bg-primary/10 dark:text-pink-200"
            >
              <Sparkles size={14} />
              Popular Searches
              <ChevronDown size={14} className={`transition-transform duration-300 ${showPopular ? "rotate-180" : ""}`} />
            </button>

            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted dark:text-slate-400">
              Quick ideas
            </p>
          </div>

          {showPopular && (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-soft/60 p-3 dark:border-primary/20 dark:bg-primary/5 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="
                      text-sm
                      px-3
                      py-2
                      rounded-full
                      bg-white
                      text-charcoal
                      border border-primary/15
                      hover:border-primary
                      hover:bg-primary
                      hover:text-white
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

        <div className="px-4 py-5 sm:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock3 size={14} className="text-muted dark:text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400">
                Recent searches
              </p>
            </div>
            {recentSearches.length > 0 && (
              <button type="button" onClick={() => { setRecentSearches([]); localStorage.removeItem(RECENT_KEY); }} className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-primary dark:text-slate-400">
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className="rounded-full border border-primary/20 bg-white px-4 py-2 text-sm text-charcoal transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-white dark:border-primary/20 dark:bg-slate-900 dark:text-slate-100"
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
        <div className="border-t border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={!query.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search size={16} />
            {query.trim() ? `Search for “${query.trim()}”` : "Enter a search to continue"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
