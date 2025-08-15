// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCuzBlJEZljLaRNfb3fGJMT61jTlkvxPi4",
  authDomain: "finance-tracker-f58e2.firebaseapp.com",
  projectId: "finance-tracker-f58e2",
  storageBucket: "finance-tracker-f58e2.firebasestorage.app",
  messagingSenderId: "783668303053",
  appId: "1:783668303053:web:d06b369e523e4f54f10584",
  measurementId: "G-BGXGKM3JGX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;