import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import TrackOrder from "../../pages/TrackOrder";

const FOOTER_LINKS = {
  Shop: [
    { label: "Best Sellers", href: "/products?sort=best_seller" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Hair Care", href: "/products/category/hair-care" },
    { label: "Skin Care", href: "/products/category/skin-care" },
    { label: "Makeup", href: "/products/category/makeup" },
  ],

  Help: [
    { label: "FAQs", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Track Order", href: "/track-order" },
    { label: "Contact Us", href: "/contact" },
  ],

  Company: [
    { label: "About Us", href: "/about" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export default function Footer() {
  const [trackingOpen, setTrackingOpen] = useState(false);

  return (
    <footer className="mt-0 bg-gray-50 text-gray-600 dark:bg-[#0F0F0F] dark:text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Top Section */}
        <div className="flex flex-col gap-10 lg:flex-row">

          {/* Brand */}
          <div className="lg:w-[38%]">
            <Link
              to="/"
              className="text-3xl font-bold"
            >
              <span className="text-gray-900 dark:text-white">DY</span><span className="text-primary">VA</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-400">
              Premium skincare and beauty products crafted for healthy,
              glowing skin and beautiful hair.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0" />
                <span>support@dyva.com</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0" />
                <span>+91 98xxxxxxxx</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>Lucknow, Uttar Pradesh, India</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-10 sm:p">

              {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                <div
                  key={title}
                  className="min-w-0"
                >
                  <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white sm:mb-4 sm:text-lg">
                    {title}
                  </h3>

                  <ul className="space-y-2 sm:space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        {link.label === "Track Order" ? (
                          <button
                            type="button"
                            onClick={() => setTrackingOpen(true)}
                            className="text-left text-xs text-gray-500 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary sm:text-sm"
                          >
                            {link.label}
                          </button>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-xs text-gray-500 transition hover:text-primary dark:text-gray-400 dark:hover:text-primary sm:text-sm"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* Legal links remain fixed above mobile navigation on small screens. */}
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto flex w-full max-w-7xl flex-col items-center gap-2 border-t border-gray-200 bg-gray-50 px-2  text-xs text-gray-500 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:border-gray-800 dark:bg-[#0F0F0F] dark:text-gray-400 sm:static sm:mt-10 sm:flex-row sm:justify-between sm:gap-4 sm:border-t sm:px-0 sm:py-6 sm:text-sm sm:shadow-none">
        </div>
      </div>
      {trackingOpen && <TrackOrder modal onClose={() => setTrackingOpen(false)} />}
    </footer>
    
  );
}
