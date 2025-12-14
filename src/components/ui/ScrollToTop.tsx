"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[90] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
      <button
        onClick={scrollToTop}
        className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors group"
      >
        <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform duration-300" />
      </button>
    </div>
  );
}
