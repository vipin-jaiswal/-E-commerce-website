import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { icon: Home,        label: 'Home',    href: '/' },
  { icon: Search,      label: 'Search',  href: '/products' },
  { icon: ShoppingBag, label: 'Cart',    href: '/cart' },
  { icon: Heart,       label: 'Wishlist',href: '/wishlist' },
  { icon: User,        label: 'Account', href: '/profile' },
];

export default function BottomNavigation() {
  const { pathname } = useLocation();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const navItems = user?.isAdmin
    ? NAV.filter((item) => !['Search', 'Cart', 'Wishlist'].includes(item.label))
    : NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 lg:hidden">
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
              {label === 'Cart' && cartCount > 0 && (
                <span className="absolute top-0 right-1.5 w-4 h-4 bg-charcoal text-ivory dark:bg-pink-500 dark:text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
