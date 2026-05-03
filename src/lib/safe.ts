export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export async function safeAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const value = await fn();
    return (value ?? fallback) as T;
  } catch {
    return fallback;
  }
}
