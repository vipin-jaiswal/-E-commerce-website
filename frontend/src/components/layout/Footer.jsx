import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const FOOTER_LINKS = {
  Shop: [
    { label: "Best Sellers", href: "/products?bestSeller=true" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Skin Care", href: "/products?category=Skin Care" },
    { label: "Hair Care", href: "/products?category=Hair Care" },
    { label: "Makeup", href: "/products?category=Makeup" },
    { label: "Offers", href: "/offers" },
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
    <footer className="bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="text-gray-600 dark:text-gray-300">
            <Link
              to="/"
              className="text-3xl font-bold text-pink-600 dark:text-pink-500"
            >
              Glowify
            </Link>

            <p className="mt-4 dark:text-gray-400 text-sm leading-7">
              Premium skincare and beauty products crafted
              for healthy, glowing skin and beautiful hair.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} />
                support@glowify.com
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} />
                +91 9876543210
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={16} />
                Bhilai, Chhattisgarh, India
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(
            ([title, links]) => (
              <div key={title}>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-5 text-lg">
                  {title}
                </h3>

                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="
                          text-gray-600 dark:text-gray-400
                          hover:text-pink-600 dark:hover:text-pink-500
                          transition
                        "
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-14 pt-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Subscribe to our Newsletter
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Get exclusive offers, discounts and beauty tips.
              </p>
            </div>

            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="
                  bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
                  px-5 py-3 rounded-l-full
                  outline-none text-gray-900 dark:text-white
                  w-full md:w-72
                  focus:border-pink-500 dark:focus:border-pink-500
                "
              />

              <button
                className="
                  bg-pink-500 hover:bg-pink-600
                  px-6 py-3 text-white font-semibold
                  rounded-r-full transition
                "
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="
          border-t border-gray-200 dark:border-gray-800
          mt-10 pt-6
          flex flex-col md:flex-row
          items-center justify-between
          gap-4 text-sm text-gray-500 dark:text-gray-400
        ">
          <p>
            © {new Date().getFullYear()} Glowify.
            All rights reserved.
          </p>

          <div className="flex gap-6">
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