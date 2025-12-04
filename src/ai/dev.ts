import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-document-classification.ts';
import '@/ai/flows/summarize-fiscal-documents.ts';
import '@/ai/flows/suggest-account-classification.ts';
