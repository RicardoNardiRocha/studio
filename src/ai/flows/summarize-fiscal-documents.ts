'use server';

/**
 * @fileOverview Summarizes key information from uploaded fiscal documents using AI.
 *
 * - summarizeFiscalDocument - A function that handles the summarization process.
 * - SummarizeFiscalDocumentInput - The input type for the summarizeFiscalDocument function.
 * - SummarizeFiscalDocumentOutput - The return type for the summarizeFiscalDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeFiscalDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A fiscal document (XML/PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeFiscalDocumentInput = z.infer<typeof SummarizeFiscalDocumentInputSchema>;

const SummarizeFiscalDocumentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the fiscal document, including invoice number, date, total amount, vendor/customer details, and tax amounts.'),
});
export type SummarizeFiscalDocumentOutput = z.infer<typeof SummarizeFiscalDocumentOutputSchema>;

export async function summarizeFiscalDocument(input: SummarizeFiscalDocumentInput): Promise<SummarizeFiscalDocumentOutput> {
  return summarizeFiscalDocumentFlow(input);
}

const summarizeFiscalDocumentPrompt = ai.definePrompt({
  name: 'summarizeFiscalDocumentPrompt',
  input: {schema: SummarizeFiscalDocumentInputSchema},
  output: {schema: SummarizeFiscalDocumentOutputSchema},
  prompt: `You are an expert accounting professional.

You will receive a fiscal document (XML or PDF) and your task is to summarize the key information contained within it, including invoice number, date, total amount, vendor/customer details, and tax amounts. Be concise and focus on the most important details.

Document: {{media url=documentDataUri}}`,
});

const summarizeFiscalDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeFiscalDocumentFlow',
    inputSchema: SummarizeFiscalDocumentInputSchema,
    outputSchema: SummarizeFiscalDocumentOutputSchema,
  },
  async input => {
    const {output} = await summarizeFiscalDocumentPrompt(input);
    return output!;
  }
);
