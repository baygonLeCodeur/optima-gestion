// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  // 1. Priorité à la variable d'environnement VERCEL_URL fournie par Vercel.
  // Assure que l'URL commence par https://.
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 2. Fallback sur NEXT_PUBLIC_BASE_URL si elle est définie.
  // Utile pour d'autres environnements ou pour forcer une URL.
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // 3. En dernier recours, l'URL de développement local.
  // Le port 3000 est le standard pour Next.js.
  return 'http://localhost:9002';
}
