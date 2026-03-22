import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB4y1y4ecxphqWvfbQxA_XwXkcRG0cyr_k",
  authDomain: "studyplanner-1286b.firebaseapp.com",
  databaseURL: "https://studyplanner-1286b-default-rtdb.firebaseio.com",
  projectId: "studyplanner-1286b",
  storageBucket: "studyplanner-1286b.firebasestorage.app",
  messagingSenderId: "847474892067",
  appId: "1:847474892067:web:aa7878d057ffa44f99c096",
  measurementId: "G-BZFRFY2TK6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services to be exported
export const auth = getAuth(app);
export const db = getDatabase(app);
