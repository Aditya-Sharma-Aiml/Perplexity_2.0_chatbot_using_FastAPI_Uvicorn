"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "CHAT", href: "/" },
  { label: "CONTACTS", href: "/contacts" },
  { label: "SETTINGS", href: "/settings" },
];

const Header = () => {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header className="relative z-10">
      {/* Gradient bar */}
      <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-[#4A3F71] to-[#5E507F]">
        {/* Left logo */}
        <div className="flex items-center relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-teal-400 rounded-full opacity-80" />
          <span className="font-bold text-white text-xl tracking-tight">
            Perplexity 2.0
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href === "/" && pathname === "/");

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs px-4 py-2 font-medium rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "text-white bg-white/15"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle (UI ready) */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={16} className="text-white" />
            ) : (
              <Moon size={16} className="text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </header>
  );
};

export default Header;
