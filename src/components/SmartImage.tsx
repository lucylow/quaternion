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
  }, [srcLocal]);

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

  return (
    <img
      src={errored ? assetUrl(fallback) : srcResolved}
      alt={alt}
      className={className}
      style={style}
      crossOrigin={crossOrigin}
      onError={() => setErrored(true)}
      decoding="async"
      loading="lazy"
    />
  );
}

