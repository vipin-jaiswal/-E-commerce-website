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
import { useSearchOverlay } from "../../context/SearchOverlayContext";

const NAV_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Hair Care", to: "/products/category/hair-care" },
  { label: "Skin Care", to: "/products/category/skin-care" },
  { label: "Makeup", to: "/products/category/makeup" },
  { label: "Best Sellers", to: "/products?sort=best_seller" },
];

const Header = () => {
  const {
    openSearch,
    searchOpen,
    closeSearch,
  } = useSearchOverlay();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const handleNavClick = (event, href) => {
    if (!href) return;

    if (href.startsWith("/#")) {
      event.preventDefault();

      const id = href.slice(2);
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-4 py-2 pt-1.5 lg:pt-2">
        <div
          className="
            max-w-[1500px]
            mx-auto
            bg-transparent
            dark:bg-transparent
            backdrop-blur-xl
            border
            border-gray-200
            dark:border-[#2A2A2A]
            rounded-2xl
            shadow-md
            px-5
            h-12
            lg:h-16
            flex
            items-center
            justify-between
          "
        >
          {/* ================= LEFT / LOGO ================= */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-2xl font-bold transition"
            >
              <span className="text-gray-900 dark:text-white">
                DY
              </span>
              <span className="text-primary">
                VA
              </span>
            </Link>
          </div>

          {/* ================= DESKTOP NAVIGATION ================= */}
          <nav className="hidden lg:flex items-center gap-8 font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={(event) =>
                  handleNavClick(event, link.to)
                }
                className="
                  rounded-lg
                  px-3
                  py-2
                  text-slate-700
                  dark:text-slate-200
                  hover:-translate-y-1
                  hover:shadow-lg
                  hover:text-[#d93b7f]
                  dark:hover:text-[#ec5895]
                  transition-all
                  duration-300
                "
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ================= RIGHT SECTION ================= */}
          <div className="flex items-center gap-4">

            {/* Theme */}
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
                hover:border-primary
                hover:text-primary
                dark:border-white/10
                dark:text-slate-200
                dark:hover:border-primary
                dark:hover:text-primary
                transition
                duration-200
              "
            >
              {theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {/* ================= SEARCH ================= */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Open search"
              className="
                inline-flex
                lg:flex
                items-center
                gap-2
                text-slate-700
                dark:text-slate-200
                hover:text-primary
                dark:hover:text-primary
                transition
                duration-300
              "
            >
              <Search size={22} />
            </button>

            {/* ================= ACCOUNT ================= */}
            <Link
              to={isLoggedIn ? "/account" : "/login"}
              aria-label="Account"
              className="
                hidden
                lg:flex
                text-slate-700
                dark:text-slate-200
                hover:text-primary
                dark:hover:text-primary
                transition
                duration-200
              "
            >
              <UserRound size={22} />
            </Link>

            {/* ================= WISHLIST ================= */}
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="
                hidden
                lg:flex
                text-slate-700
                dark:text-slate-200
                hover:text-primary
                dark:hover:text-primary
                transition
                duration-300
              "
            >
              <Heart size={22} />
            </Link>

            {/* ================= CART ================= */}
            <Link
              to="/cart"
              aria-label="Cart"
              className="
                relative
                text-slate-700
                dark:text-slate-200
                hover:text-primary
                dark:hover:text-primary
                transition
                duration-300
                flex
                items-center
              "
            >
              <ShoppingCart size={22} />

              {cartCount > 0 && (
                <span
                  className="
                    absolute
                    -top-2
                    -right-2
                    bg-primary
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

            {/* ================= MOBILE MENU ================= */}
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

      {/* ================= SHARED SEARCH BAR ================= */}
      <SearchBar
        open={searchOpen}
        onClose={closeSearch}
      />

      {/* ================= MOBILE MENU ================= */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
};

export default Header;