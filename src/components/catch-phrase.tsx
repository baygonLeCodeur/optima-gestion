'use client';

import { useEffect, useMemo } from 'react';
import { useGenerateCatchPhrase } from '@/hooks/use-generate-catch-phrase';

interface CatchPhraseProps {
  description: string;
}

export const CatchPhrase: React.FC<CatchPhraseProps> = ({ description }) => {
  const { catchPhrase, isLoading, error, generate } = useGenerateCatchPhrase();

  useEffect(() => {
    generate(description);
  }, [description, generate]);

  const phrase = useMemo(() => {
    if (isLoading) return 'Génération en cours...';
    if (error) return 'Erreur de génération.';
    // @ts-ignore
    return catchPhrase?.catchPhrase || null;
  }, [isLoading, error, catchPhrase]);

  if (!phrase) return null;

  return (
    <p className="text-sm text-muted-foreground italic mt-2">
      <strong>Note de l'IA:</strong> {phrase}
    </p>
  );
};
