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
        // First, create the submission document to get its ID
        const submissionRef = await addDoc(collection(db, "submissions"), {
            createdAt: serverTimestamp(),
        });
        const submissionId = submissionRef.id;

        // Then, create a batch to write all the prediction documents
        const batch = writeBatch(db);
        
        predictions.forEach(prediction => {
            const predictionRef = doc(collection(db, "visitorPrediction"));
            batch.set(predictionRef, {
                submissionId: submissionId,
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
