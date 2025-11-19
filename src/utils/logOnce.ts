// logOnce.ts
// Utility to throttle repeated log messages

const seen = new Set<string>();

export function logOnce(key: string, ...args: any[]): void {
  if (seen.has(key)) return;
  console.warn(...args);
  seen.add(key);
}

export function logOnceError(key: string, ...args: any[]): void {
  if (seen.has(key)) return;
  console.error(...args);
  seen.add(key);
}

// Clear the seen set (useful for testing or reset)
export function clearLogOnceCache(): void {
  seen.clear();
}

// Reset a specific key (useful if you want to allow it to log again)
export function resetLogOnceKey(key: string): void {
  seen.delete(key);
}

