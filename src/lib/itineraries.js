import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get all itineraries for a user (ordered by updatedAt desc)
 */
export async function getUserItineraries(userId) {
  try {
    const q = query(
      collection(db, 'itineraries'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    const itineraries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort client-side by updatedAt (newest first)
    itineraries.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    return itineraries;
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    throw error;
  }
}

/**
 * Get a single itinerary by ID
 */
export async function getItinerary(itineraryId) {
  try {
    const itineraryDoc = await getDoc(doc(db, 'itineraries', itineraryId));
    if (!itineraryDoc.exists()) {
      return null;
    }
    return {
      id: itineraryDoc.id,
      ...itineraryDoc.data()
    };
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    throw error;
  }
}

/**
 * Create a new itinerary
 */
export async function createItinerary(userId, places, specialMessage = null) {
  if (!places || places.length === 0) {
    throw new Error('Itinerary must have at least one place');
  }

  try {
    const itineraryRef = await addDoc(collection(db, 'itineraries'), {
      userId,
      places,
      specialMessage: specialMessage || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { itineraryId: itineraryRef.id, success: true };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    throw error;
  }
}

/**
 * Update an existing itinerary
 */
export async function updateItinerary(itineraryId, userId, places, specialMessage = null) {
  if (!places || places.length === 0) {
    throw new Error('Itinerary must have at least one place');
  }

  try {
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itineraryDoc = await getDoc(itineraryRef);

    if (!itineraryDoc.exists()) {
      throw new Error('Itinerary not found');
    }

    const itinerary = itineraryDoc.data();
    if (itinerary.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own itineraries');
    }

    await updateDoc(itineraryRef, {
      places,
      specialMessage: specialMessage || null,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating itinerary:', error);
    throw error;
  }
}

/**
 * Delete an itinerary
 */
export async function deleteItinerary(itineraryId, userId) {
  try {
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itineraryDoc = await getDoc(itineraryRef);

    if (!itineraryDoc.exists()) {
      throw new Error('Itinerary not found');
    }

    const itinerary = itineraryDoc.data();
    if (itinerary.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own itineraries');
    }

    await deleteDoc(itineraryRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    throw error;
  }
}
