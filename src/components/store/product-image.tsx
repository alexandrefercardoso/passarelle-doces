import { useState } from "react";
import { cn } from "@/lib/utils";

function buildPlaceholder(emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f9e8ec"/>
          <stop offset="100%" stop-color="#f4edde"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <text x="300" y="300" font-size="140" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type ProductImageProps = {
  src?: string;
  alt: string;
  className?: string;
  emoji?: string;
  sizes?: string;
};

export function ProductImage({ src, alt, className, emoji = "🍰", sizes }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const source = failed || !src ? buildPlaceholder(emoji) : src;

  return (
    <img
      src={source}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
