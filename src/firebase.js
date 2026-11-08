
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDS23zCh6H-3P03Z63Y_jMj-aV1F15S35o",
  authDomain: "student-service-system.firebaseapp.com",
  projectId: "student-service-system",
  storageBucket: "student-service-system.firebasestorage.app",
  messagingSenderId: "417379691594",
  appId: "1:417379691594:web:c86c470b788f83e9ddcab3",
  measurementId: "G-160F6Z4RRX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Connect Firestore database
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
