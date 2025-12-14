"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/login")) return null;

  // Path segments
  const segments = pathname.split("/").filter(Boolean);
  
  // Mapping for nice labels
  const labelMap: Record<string, string> = {
    about: "About",
    archive: "Archive",
    media: "Media",
    mall: "Shop",
    contact: "Contact",
    migrated: "Detail",
    notice: "Notice"
  };

  return (
    <nav className="flex items-center text-[10px] text-gray-400 tracking-widest uppercase mb-4 animate-fade-in">
      <Link href="/" className="hover:text-black transition-colors">
        HOME
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = labelMap[segment] || segment;
        const isLast = index === segments.length - 1;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight size={12} className="mx-2" />
            {isLast ? (
              <span className="text-black font-bold border-b border-black pb-0.5">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-black transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
