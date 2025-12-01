'use server';

/**
 * @fileOverview An AI agent that suggests document classifications.
 *
 * - suggestDocumentClassification - A function that suggests a classification for a given document.
 * - SuggestDocumentClassificationInput - The input type for the suggestDocumentClassification function.
 * - SuggestDocumentClassificationOutput - The return type for the suggestDocumentClassification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDocumentClassificationInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the document to classify.'),
});
export type SuggestDocumentClassificationInput = z.infer<
  typeof SuggestDocumentClassificationInputSchema
>;

const SuggestDocumentClassificationOutputSchema = z.object({
  suggestedClassification: z
    .string()
    .describe(
      'The AI-suggested classification for the document, such as invoice, tax return, or bank statement.'
    ),
  confidence: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the AI model confidence in the suggested classification.'
    )
    .optional(),
});
export type SuggestDocumentClassificationOutput = z.infer<
  typeof SuggestDocumentClassificationOutputSchema
>;

export async function suggestDocumentClassification(
  input: SuggestDocumentClassificationInput
): Promise<SuggestDocumentClassificationOutput> {
  return suggestDocumentClassificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDocumentClassificationPrompt',
  input: {schema: SuggestDocumentClassificationInputSchema},
  output: {schema: SuggestDocumentClassificationOutputSchema},
  prompt: `You are an expert accounting document classifier.

  Given the text content of a document, suggest the most appropriate classification for it.  Also provide a confidence score between 0 and 1.

  Classify the document as one of the following categories:
  - Invoice
  - Tax Return
  - Bank Statement
  - Contract
  - Financial Statement
  - Other

  Document Text: {{{documentText}}}`,
});

const suggestDocumentClassificationFlow = ai.defineFlow(
  {
    name: 'suggestDocumentClassificationFlow',
    inputSchema: SuggestDocumentClassificationInputSchema,
    outputSchema: SuggestDocumentClassificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
