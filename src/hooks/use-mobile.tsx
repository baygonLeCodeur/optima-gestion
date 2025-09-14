'use client';

import { useState, useEffect } from 'react';
import { useIsClient } from './use-is-client'; // Importer le hook

const useMobile = (query: string = '(max-width: 768px)') => {
  const isClient = useIsClient(); // Utiliser le hook pour vérifier si on est côté client

  // Retourner `false` (ou une valeur par défaut) côté serveur
  if (!isClient) {
    return false;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(query).matches
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    
    // Pas besoin d'appeler handleChange ici car l'état initial est déjà correct
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return isMobile;
};

export { useMobile };
