'use client';

import {
  LucideProps,
  Moon,
  SunMedium,
  Twitter,
} from "lucide-react"

export const Icons = {
  sun: SunMedium,
  moon: Moon,
  twitter: Twitter,
  logo: (props: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" {...props}>
      <g transform="translate(10, 10) scale(0.8)">
        <path d="M40,5L20,15V35L40,45L60,35V15L40,5Z" fill="hsl(var(--foreground))"/>
        <path d="M60,35V15L80,25V45L60,55V75L80,85V65L60,55" fill="hsl(var(--foreground))"/>
        <path d="M40,45L20,35V55L40,65V85L20,75V55" fill="hsl(var(--foreground))"/>
        <path d="M20,15L0,25V45L20,55V35" fill="hsl(var(--foreground))"/>

        {/* Corrected stroke-width to strokeWidth */}
        <path d="M40,5L20,15L0,25L20,35L40,45L60,35L80,25L60,15L40,5Z" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
        <path d="M20,35V55L40,65V85" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
        <path d="M60,35V55L40,65" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
      </g>
    </svg>
  ),
  facebook: (props: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  ),
  instagram: (props: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
  ),
}
