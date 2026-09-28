import React, { useState } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  Menu,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import SearchBar from "../common/SearchBar";
import { useCart } from "../../hooks/useCart";
import MobileMenu from "./MobileMenu";
import { useTheme } from "../../context/ThemeContext";

const NAV_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Best Sellers", to: "/products?sort=best_seller" },
  { label: "Skin Care", to: "/products/category/skin-care" },
  { label: "Hair Care", to: "/products/category/hair-care" },
  { label: "Makeup", to: "/products/category/makeup" },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navLinks = NAV_LINKS;
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const handleNavClick = (event, href) => {
    if (href.startsWith("/#")) {
      event.preventDefault();
      const id = href.slice(2);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-2">
        <div
          className="
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
        "
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="
                text-2xl
                font-bold
                text-black dark:text-gray-700
                hover:text-gray-700 dark:hover:text-gray-200
                transition
              "
            >
              DYVA
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-medium">
            {navLinks.map((link) =>
              link.to ? (
                <Link key={link.label} to={link.to} className="text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-gray-400 transition duration-300">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-gray-400 transition duration-300">
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
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
                hover:border-black
                hover:text-black
                dark:border-white/10
                dark:text-slate-200
                dark:hover:border-gray-700
                dark:hover:text-gray-400
              "
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Search */}
            <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="
                  hidden lg:flex
                  text-slate-700 dark:text-slate-200
                  hover:text-black dark:hover:text-gray-400
                  transition
                  duration-300
                  flex items-center gap-2
                "
              >
                <Search size={22} />
                <span className="hidden">Search</span>
            </button>

            {/* Wishlist */}
            <Link
                to={isLoggedIn ? "/account" : "/login"}
                aria-label="Account"
                className="hidden lg:flex text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-gray-400 transition duration-300"
              >
                <UserRound size={22} />
            </Link>

            <Link
                to="/wishlist"
                className="
                  hidden lg:flex
                  text-slate-700 dark:text-slate-200
                  hover:text-black dark:hover:text-gray-400
                  transition
                  duration-300
                  flex items-center gap-2
                "
              >
                <Heart size={22} />
                <span className="hidden">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
                to="/cart"
                className="
                  relative
                  text-slate-700 dark:text-slate-200
                  hover:text-black dark:hover:text-gray-400
                  transition
                  duration-300
                  flex items-center gap-2
                "
              >
                <ShoppingCart size={22} />
                <span className="hidden">Cart</span>

                {cartCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-2
                      -right-2
                      bg-black
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

            <button
              type="button"
              className="inline-flex lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
};

export default Header;
