import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = {
  Shop: ['Best Sellers', 'New Arrivals', 'Skincare', 'Serums', 'Moisturisers', 'SPF'],
  Help: ['FAQs', 'Shipping & Returns', 'Track Order', 'Contact Us'],
  Company: ['About Us', 'Blog', 'Sustainability', 'Careers'],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/80 pt-16 pb-8 mt-20">
      <div className="max-w-site mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-display text-3xl font-semibold text-ivory tracking-tight">Lumière</span>
            <p className="mt-4 text-sm leading-relaxed text-ivory/60 max-w-xs">
              Premium skincare rooted in science. Crafted for every skin concern.
            </p>
            <div className="flex gap-4 mt-6">
              {['IG', 'X', 'FB', 'YT'].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[11px] font-semibold text-ivory/50 hover:border-accent hover:text-accent transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-body font-semibold text-xs tracking-[0.18em] uppercase text-accent mb-5">
                {title}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <Link to="#" className="text-sm text-ivory/60 hover:text-ivory transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-10 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="font-display italic text-lg text-ivory/80">
              Get exclusive offers & skincare tips
            </p>
            <div className="flex w-full md:w-auto gap-0">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-64 bg-white/10 border border-white/20 text-ivory placeholder:text-ivory/40
                           text-sm px-4 py-2.5 rounded-l-pill focus:outline-none focus:border-accent transition-colors"
              />
              <button className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-5 py-2.5 rounded-r-pill transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ivory/40">
          <p>© {new Date().getFullYear()} Lumière. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="#" className="hover:text-ivory/70 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-ivory/70 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
