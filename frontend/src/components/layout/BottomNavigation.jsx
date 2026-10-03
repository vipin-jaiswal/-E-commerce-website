import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, UserRound, Heart } from 'lucide-react';

const NAV = [
  { icon: Home,        label: 'Home',    href: '/' },
  { icon: Search,      label: 'Search',  href: '/products' },
  { icon: Heart,       label: 'Wishlist',href: '/wishlist' },
    { icon: UserRound,   label: 'Account', href: '/account' },
];

export default function BottomNavigation() {
  const { pathname } = useLocation();
  const navItems = NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-[#2A2A2A]/70 dark:bg-[#0F0F0F]/70 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors
                ${active ? 'text-accent' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}
            >
              <Icon size={21} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
