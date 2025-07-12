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

export async function incrementCounter(fieldName: 'pageLoad' | 'itemMove' | 'itemDetailsClick' | 'submitButtonClick' | 'thankYouCTAclick') {
  const counterRef = doc(db, 'visitorCount', 'counter');
  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { [fieldName]: 1 });
        return;
      }
      const newCount = (counterDoc.data()[fieldName] || 0) + 1;
      transaction.update(counterRef, { [fieldName]: newCount });
    });
  } catch (error) {
    console.error(`Error incrementing ${fieldName}: `, error);
    // Non-critical background task, so we don't throw to the user.
  }
}
