import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Vos options de configuration existantes sont conservées */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Ajouter cette section pour Genkit AI :
  experimental: {
    serverComponentsExternalPackages: ['genkit', '@genkit-ai/googleai'],
  },
  
  webpack: (config, { isServer }) => {
    // Résoudre les problèmes avec les modules qui utilisent des APIs du navigateur
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // Ajouter ces lignes pour Genkit AI :
        child_process: false,
        worker_threads: false,
      };
    }
    
    return config;
  },
  
  images: {
    // On garde le tableau remotePatterns existant
    remotePatterns: [
      // On conserve la configuration pour les images placeholder
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // --- ON AJOUTE LA NOUVELLE CONFIGURATION ICI ---
      // On ajoute la configuration pour les images de votre Supabase Storage
      {
        protocol: 'https',
        hostname: 'lvcgrmvvbinnbtreurnn.supabase.co', // L'hostname de votre projet
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;