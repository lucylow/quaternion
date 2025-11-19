// src/components/SmartImage.tsx
import React, { useEffect, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';

type Props = {
  srcLocal: string;           // e.g. "/assets/maps/..." or "/mnt/data/..."
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;       // optional fallback placeholder (local/public path)
  crossOrigin?: 'anonymous' | 'use-credentials' | undefined;
  preload?: boolean;          // if true, insert a <link rel="preload"> for performance
};

export default function SmartImage({
  srcLocal,
  alt = '',
  className,
  style,
  placeholder,
  crossOrigin,
  preload = false,
}: Props) {
  const [srcResolved, setSrcResolved] = useState<string>(() => assetUrl(srcLocal));
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    // Resolve again in case the Lovable resolver is injected after initial load
    const resolved = assetUrl(srcLocal);
    setSrcResolved(resolved);
    setErrored(false); // Reset error state when src changes
  }, [srcLocal]);
  
  // Also retry resolution after a short delay in case environment isn't ready
  useEffect(() => {
    if (errored) {
      const timer = setTimeout(() => {
        const resolved = assetUrl(srcLocal);
        if (resolved !== srcResolved) {
          setSrcResolved(resolved);
          setErrored(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [errored, srcLocal, srcResolved]);

  useEffect(() => {
    if (!preload) return;
    // add a preload link for this asset
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = srcResolved;
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {}
    };
  }, [srcResolved, preload]);

  const fallback = placeholder || '/assets/placeholder.svg';

  const handleError = () => {
    console.warn('[SmartImage] Failed to load image:', srcLocal, 'Resolved URL:', srcResolved);
    setErrored(true);
  };

  return (
    <img
      src={errored ? assetUrl(fallback) : srcResolved}
      alt={alt}
      className={className}
      style={style}
      crossOrigin={crossOrigin}
      onError={handleError}
      onLoad={() => {
        // Reset error state on successful load
        if (errored) setErrored(false);
      }}
      decoding="async"
      loading="lazy"
    />
  );
}

