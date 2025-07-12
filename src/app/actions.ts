"use server";

import { addDoc, collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Prediction {
    id: number;
    color: string;
    x: number; // -1 to 1
    y: number; // -1 to 1
}

export async function savePredictions(predictions: Prediction[]) {
    try {
        const batch = writeBatch(db);
        const submissionRef = doc(collection(db, "submissions"));

        batch.set(submissionRef, { createdAt: serverTimestamp() });

        predictions.forEach(prediction => {
            const predictionRef = doc(collection(db, "visitorPrediction"));
            batch.set(predictionRef, {
                submissionId: submissionRef.id,
                color: prediction.color,
                x: prediction.x,
                y: prediction.y,
                createdAt: serverTimestamp(),
            });
        });

        await batch.commit();
        
    } catch (error) {
        console.error("Error writing document: ", error);
        throw new Error("Could not save predictions to Firebase.");
    }
}
