
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPoster() {
  console.log("Fixing Main Poster URL...");
  try {
    const snapshot = await getDocs(collection(db, "main_settings"));
    if (snapshot.empty) {
        console.log("No main_settings found.");
        return;
    }

    const docRef = snapshot.docs[0].ref;
    // Update to use local static image
    await updateDoc(docRef, {
        poster_url: "/view.jpg",
        center_text: "ART HYUN\nSystem Restored"
    });
    console.log("Successfully updated poster_url to /view.jpg");
  } catch (e) {
    console.error("Error updating document:", e);
  }
}

fixPoster();
