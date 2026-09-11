// Seamless Firebase Firestore adapter replacing Supabase and Appwrite
import { 
  firebaseDb, 
  OperationType, 
  FirebaseClientUser, 
  FirestoreQueryBuilder,
  handleFirestoreError
} from './firebase-db';
import { db, auth } from './firebase';

export { firebaseDb, OperationType, db, auth, handleFirestoreError };
export type { FirebaseClientUser, FirebaseClientUser as AppwriteUser, FirebaseClientUser as User };

// Aliases ensuring 100% transparent backwards compatibility
export const supabase = firebaseDb as any;
export const appwrite = firebaseDb as any;

export default firebaseDb;
