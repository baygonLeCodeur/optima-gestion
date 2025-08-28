// src/components/VirtualTour.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Json } from '@/types/supabase';

// Déclare le type pour la visionneuse Pannellum pour une meilleure autocomplétion
declare global {
    interface Window {
        pannellum: {
            viewer: (container: HTMLElement, config: object) => any;
        };
    }
}

interface VirtualTourProps {
  scenes: object;
}

export function VirtualTour({ scenes }: VirtualTourProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  // Ajout d'un état pour s'assurer que le composant se re-rend une fois la bibliothèque chargée
  const [isPannellumLoaded, setIsPannellumLoaded] = useState(false);

  // Ce premier useEffect surveille la présence de la bibliothèque pannellum
  useEffect(() => {
    if (window.pannellum) {
      setIsPannellumLoaded(true);
    } else {
      // Si le script est chargé dynamiquement, il faut un moyen de savoir quand il est prêt.
      // Dans notre cas (script dans layout.tsx), un simple intervalle de vérification est robuste.
      const interval = setInterval(() => {
        if (window.pannellum) {
          setIsPannellumLoaded(true);
          clearInterval(interval);
        }
      }, 100); // Vérifie toutes les 100ms
      return () => clearInterval(interval);
    }
  }, []);

  // Ce deuxième useEffect gère l'initialisation et la destruction de la visionneuse
  useEffect(() => {
    let viewer: any;

    // On ne procède que si la bibliothèque est chargée, que la div est prête et que nous avons une configuration.
    if (isPannellumLoaded && viewerRef.current && scenes) {
      try {
        viewer = window.pannellum.viewer(viewerRef.current, scenes);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de Pannellum:", error);
      }
    }

    // Effet de nettoyage pour détruire l'instance
    return () => {
      if (viewer) {
        try {
          viewer.destroy();
        } catch (error) {
          console.error("Erreur lors de la destruction de la visionneuse Pannellum:", error);
        }
      }
    };
  }, [scenes, isPannellumLoaded]); // Se déclenche quand les scènes changent ou quand la lib est chargée.

  // Affiche un message de chargement tant que la bibliothèque n'est pas prête.
  if (!isPannellumLoaded) {
    return (
        <div className="w-full h-[500px] rounded-lg flex justify-center items-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Chargement de la visite virtuelle...</span>
        </div>
    );
  }

  return <div ref={viewerRef} className="w-full h-[500px] rounded-lg" />;
}
