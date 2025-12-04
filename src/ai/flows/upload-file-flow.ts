'use server';

/**
 * @fileOverview A flow to handle file uploads to Firebase Storage via a server-side proxy
 * to bypass client-side CORS issues.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: firebaseConfig.storageBucket,
  });
}

const bucket = admin.storage().bucket();

const UploadFileInputSchema = z.object({
  fileDataUri: z.string().describe("The file encoded as a data URI."),
  filePath: z.string().describe("The full path in Firebase Storage where the file should be saved (e.g., 'profile-pictures/userId.jpg')."),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

const UploadFileOutputSchema = z.object({
  downloadUrl: z.string().describe("The public URL of the uploaded file."),
});
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    return uploadFileFlow(input);
}


const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async ({ fileDataUri, filePath }) => {
    
    const mimeTypeMatch = fileDataUri.match(/^data:(.*);base64,/);
    if (!mimeTypeMatch) {
      throw new Error('Invalid data URI format.');
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = fileDataUri.replace(/^data:.*;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
      },
    });

    // Make the file public and get its URL
    // Note: This makes the file readable by anyone with the link.
    // For more granular control, use signed URLs.
    await file.makePublic();
    
    return {
      downloadUrl: file.publicUrl(),
    };
  }
);
