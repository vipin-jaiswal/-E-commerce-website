import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, ShoppingBag, User, Camera } from 'lucide-react';

export default function MobileMenu({ open, onClose, links, isAdmin = false }) {
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
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-smooth ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link to="/" onClick={onClose} className="font-display text-xl font-semibold text-charcoal">DYVA</Link>
          <button onClick={onClose} aria-label="Close menu" className="p-1 text-muted hover:text-charcoal">
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
                className="block py-3 text-sm font-medium text-charcoal border-b border-gray-200/50 hover:text-pink-500 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block py-3 text-sm font-medium text-charcoal border-b border-gray-200/50 hover:text-pink-500 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <Link to="/face-scan" onClick={onClose} className="flex items-center gap-3 py-3 text-sm font-medium text-charcoal border-b border-gray-200/50 hover:text-pink-500 transition-colors">
            <Camera size={18} />
            <span>AI Face Scan</span>
          </Link>
        </nav>

        {/* Bottom actions */}
        <div className="px-6 py-5 border-t border-border flex gap-4">
          <Link to="/profile" onClick={onClose} className="flex items-center gap-2 text-sm text-muted hover:text-charcoal transition-colors">
            <User size={18} /> Account
          </Link>
          {!isAdmin && (
            <>
              <Link to="/wishlist" onClick={onClose} className="flex items-center gap-2 text-sm text-muted hover:text-charcoal transition-colors">
                <Heart size={18} /> Wishlist
              </Link>
              <Link to="/cart" onClick={onClose} className="flex items-center gap-2 text-sm text-muted hover:text-charcoal transition-colors">
                <ShoppingBag size={18} /> Cart
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
