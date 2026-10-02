import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, UserRound } from 'lucide-react';

export default function MobileMenu({ open, onClose, links }) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleNavClick = (event, href) => {
    if (href.startsWith('/#')) {
      event.preventDefault();
      onClose();

      // Wait for menu to close before scrolling to avoid jank
      setTimeout(() => {
        const id = href.slice(2);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // Corresponds to the transition duration
    }
  };
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-auto max-h-screen w-[18rem] max-w-[calc(100vw-1rem)] overflow-y-auto bg-white/70 text-charcoal shadow-xl backdrop-blur-xl flex flex-col transition-transform duration-300 ease-smooth dark:bg-[#151015]/70 dark:text-white ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link to="/" onClick={onClose} className="font-display text-xl font-semibold text-charcoal dark:text-white">DYVA</Link>
          <button onClick={onClose} aria-label="Close menu" className="p-1 text-muted transition-colors hover:text-primary dark:hover:text-pink-300">
            <X size={22} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-6 space-y-1">
          {links.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                onClick={onClose}
                className="block border-b border-gray-200/70 py-3 text-sm font-medium text-charcoal transition-colors hover:text-primary dark:border-white/10 dark:text-gray-100 dark:hover:text-pink-300"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block border-b border-gray-200/70 py-3 text-sm font-medium text-charcoal transition-colors hover:text-primary dark:border-white/10 dark:text-gray-100 dark:hover:text-pink-300"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        {/* Bottom actions
        <div className="border-t border-border px-6 py-5">
          <Link to={localStorage.getItem('token') ? '/account' : '/login'} onClick={onClose} className="mb-4 flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary dark:hover:text-pink-300">
            <UserRound size={18} /> {localStorage.getItem('token') ? 'My account' : 'Sign in'}
          </Link>
          <Link to="/cart" onClick={onClose} className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary dark:hover:text-pink-300">
            <ShoppingBag size={18} /> Cart
          </Link>
        </div> */}
      </aside>
    </>
  );
}
