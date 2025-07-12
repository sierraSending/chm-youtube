"use server";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// A simple function to test Firestore writes
export async function saveTestTimestamp() {
    try {
        await addDoc(collection(db, "test"), {
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error writing document to 'test' collection: ", error);
        throw new Error("Could not save test timestamp to Firebase.");
    }
}
