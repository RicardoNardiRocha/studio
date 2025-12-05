'use client';

import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to a specified folder in Firebase Storage.
 * This is a generic upload function.
 * @param storageInstance - The Firebase Storage instance from `useStorage()`.
 * @param folder - The folder in the bucket to upload the file to.
 * @param file - The file to upload.
 * @returns A promise that resolves with the public download URL of the file.
 */
export async function uploadFile(storageInstance: FirebaseStorage, folder: string, file: File): Promise<string> {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const fileRef = ref(storageInstance, path);

  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/**
 * Uploads a profile photo for a specific user.
 * It places the file inside a user-specific folder to align with security rules.
 * @param storageInstance - The Firebase Storage instance from `useStorage()`.
 * @param userId - The unique ID of the user.
 * @param file - The profile photo file to upload.
 * @returns A promise that resolves with the public download URL of the file.
 */
export const uploadProfilePhoto = (storageInstance: FirebaseStorage, userId: string, file: File) => {
    const path = `profile-pictures/${userId}/${file.name}`;
    const fileRef = ref(storageInstance, path);
    return uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
}
