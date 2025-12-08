'use client';
import { Firestore, collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

/**
 * Logs a user activity to the 'activities' collection in Firestore.
 * This is a non-blocking operation.
 *
 * @param firestore - The Firestore instance.
 * @param user - The authenticated user performing the action.
 * @param description - A string describing the activity (e.g., "criou a empresa X").
 * @param relatedEntity - Optional object with info about a related entity.
 */
export const logActivity = (
  firestore: Firestore,
  user: User,
  description: string,
  relatedEntity?: { type: string; id: string }
): void => {
  if (!firestore || !user) {
    console.error("Firestore or User not available for logging activity.");
    return;
  }

  const activityCollectionRef = collection(firestore, 'activities');

  const newActivity = {
    description,
    userId: user.uid,
    userName: user.displayName || 'Usuário Anônimo',
    userAvatarUrl: user.photoURL || '',
    timestamp: serverTimestamp(),
    relatedEntityType: relatedEntity?.type || null,
    relatedEntityId: relatedEntity?.id || null,
  };

  // Perform the write operation in a non-blocking way
  addDoc(activityCollectionRef, newActivity)
    .then(docRef => {
      // Add the generated ID to the document
      updateDoc(doc(activityCollectionRef, docRef.id), { id: docRef.id });
    })
    .catch(error => {
      console.error("Error logging activity: ", error);
      // Here you might want to emit a global error or use a logging service
      // For now, we'll just log it to the console.
    });
};
