// Fully migrated to Firebase Firestore & Cloudinary
// This file safely redirects all legacy Appwrite calls to Firebase to prevent any network errors.
import { 
  firebaseDb, 
  OperationType, 
  FirebaseClientUser, 
  FirestoreQueryBuilder,
  handleFirestoreError
} from './firebase-db';
import { db, auth } from './firebase';

export { 
  firebaseDb, 
  OperationType, 
  db, 
  auth, 
  handleFirestoreError 
};

export type { FirebaseClientUser, FirebaseClientUser as AppwriteUser };

// Dummy helper mocks for legacy imports
export const ID = {
  unique: () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
};

export const Query = {
  equal: (attr: string, value: any) => ({ attr, op: '==', value }),
  notEqual: (attr: string, value: any) => ({ attr, op: '!=', value }),
  orderAsc: (attr: string) => ({ attr, order: 'asc' }),
  orderDesc: (attr: string) => ({ attr, order: 'desc' }),
  limit: (limitNum: number) => ({ limit: limitNum }),
};

export const OAuthProvider = {
  Google: 'google',
  Github: 'github',
};

export const client = {
  setEndpoint: () => client,
  setProject: () => client,
  subscribe: () => () => {},
};

export const account = {
  get: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return {
      $id: user.uid,
      email: user.email,
      name: user.displayName,
      $createdAt: user.metadata.creationTime,
    };
  },
  createOAuth2Session: async () => {
    return firebaseDb.auth.signInWithOAuth();
  },
  createEmailPasswordSession: async (email: string, pass: string) => {
    return firebaseDb.auth.signInWithPassword({ email, password: pass });
  },
  create: async (id: string, email: string, pass: string, name: string) => {
    return firebaseDb.auth.signUp({ email, password: pass, options: { data: { username: name } } });
  },
  deleteSession: async (_sessionId: string = 'current') => {
    return firebaseDb.auth.signOut();
  },
};

export const databases = {
  listDocuments: async (databaseId: string, collectionId: string, _queries: any[] = []) => {
    const res = await firebaseDb.from(collectionId).select('*');
    return {
      documents: res.data || [],
      total: (res.data || []).length,
    };
  },
  getDocument: async (databaseId: string, collectionId: string, documentId: string) => {
    const res = await firebaseDb.from(collectionId).eq('id', documentId).single();
    return res.data;
  },
  createDocument: async (databaseId: string, collectionId: string, documentId: string, data: any) => {
    const res = await firebaseDb.from(collectionId).insert({ ...data, id: documentId });
    return res.data;
  },
  updateDocument: async (databaseId: string, collectionId: string, documentId: string, data: any) => {
    const res = await firebaseDb.from(collectionId).eq('id', documentId).update(data);
    return res.data;
  },
  deleteDocument: async (databaseId: string, collectionId: string, documentId: string) => {
    const res = await firebaseDb.from(collectionId).eq('id', documentId).delete();
    return res.data;
  },
};

export const storage = {
  createFile: async (bucketId: string, fileId: string, file: File) => {
    const res = await firebaseDb.storage.from(bucketId).upload(fileId, file);
    return res.data;
  },
  getFileView: (bucketId: string, fileId: string) => {
    return fileId;
  },
};

export function getActiveDatabaseId(): string {
  return 'default';
}

export function resolveCollectionId(col: string): string {
  return col;
}

export const appwrite = firebaseDb;
export default firebaseDb;
