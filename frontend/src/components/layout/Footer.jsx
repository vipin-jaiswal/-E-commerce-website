import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const FOOTER_LINKS = {
  Shop: [
    { label: "Best Sellers", href: "/products?sort=best_seller" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Skin Care", href: "/products/category/skin-care" },
    { label: "Hair Care", href: "/products/category/hair-care" },
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
    { label: "Blog", href: "/blog" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Brand */}
          <div className="lg:w-[38%]">
            <Link
              to="/"
              className="text-3xl font-bold text-pink-600 dark:text-pink-400"
            >
              DYVA
            </Link>

            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400 max-w-sm">
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
                <span>+91 9876543210</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 shrink-0" />
                <span>Bhilai, Chhattisgarh, India</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex justify-between gap-4 sm:gap-6 lg:gap-10 min-w-max">

              {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                <div
                  key={title}
                  className="min-w-[105px] sm:min-w-[130px] lg:min-w-[160px]"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">
                    {title}
                  </h3>

                  <ul className="space-y-2 sm:space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-500 transition"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">

          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} DYVA. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link
              to="/privacy-policy"
              className="hover:text-pink-600 dark:hover:text-pink-500 transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="hover:text-pink-600 dark:hover:text-pink-500 transition"
            >
              Terms & Conditions
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}