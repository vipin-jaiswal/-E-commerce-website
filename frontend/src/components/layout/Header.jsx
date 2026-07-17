import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  Moon,
  Sun,
  Camera,
  ImageIcon,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import SearchBar from "../common/SearchBar";
import { useCart } from "../../hooks/useCart";
import MobileMenu from "./MobileMenu";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

const NAV_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "Best Sellers", to: "/products?sort=best_seller" },
  { label: "Skin Care", to: "/products/category/skin-care" },
  { label: "Hair Care", to: "/products/category/hair-care" },
  { label: "Makeup", to: "/products/category/makeup" },
  { label: "Ai Doctor", isAiDoctor: true },
];

const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faceScanMenuOpen, setFaceScanMenuOpen] = useState(false);

  const faceScanMenuRef = useRef(null);
  const navigate = useNavigate();

  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const navLinks = isAdmin
    ? NAV_LINKS.concat({ label: "Admin", to: "/admin" })
    : NAV_LINKS;

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

  // Close the face-scan popup when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        faceScanMenuRef.current &&
        !faceScanMenuRef.current.contains(event.target)
      ) {
        setFaceScanMenuOpen(false);
      }
    };

    if (faceScanMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [faceScanMenuOpen]);

  const goToFaceScan = (mode) => {
    setFaceScanMenuOpen(false);
    navigate("/face-scan", { state: { mode } });
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
                text-pink-600 dark:text-pink-400
                hover:text-pink-400 dark:hover:text-pink-200
                transition
              "
            >
              DYVA
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 font-medium">
            {navLinks.map((link) =>
              link.isAiDoctor ? (
                <div className="relative" ref={faceScanMenuRef} key={link.label}>
                  <button
                    type="button"
                    onClick={() => setFaceScanMenuOpen((prev) => !prev)}
                    className="
                      text-slate-700 dark:text-slate-200
                      hover:text-pink-500 dark:hover:text-pink-300
                      transition
                      duration-300
                      flex items-center gap-1
                    "
                    aria-haspopup="true"
                    aria-expanded={faceScanMenuOpen}
                  >
                    {link.label}
                  </button>

                  {faceScanMenuOpen && (
                    <div
                      className="
                        absolute
                        left-1/2 -translate-x-1/2
                        mt-3
                        w-52
                        bg-white dark:bg-slate-800
                        border border-slate-200 dark:border-white/10
                        rounded-xl
                        shadow-xl
                        overflow-hidden
                        z-50
                      "
                    >
                      <button
                        type="button"
                        onClick={() => goToFaceScan("camera")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-white/10 hover:text-pink-500 dark:hover:text-pink-300 transition"
                      >
                        <Camera size={18} />
                        Open Camera
                      </button>

                      <button
                        type="button"
                        onClick={() => goToFaceScan("upload")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-white/10 hover:text-pink-500 dark:hover:text-pink-300 transition border-t border-slate-100 dark:border-white/10"
                      >
                        <ImageIcon size={18} />
                        Upload Image
                      </button>
                    </div>
                  )}
                </div>
              ) : link.to ? (
                <Link key={link.label} to={link.to} className="text-slate-700 dark:text-slate-200 hover:text-pink-500 dark:hover:text-pink-300 transition duration-300">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-slate-700 dark:text-slate-200 hover:text-pink-500 dark:hover:text-pink-300 transition duration-300">
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
            {!isAdmin && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="
                  hidden lg:flex
                  text-slate-700 dark:text-slate-200
                  hover:text-pink-500 dark:hover:text-pink-300
                  transition
                  duration-300
                  flex items-center gap-2
                "
              >
                <Search size={22} />
                <span className="hidden">Search</span>
              </button>
            )}

            {/* Wishlist */}
            {!isAdmin && (
              <Link
                to="/wishlist"
                className="
                  hidden lg:flex
                  text-slate-700 dark:text-slate-200
                  hover:text-pink-500 dark:hover:text-pink-300
                  transition
                  duration-300
                  flex items-center gap-2
                "
              >
                <Heart size={22} />
                <span className="hidden">Wishlist</span>
              </Link>
            )}

            {/* Profile */}
            <Link
              to="/profile"
              className="
                hidden lg:flex
                text-slate-700 dark:text-slate-200
                hover:text-pink-500 dark:hover:text-pink-300
                transition
                duration-300
                flex items-center gap-2
              "
            >
              <User size={22} />
              <span className="hidden">Profile</span>
            </Link>

            {/* Cart */}
            {!isAdmin && (
              <Link
                to="/cart"
                className="
                  relative
                  text-slate-700 dark:text-slate-200
                  hover:text-pink-500 dark:hover:text-pink-300
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
            )}

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
      {!isAdmin && (
        <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navLinks}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default Header;
