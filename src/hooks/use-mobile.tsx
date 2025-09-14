'use client';

import { useState, useEffect } from 'react';

const useMobile = (query: string = '(max-width: 768px)') => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setIsMobile(mediaQuery.matches);

    // Important : On ajoute le listener uniquement après le montage côté client
    // pour éviter les erreurs SSR et les problèmes d'hydratation.
    mediaQuery.addEventListener('change', handleChange);
    
    // On définit l'état initial après le montage.
    handleChange();

    // Nettoyage du listener lors du démontage du composant.
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return isMobile;
};

export { useMobile };
