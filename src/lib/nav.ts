export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const href = (p: string) => `${BASE}${p}`;
export const pad = (n: number, w = 3) => String(n).padStart(w, '0');
