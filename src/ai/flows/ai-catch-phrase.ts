'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AICatchPhraseInputSchema = z.object({
  description: z.string().describe('The property description'),
});
export type AICatchPhraseInput = z.infer<typeof AICatchPhraseInputSchema>;

const AICatchPhraseOutputSchema = z.object({
  catchPhrase: z.string().describe('The generated catch phrase for the property'),
});
export type AICatchPhraseOutput = z.infer<typeof AICatchPhraseOutputSchema>;

export async function aiCatchPhrase(input: AICatchPhraseInput): Promise<AICatchPhraseOutput> {
  // TEMPORAIREMENT DÉSACTIVÉ : API Google AI (quota dépassé)
  // return aiCatchPhraseFlow(input);
  
  // Solution de contournement : phrase d'accroche générique
  return {
    catchPhrase: "Découvrez ce bien d'exception !"
  };
}

const prompt = ai.definePrompt({
  name: 'aiCatchPhrasePrompt',
  input: { schema: AICatchPhraseInputSchema },
  output: { schema: AICatchPhraseOutputSchema },
  prompt: `Tu es un expert en immobilier. Ton but est de générer une phrase d'accroche percutante et concise pour une annonce immobilière.
    La phrase d'accroche doit donner envie de cliquer sur l'annonce.
    Elle doit être composée de 5 à 10 mots.
    Elle doit être en français.

    Description du bien: {{{description}}}
    
    Phrase d'accroche: `,
});

const aiCatchPhraseFlow = ai.defineFlow(
  {
    name: 'aiCatchPhraseFlow',
    inputSchema: AICatchPhraseInputSchema,
    outputSchema: AICatchPhraseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);