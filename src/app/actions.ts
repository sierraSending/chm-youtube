'use server';

import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';

type DraggableItem = {
  id: number;
  name: string;
  image: string;
  x: number;
  y: number;
};

type Prediction = {
  x: number;
  y: number;
};

type Submission = {
  email: string;
  joinCommunity: boolean;
  createdAt: Timestamp;
  predictions: Record<string, Prediction>;
};

export type SavePredictionsPayload = {
    items: DraggableItem[];
    email: string;
    joinCommunity: boolean;
}

export async function savePredictions(payload: SavePredictionsPayload) {
  const { items, email, joinCommunity } = payload;
  try {
    const predictions: Record<string, Prediction> = {};
    items.forEach((item) => {
      // Convert from 0-100 scale to -50 to +50 scale and round to integer
      const x = Math.round(item.x - 50);
      const y = Math.round(item.y - 50);
      
      // The y-axis in browser coordinates is inverted (0 is top, 100 is bottom).
      // To match a standard Cartesian grid (positive Y is up), we invert it.
      const cartesianY = y * -1;

      predictions[item.name] = { x: x, y: cartesianY };
    });

    const submissionData: Submission = {
      email,
      joinCommunity,
      predictions,
      createdAt: serverTimestamp() as Timestamp,
    };

    await addDoc(collection(db, 'visitorPrediction'), submissionData);
  } catch (error) {
    console.error('Error writing document to "visitorPrediction": ', error);
    throw new Error('Could not save predictions to Firebase.');
  }
}

export async function incrementVisitorCount() {
  const counterRef = doc(db, 'visitorCount', 'counter');
  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        // If the document doesn't exist, create it with a count of 1.
        transaction.set(counterRef, { pageLoad: 1 });
        return;
      }
      const newCount = (counterDoc.data().pageLoad || 0) + 1;
      transaction.update(counterRef, { pageLoad: newCount });
    });
  } catch (error) {
    console.error("Error incrementing visitor count: ", error);
    // We don't throw an error here because this is a non-critical background task.
    // The user doesn't need to know if it fails.
  }
}
