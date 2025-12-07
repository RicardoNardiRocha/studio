'use client';

import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Firestore, collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import type { Company } from "@/components/empresas/company-details-dialog";


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
 * Uploads a certificate file to a specified folder in Firebase Storage.
 * This is a specific function for `.pfx` files.
 * @param storageInstance - The Firebase Storage instance from `useStorage()`.
 * @param folder - The folder in the bucket to upload the file to.
 * @param file - The certificate file to upload.
 * @returns A promise that resolves with the public download URL of the file.
 */
export async function uploadCertificate(storageInstance: FirebaseStorage, folder: string, file: File): Promise<string> {
  // Always name the file certificate.pfx for consistency
  const path = `${folder}/certificate.pfx`;
  const fileRef = ref(storageInstance, path);

  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/**
 * Uploads a company document, saves its metadata to Firestore, and returns the document data.
 * @param company - The company object the document belongs to.
 * @param file - The file to upload.
 * @param user - The currently authenticated user.
 * @param firestore - Firestore instance.
 * @param storage - Firebase Storage instance.
 * @returns A promise that resolves with the newly created document's data.
 */
export async function uploadCompanyDocument(
  company: Company,
  file: File,
  user: User,
  firestore: Firestore,
  storage: FirebaseStorage
): Promise<any> {
    const folder = `companies/${company.id}/documents`;
    const fileUrl = await uploadFile(storage, folder, file);
    
    const documentCollectionRef = collection(firestore, 'companies', company.id, 'documents');
    
    // Extrai o tipo do arquivo ou define como 'Outro'
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let fileType = 'Outro';
    if (fileExtension === 'pdf') fileType = 'PDF';
    if (fileExtension === 'xml') fileType = 'XML';
    if (fileExtension === 'doc' || fileExtension === 'docx') fileType = 'Word';
    if (fileExtension === 'xls' || fileExtension === 'xlsx') fileType = 'Excel';

    const newDocumentData = {
        companyId: company.id,
        companyName: company.name,
        name: file.name,
        type: fileType,
        expirationDate: null,
        uploadDate: new Date(),
        responsibleUserId: user.uid,
        responsibleUserName: user.displayName || 'Não definido',
        fileUrl: fileUrl,
        fileName: file.name,
    };

    const docRef = await addDoc(documentCollectionRef, newDocumentData);
    await updateDoc(doc(documentCollectionRef, docRef.id), { id: docRef.id });

    return { ...newDocumentData, id: docRef.id };
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
