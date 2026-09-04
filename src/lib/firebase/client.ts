import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_FIREBASE_API_KEY ||
    "AIzaSyBqNcjxaIVe2tZ-HeqehrDVZS2VNmJYlKE",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.NEXT_FIREBASE_AUTH_DOMAIN ||
    "super-trackerr.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_FIREBASE_PROJECT_ID ||
    "super-trackerr",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_FIREBASE_STORAGE_BUCKET ||
    "super-trackerr.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.NEXT_FIREBASE_MESSAGING_SENDER_ID ||
    "499718341121",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.NEXT_FIREBASE_APP_ID ||
    "1:499718341121:web:a4efc430666eef147a7600",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.NEXT_FIREBASE_MEASUREMENT_ID ||
    "G-ZYGE3082YM",
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function signUpWithEmail(email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  return signOut(auth);
}
