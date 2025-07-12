'use server';

import {
  addDoc,
  collection,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';

type DraggableItem = {
  id: number;
  color: string;
  x: number;
  y: number;
};

type Prediction = {
  x: number;
  y: number;
};

type Submission = {
  createdAt: Timestamp;
  predictions: Record<string, Prediction>;
};

export async function savePredictions(items: DraggableItem[]) {
  try {
    const predictions: Record<string, Prediction> = {};
    items.forEach((item) => {
      // Extract the color name (e.g., 'blue') from the Tailwind class (e.g., 'bg-blue-500')
      const colorName = item.color.split('-')[1];
      if (colorName) {
        predictions[colorName] = { x: item.x, y: item.y };
      }
    });

    const submissionData: Submission = {
      predictions,
      createdAt: serverTimestamp() as Timestamp,
    };

    await addDoc(collection(db, 'visitorPrediction'), submissionData);
  } catch (error) {
    console.error('Error writing document to "visitorPrediction": ', error);
    throw new Error('Could not save predictions to Firebase.');
  }
}
