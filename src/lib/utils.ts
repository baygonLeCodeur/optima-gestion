// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  // 1. Si on est côté navigateur, on utilise l'URL relative.
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // 2. Si on est sur Vercel, Vercel fournit l'URL.
  if (process.env.VERCEL_URL) {
    return `https://{process.env.VERCEL_URL}`;
  }
  
  // 3. Si on est en développement local, on utilise localhost.
  return 'http://localhost:9002'; // Assurez-vous que le port est correct
}
