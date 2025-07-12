"use server";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Prediction {
    id: number;
    color: string;
    x: number; // -1 to 1
    y: number; // -1 to 1
}

export async function savePredictions(predictions: Prediction[]) {
    try {
        await addDoc(collection(db, "predictions"), {
            items: predictions,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error writing document: ", error);
        throw new Error("Could not save predictions to Firebase.");
    }
}
