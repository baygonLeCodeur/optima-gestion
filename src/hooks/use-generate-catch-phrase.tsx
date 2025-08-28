'use client';
import { useState, useCallback } from "react";
import { aiCatchPhrase, AICatchPhraseOutput } from "@/ai/flows/ai-catch-phrase";

export const useGenerateCatchPhrase = () => {
    const [catchPhrase, setCatchPhrase] = useState<AICatchPhraseOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const generate = useCallback(async (description: string) => {
        setIsLoading(true);
        setError(null);
        setCatchPhrase(null);

        try {
            const result = await aiCatchPhrase({ description });
            setCatchPhrase(result);
        } catch (e: any) {
            console.error("Erreur lors de la génération de la phrase d'accroche:", e);
            setError(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { catchPhrase, isLoading, error, generate };
};
