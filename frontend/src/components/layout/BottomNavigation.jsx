import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  UserRound,
  Heart,
  Package,
} from "lucide-react";

import { useSearchOverlay } from "../../context/SearchOverlayContext";

const NAV = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: Package,
    label: "Orders",
    href: "/orders",
  },
  {
    icon: Heart,
    label: "Wishlist",
    href: "/wishlist",
  },
  {
    icon: UserRound,
    label: "Account",
    href: "/account",
  },
];

export default function BottomNavigation() {
  const { pathname } = useLocation();

  const {
    openSearch,
  } = useSearchOverlay();

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-40
        border-t
        border-slate-200/70
        bg-white/70
        backdrop-blur-xl
        dark:border-[#2A2A2A]/70
        dark:bg-[#0F0F0F]/70
        lg:hidden
      "
    >
      <div
        className="
          flex
          items-center
          justify-around
          h-16
          px-2
          pb-3
        "
      >
        {NAV.map(
          ({
            icon: Icon,
            label,
            href,
          }) => {
            /* =========================================
               SEARCH BUTTON
               Uses the SAME search context as Header
            ========================================= */
            if (label === "Search") {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={openSearch}
                  aria-label="Open search"
                  className="
                    relative
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-0.5
                    py-1
                    px-3
                    rounded-xl
                    transition-colors
                    text-slate-500
                    hover:text-slate-900
                    dark:text-slate-400
                    dark:hover:text-slate-100
                  "
                >
                  <Icon
                    size={21}
                    strokeWidth={1.5}
                  />

                  <span className="text-[10px] font-medium">
                    Search
                  </span>
                </button>
              );
            }

            /* =========================================
               NORMAL NAVIGATION ITEMS
            ========================================= */

            const active =
              pathname === href ||
              (href !== "/" &&
                pathname.startsWith(href));

            return (
              <Link
                key={label}
                to={href}
                aria-label={label}
                className={`
                  relative
                  flex
                  flex-col
                  items-center
                  justify-center
                  gap-0.5
                  py-1
                  px-3
                  rounded-xl
                  transition-colors

                  ${
                    active
                      ? "text-accent"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  }
                `}
              >
                <Icon
                  size={21}
                  strokeWidth={
                    active ? 2 : 1.5
                  }
                />

                <span className="text-[10px] font-medium">
                  {label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}
