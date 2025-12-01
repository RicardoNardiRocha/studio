'use server';

/**
 * @fileOverview An AI agent that suggests general ledger account classifications for financial transactions.
 *
 * - suggestAccountClassification - A function that suggests an account classification for a given transaction.
 * - SuggestAccountClassificationInput - The input type for the suggestAccountClassification function.
 * - SuggestAccountClassificationOutput - The return type for the suggestAccountClassification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAccountClassificationInputSchema = z.object({
  transactionDetails: z
    .string()
    .describe(
      'The details of the financial transaction, including description, amount, date, and any other relevant information.'
    ),
});
export type SuggestAccountClassificationInput = z.infer<
  typeof SuggestAccountClassificationInputSchema
>;

const SuggestAccountClassificationOutputSchema = z.object({
  suggestedAccountClassification: z
    .string()
    .describe(
      'The AI-suggested general ledger account classification for the transaction, such as "Office Supplies", "Rent Expense", or "Sales Revenue".'
    ),
  confidence: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the AI model confidence in the suggested classification.'
    )
    .optional(),
});
export type SuggestAccountClassificationOutput = z.infer<
  typeof SuggestAccountClassificationOutputSchema
>;

export async function suggestAccountClassification(
  input: SuggestAccountClassificationInput
): Promise<SuggestAccountClassificationOutput> {
  return suggestAccountClassificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAccountClassificationPrompt',
  input: {schema: SuggestAccountClassificationInputSchema},
  output: {schema: SuggestAccountClassificationOutputSchema},
  prompt: `You are an expert accounting assistant.

  Given the details of a financial transaction, suggest the most appropriate general ledger account classification.
  Also provide a confidence score between 0 and 1.

  Examples of account classifications include:
  - Office Supplies
  - Rent Expense
  - Sales Revenue
  - Travel Expenses
  - Bank Charges

  Transaction Details: {{{transactionDetails}}}`,
});

const suggestAccountClassificationFlow = ai.defineFlow(
  {
    name: 'suggestAccountClassificationFlow',
    inputSchema: SuggestAccountClassificationInputSchema,
    outputSchema: SuggestAccountClassificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
