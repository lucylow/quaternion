import { useRef, useEffect } from 'react';

/**
 * useStableKeyGetter - Provides stable keys for React list rendering
 * 
 * Ensures that even if items don't have unique IDs, they get stable keys
 * that persist across re-renders. This prevents React duplicate key warnings.
 * 
 * @param items - Array of items to generate keys for
 * @param getId - Function to extract ID from item (returns string|number|undefined|null)
 * @returns Function (item, index) => stableKey
 */
export default function useStableKeyGetter<T>(
  items: T[],
  getId: (t: T) => string | number | undefined | null
) {
  const mapRef = useRef<Map<any, string>>(new Map());
  const counterRef = useRef(0);

  useEffect(() => {
    items.forEach((it, idx) => {
      const id = getId(it);
      if (id !== undefined && id !== null) {
        // Use the ID as-is if available
        mapRef.current.set(id, String(id));
      } else if (!mapRef.current.has(it)) {
        // Generate a stable key for items without IDs (by object reference)
        const k = `stable-${counterRef.current++}-${idx}`;
        mapRef.current.set(it, k);
      }
    });

    // Cleanup: remove keys for items no longer present
    const keep = new Set<any>();
    items.forEach(it => {
      const id = getId(it);
      keep.add(id !== undefined && id !== null ? id : it);
    });

    for (const key of Array.from(mapRef.current.keys())) {
      if (!keep.has(key)) {
        mapRef.current.delete(key);
      }
    }
  }, [items, getId]);

  return (item: T, index: number) => {
    const id = getId(item);
    if (id !== undefined && id !== null) return String(id);
    return mapRef.current.get(item) ?? `idx-${index}`;
  };
}

