"use client";

import { useState, useEffect } from "react";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Stock - Sistema de contagem
          </span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center">
          <ThemeToggleButton />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between w-full">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Stock - Sistema de contagem
          </span>
          <ThemeToggleButton />
        </div>
      </div>

      {/* Progress bar on scroll */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20" />
      )}
    </div>
  );
}
