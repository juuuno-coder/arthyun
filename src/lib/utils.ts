import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractFirstImage(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

export function stripImageFromContent(html: string | null | undefined, imageUrl: string | null | undefined): string {
  if (!html || !imageUrl) return html || "";
  
  // Find first image
  const match = html.match(/<img[^>]+src="([^">]+)"/);
  if (!match) return html;
  
  const firstSrc = match[1];
  
  // Compare URLs (Decode/Normalize might be needed if mismatch, but strict equality is safest first)
  // If first image IS the representative image
  if (firstSrc === imageUrl) {
      // Remove the whole img tag
      return html.replace(match[0], "");
  }
  
  return html;
}
