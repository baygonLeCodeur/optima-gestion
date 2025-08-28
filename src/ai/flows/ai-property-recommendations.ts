'use server';
/**
 * @fileOverview Provides AI-powered property recommendations based on user preferences and search history.
 *
 * - aiPropertyRecommendations - A function that returns property recommendations.
 * - AIPropertyRecommendationsInput - The input type for the aiPropertyRecommendations function.
 * - AIPropertyRecommendationsOutput - The return type for the aiPropertyRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPropertyRecommendationsInputSchema = z.object({
  userPreferences: z.string().describe('A description of the users property preferences'),
  searchHistory: z.string().describe('A description of the users search history'),
});
export type AIPropertyRecommendationsInput = z.infer<typeof AIPropertyRecommendationsInputSchema>;

const AIPropertyRecommendationsOutputSchema = z.object({
  propertyRecommendations: z.string().describe('A list of recommended properties based on the user preferences and search history.'),
});
export type AIPropertyRecommendationsOutput = z.infer<typeof AIPropertyRecommendationsOutputSchema>;

export async function aiPropertyRecommendations(input: AIPropertyRecommendationsInput): Promise<AIPropertyRecommendationsOutput> {
  return aiPropertyRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPropertyRecommendationsPrompt',
  input: {schema: AIPropertyRecommendationsInputSchema},
  output: {schema: AIPropertyRecommendationsOutputSchema},
  prompt: `You are a real estate expert providing property recommendations to users.

  Based on the user's preferences and search history, provide a list of recommended properties.

  User Preferences: {{{userPreferences}}}
  Search History: {{{searchHistory}}}

  Recommended Properties: `,
});

const aiPropertyRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiPropertyRecommendationsFlow',
    inputSchema: AIPropertyRecommendationsInputSchema,
    outputSchema: AIPropertyRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
