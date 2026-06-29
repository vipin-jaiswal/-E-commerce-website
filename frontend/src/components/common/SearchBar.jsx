import React, { useEffect, useRef, useState } from "react";
import { X, Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUGGESTIONS = [
  "Vitamin C Serum",
  "Sunscreen SPF 50",
  "Retinol Cream",
  "Hyaluronic Acid",
  "Niacinamide",
];

export default function SearchBar({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

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
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSearch = (q) => {
    const term = q || query;

    if (!term.trim()) return;

    onClose();

    navigate(
      `/products?q=${encodeURIComponent(term.trim())}`
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">

      {/* Modal */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <Search
            size={20}
            className="text-gray-400 flex-shrink-0"
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSearch()
            }
            placeholder="Search products, concerns, ingredients..."
            className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-pink-500 transition duration-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* Suggestions */}
        <div className="px-5 py-5">
          <p className="text-xs font-semibold text-gray-500 tracking-widest uppercase mb-4">
            Popular Searches
          </p>

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
                  bg-gray-100
                  text-gray-700
                  hover:bg-pink-500
                  hover:text-white
                  hover:scale-105
                  hover:shadow-lg
                  transition-all
                  duration-300
                "
              >
                {s}
              </button>
            ))}
          </div>
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
                text-pink-500
                hover:gap-3
                hover:text-pink-600
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