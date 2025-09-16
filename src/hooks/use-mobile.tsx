'use client';

import { useState, useEffect } from 'react';
import { useIsClient } from './use-is-client';

const useMobile = (query: string = '(max-width: 768px)') => {
  const isClient = useIsClient();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (isClient) {
      const mediaQuery = window.matchMedia(query);
      const handleChange = () => setIsMobile(mediaQuery.matches);
      
      // Set the initial value correctly after hydration
      handleChange();

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [isClient, query]);

  return isMobile;
};

export { useMobile };
