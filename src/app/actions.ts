
'use server';

import {
  addDoc,
  collection,
  doc,
  getDocs,
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
  email?: string; // Optional now
  joinCommunity: boolean;
  createdAt: Timestamp;
  predictions: Record<string, Prediction>;
  averagePrediction: Prediction;
};

export type SavePredictionsPayload = {
    items: DraggableItem[];
    email: string;
    joinCommunity: boolean;
    anonymizeData: boolean;
    averagePrediction: { x: number; y: number };
}

export async function savePredictions(payload: SavePredictionsPayload) {
  const { items, email, joinCommunity, anonymizeData, averagePrediction } = payload;
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

    const finalAveragePrediction = {
        x: Math.round(averagePrediction.x - 50),
        y: Math.round(averagePrediction.y - 50) * -1,
    }

    const submissionData: Submission = {
      joinCommunity,
      predictions,
      averagePrediction: finalAveragePrediction,
      createdAt: serverTimestamp() as Timestamp,
    };
    
    if (!anonymizeData) {
        submissionData.email = email;
    }

    const emailData = {
        email: email,
        marketingOptIn: joinCommunity,
        dataOptOut: anonymizeData,
        createdAt: serverTimestamp() as Timestamp,
    };

    // Save to the two different collections
    await Promise.all([
        addDoc(collection(db, 'visitorPrediction'), submissionData),
        addDoc(collection(db, 'visitorEmails'), emailData)
    ]);
    
  } catch (error) {
    console.error('Error writing document: ', error);
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

export async function getAveragePredictions(): Promise<Prediction[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "visitorPrediction"));
    const predictions: Prediction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.averagePrediction) {
        predictions.push(data.averagePrediction as Prediction);
      }
    });
    return predictions;
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw new Error("Could not fetch average predictions.");
  }
}


export type AggregatedPrediction = {
    name: string;
    avgX: number;
    avgY: number;
    count: number;
}
export async function getAggregatedPredictions(): Promise<Record<string, AggregatedPrediction>> {
  try {
    const querySnapshot = await getDocs(collection(db, "visitorPrediction"));
    const itemTotals: Record<string, { totalX: number; totalY: number; count: number }> = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.predictions) {
        for (const [itemName, prediction] of Object.entries(data.predictions as Record<string, Prediction>)) {
            if (!itemTotals[itemName]) {
                itemTotals[itemName] = { totalX: 0, totalY: 0, count: 0 };
            }
            itemTotals[itemName].totalX += prediction.x;
            itemTotals[itemName].totalY += prediction.y;
            itemTotals[itemName].count++;
        }
      }
    });
    
    const aggregatedPredictions: Record<string, AggregatedPrediction> = {};
    for(const [itemName, totals] of Object.entries(itemTotals)) {
        aggregatedPredictions[itemName] = {
            name: itemName,
            avgX: totals.totalX / totals.count,
            avgY: totals.totalY / totals.count,
            count: totals.count,
        }
    }

    return aggregatedPredictions;
  } catch (error) {
    console.error("Error getting aggregated predictions: ", error);
    throw new Error("Could not fetch aggregated predictions.");
  }
}
