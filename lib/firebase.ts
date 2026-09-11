import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const rawDbId = firebaseConfig.firestoreDatabaseId;
const isDefault = !rawDbId || rawDbId === '(default)' || rawDbId === 'default' || rawDbId === 'defcult';

export const db = isDefault ? getFirestore(app) : getFirestore(app, rawDbId);
export const auth = getAuth(app);
