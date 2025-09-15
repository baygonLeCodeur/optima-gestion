import type { Metadata } from 'next';
import Script from 'next/script'; // Import the Script component
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'OPTIMA GESTION',
  description: 'Gestion immobilière haut de gamme',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Add Pannellum CSS */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      </head>
  <body>
        <AuthProvider> {/* Wrap the application with AuthProvider */}
          {children}
          <Toaster />
        </AuthProvider>

        {/* Add Pannellum JS script */}
        <Script
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
