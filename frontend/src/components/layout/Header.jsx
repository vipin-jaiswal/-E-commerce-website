import React, { useState } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { Link } from "react-router-dom";

import SearchBar from "../common/SearchBar";
import { useCart } from "../../hooks/useCart";
import { useTheme } from "../../context/ThemeContext";

const NAV_LINKS = [
  { label: "Shop", href: "/#shop-by-category" },
  { label: "Best Sellers", href: "/#best-sellers" },
  { label: "Skin Care", href: "/#skin-care" },
  { label: "Hair Care", href: "/#hair-care" },
  { label: "Makeup", href: "/#makeup" },
  { label: "Offers", href: "/#shop-by-concern" },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-2">
        <div className="
          max-w-[1500px]
          mx-auto
          bg-white/80 dark:bg-slate-900/80
          backdrop-blur-xl
          border border-slate-200 dark:border-white/10
          rounded-2xl
          shadow-lg
          px-5
          h-16
          flex
          items-center
          justify-between
        ">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button className="lg:hidden">
              <Menu size={24} />
            </button>

            <Link
              to="/"
              className="
                text-2xl
                font-bold
                text-pink-600 dark:text-pink-400
                hover:text-pink-500 dark:hover:text-pink-300
                transition
              "
            >
              Glowify
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-medium">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="
                  text-slate-700 dark:text-slate-200
                  hover:text-pink-500 dark:hover:text-pink-300
                  transition
                  duration-300
                "
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="
                inline-flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                text-slate-700
                hover:border-pink-500
                hover:text-pink-500
                dark:border-white/10
                dark:text-slate-200
                dark:hover:border-pink-400
                dark:hover:text-pink-300
              "
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="
                text-slate-700 dark:text-slate-200
                hover:text-pink-500 dark:hover:text-pink-300
                transition
                duration-300
              "
            >
              <Search size={22} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="
                text-slate-700 dark:text-slate-200
                hover:text-pink-500 dark:hover:text-pink-300
                transition
                duration-300
              "
            >
              <Heart size={22} />
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
              className="
                text-slate-700 dark:text-slate-200
                hover:text-pink-500 dark:hover:text-pink-300
                transition
                duration-300
              "
            >
              <User size={22} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="
                relative
                text-slate-700 dark:text-slate-200
                hover:text-pink-500 dark:hover:text-pink-300
                transition
                duration-300
              "
            >
              <ShoppingCart size={22} />

              {cartCount > 0 && (
                <span
                  className="
                    absolute
                    -top-2
                    -right-2
                    bg-pink-500
                    text-white
                    text-[10px]
                    font-semibold
                    min-w-[18px]
                    h-[18px]
                    px-1
                    rounded-full
                    flex
                    items-center
                    justify-center
                  "
                >
                  {cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchBar
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default Header;
