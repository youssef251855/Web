import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseNativeUser
} from 'firebase/auth';
import { db, auth } from './firebase';

export { db, auth };

// Connection test as required by firebase skill
export async function testConnection() {
  try {
    if (typeof window !== 'undefined') {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase notice: client is offline or testing connection:", error);
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface User {
  id: string;
  uid?: string;
  email: string;
  name?: string;
  username?: string;
  created_at?: string;
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export type AppwriteUser = User;
export type FirebaseClientUser = User;

// Local fallback cache in localStorage to ensure snappy responsiveness & offline resilience
function getLocalFallback(colName: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`fb_local_${colName}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading local storage for ${colName}`, e);
  }
  return [];
}

function saveLocalFallback(colName: string, items: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`fb_local_${colName}`, JSON.stringify(items));
  } catch (e) {
    console.warn(`Error writing local storage for ${colName}`, e);
  }
}

class FirestoreMutationBuilder implements PromiseLike<{ data: any; error: any }> {
  private colName: string;
  private action: 'insert' | 'upsert' | 'update' | 'delete';
  private values: any;
  private filters: Array<{ field: string; op: any; val: any }> = [];
  private isSingle = false;
  private isArrayInput = false;

  constructor(
    colName: string,
    action: 'insert' | 'upsert' | 'update' | 'delete',
    values: any,
    filters: Array<{ field: string; op: any; val: any }> = []
  ) {
    this.colName = colName;
    this.action = action;
    this.values = values;
    this.filters = [...filters];
    this.isArrayInput = Array.isArray(values);
  }

  select(columns: string = '*') {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: '==', val });
    return this;
  }

  neq(field: string, val: any) {
    this.filters.push({ field, op: '!=', val });
    return this;
  }

  in(field: string, vals: any[]) {
    this.filters.push({ field, op: 'in', val: vals });
    return this;
  }

  match(obj: Record<string, any>) {
    for (const [k, v] of Object.entries(obj)) {
      this.filters.push({ field: k, op: '==', val: v });
    }
    return this;
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      if (this.action === 'insert' || this.action === 'upsert') {
        const list = Array.isArray(this.values) ? this.values : [this.values];
        const inserted: any[] = [];

        for (const item of list) {
          const itemCopy = { ...item };
          const customId = itemCopy.id || itemCopy._id || `${this.colName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          delete itemCopy._id;

          const uid = itemCopy.user_id || itemCopy.userId || auth.currentUser?.uid;
          const tid = itemCopy.table_id || itemCopy.tableId;
          const toSave = {
            ...itemCopy,
            id: customId,
            ...(uid ? { user_id: uid, userId: uid } : {}),
            ...(tid ? { table_id: tid, tableId: tid } : {}),
            created_at: itemCopy.created_at || itemCopy.createdAt || new Date().toISOString(),
            createdAt: itemCopy.createdAt || itemCopy.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const docRef = doc(db, this.colName, customId);
          await setDoc(docRef, toSave, { merge: true });
          inserted.push(toSave);
        }

        // Update local storage cache
        const local = getLocalFallback(this.colName);
        const merged = [...local.filter(e => !inserted.some(i => i.id === e.id)), ...inserted];
        saveLocalFallback(this.colName, merged);

        const resultData = this.isSingle 
          ? (inserted[0] || null) 
          : (this.isArrayInput ? inserted : inserted[0]);

        return { data: resultData, error: null };
      }

      if (this.action === 'update') {
        const queryBuilder = new FirestoreQueryBuilder(this.colName);
        for (const f of this.filters) {
          queryBuilder.eq(f.field, f.val);
        }
        const itemsToUpdate = await queryBuilder.fetchItems();
        const updatedList: any[] = [];

        for (const item of itemsToUpdate) {
          if (!item.id) continue;
          const docRef = doc(db, this.colName, item.id);
          const updateData = {
            ...this.values,
            updated_at: new Date().toISOString(),
          };
          await updateDoc(docRef, updateData);
          updatedList.push({ ...item, ...updateData });
        }

        // Also check if an id was passed in filters and wasn't found in query
        const idFilter = this.filters.find(f => f.field === 'id');
        if (idFilter && itemsToUpdate.length === 0) {
          const targetId = idFilter.val;
          const docRef = doc(db, this.colName, targetId);
          const updateData = {
            ...this.values,
            id: targetId,
            updated_at: new Date().toISOString(),
          };
          await setDoc(docRef, updateData, { merge: true });
          updatedList.push(updateData);
        }

        // Update local storage
        const local = getLocalFallback(this.colName);
        const updatedLocal = local.map(i => {
          const matched = updatedList.find(u => u.id === i.id);
          return matched ? { ...i, ...matched } : i;
        });
        saveLocalFallback(this.colName, updatedLocal);

        const resultData = this.isSingle ? (updatedList[0] || null) : updatedList;
        return { data: resultData, error: null };
      }

      if (this.action === 'delete') {
        const queryBuilder = new FirestoreQueryBuilder(this.colName);
        for (const f of this.filters) {
          queryBuilder.eq(f.field, f.val);
        }
        const itemsToDelete = await queryBuilder.fetchItems();

        for (const item of itemsToDelete) {
          if (!item.id) continue;
          await deleteDoc(doc(db, this.colName, item.id));
        }

        const idFilter = this.filters.find(f => f.field === 'id');
        if (idFilter) {
          await deleteDoc(doc(db, this.colName, idFilter.val));
        }

        // Update local storage
        const local = getLocalFallback(this.colName);
        const remaining = local.filter(i => {
          if (idFilter && i.id === idFilter.val) return false;
          return !itemsToDelete.some(d => d.id === i.id);
        });
        saveLocalFallback(this.colName, remaining);

        const resultData = this.isSingle ? (itemsToDelete[0] || null) : itemsToDelete;
        return { data: resultData, error: null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn(`Firestore mutation ${this.action} on ${this.colName} fallback:`, err?.message || err);
      // Fallback to local storage if network or permissions fail
      if (this.action === 'insert' || this.action === 'upsert') {
        const list = Array.isArray(this.values) ? this.values : [this.values];
        const inserted: any[] = [];
        for (const item of list) {
          const customId = item.id || item._id || `${this.colName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const toSave = { ...item, id: customId, created_at: item.created_at || new Date().toISOString() };
          inserted.push(toSave);
        }
        const local = getLocalFallback(this.colName);
        saveLocalFallback(this.colName, [...local.filter(e => !inserted.some(i => i.id === e.id)), ...inserted]);
        const resultData = this.isSingle ? (inserted[0] || null) : (this.isArrayInput ? inserted : inserted[0]);
        return { data: resultData, error: null };
      }
      return { data: null, error: err };
    }
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<{ data: any; error: any } | TResult> {
    return this.execute().catch(onrejected);
  }
}

export class FirestoreQueryBuilder {
  private colName: string;
  private filters: Array<{ field: string; op: any; val: any }> = [];
  private orderConfig: { field: string; direction: 'asc' | 'desc' } | null = null;
  private limitNum: number | null = null;

  constructor(colName: string) {
    this.colName = colName;
  }

  select(columns: string = '*') {
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: '==', val });
    return this;
  }

  neq(field: string, val: any) {
    this.filters.push({ field, op: '!=', val });
    return this;
  }

  in(field: string, vals: any[]) {
    this.filters.push({ field, op: 'in', val: vals });
    return this;
  }

  gt(field: string, val: any) {
    this.filters.push({ field, op: '>', val });
    return this;
  }

  gte(field: string, val: any) {
    this.filters.push({ field, op: '>=', val });
    return this;
  }

  lt(field: string, val: any) {
    this.filters.push({ field, op: '<', val });
    return this;
  }

  lte(field: string, val: any) {
    this.filters.push({ field, op: '<=', val });
    return this;
  }

  match(obj: Record<string, any>) {
    for (const [k, v] of Object.entries(obj)) {
      this.filters.push({ field: k, op: '==', val: v });
    }
    return this;
  }

  range(from: number, to: number) {
    this.limitNum = (to - from) + 1;
    return this;
  }

  order(field: string, options: { ascending?: boolean } = { ascending: true }) {
    this.orderConfig = { field, direction: options.ascending ? 'asc' : 'desc' };
    return this;
  }

  limit(count: number) {
    this.limitNum = count;
    return this;
  }

  public async fetchItems(): Promise<any[]> {
    return this.executeQuery();
  }

  private async executeQuery(): Promise<any[]> {
    try {
      // Direct doc fetch optimization if filtered strictly by id
      const idFilter = this.filters.find(f => f.field === 'id' && f.op === '==');
      if (idFilter && this.filters.length === 1 && !this.orderConfig) {
        try {
          const singleDocRef = doc(db, this.colName, String(idFilter.val));
          const singleSnap = await getDoc(singleDocRef);
          if (singleSnap.exists()) {
            const item = { id: singleSnap.id, ...singleSnap.data() };
            const existing = getLocalFallback(this.colName);
            saveLocalFallback(this.colName, [...existing.filter(e => e.id !== item.id), item]);
            return [item];
          }
        } catch {
          // If direct fetch encounters an error, proceed to query
        }
      }

      const colRef = collection(db, this.colName);
      const queryConstraints: any[] = [];

      for (const f of this.filters) {
        queryConstraints.push(where(f.field, f.op, f.val));
      }

      if (this.orderConfig) {
        queryConstraints.push(orderBy(this.orderConfig.field, this.orderConfig.direction));
      }

      if (this.limitNum !== null) {
        queryConstraints.push(limit(this.limitNum));
      }

      const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
      const snap = await getDocs(q);

      const items: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          ...data,
        });
      });

      // Save to local fallback cache
      if (items.length > 0) {
        const existing = getLocalFallback(this.colName);
        const merged = [...existing.filter(e => !items.some(i => i.id === e.id)), ...items];
        saveLocalFallback(this.colName, merged);
      }

      return items;
    } catch {
      // Gracefully fall back to local storage cache if network or transient permission delay occurs
      let items = getLocalFallback(this.colName);

      // Apply client-side filters on fallback items
      for (const f of this.filters) {
        if (f.op === '==') {
          items = items.filter(i => i[f.field] == f.val);
        } else if (f.op === '!=') {
          items = items.filter(i => i[f.field] != f.val);
        }
      }

      if (this.limitNum !== null) {
        items = items.slice(0, this.limitNum);
      }

      return items;
    }
  }

  async single() {
    const items = await this.executeQuery();
    if (items.length === 0) {
      return { data: null, error: { message: `No record found in ${this.colName}` } };
    }
    return { data: items[0], error: null };
  }

  async maybeSingle() {
    const items = await this.executeQuery();
    return { data: items.length > 0 ? items[0] : null, error: null };
  }

  insert(values: any | any[]): FirestoreMutationBuilder {
    return new FirestoreMutationBuilder(this.colName, 'insert', values, this.filters);
  }

  upsert(values: any | any[]): FirestoreMutationBuilder {
    return new FirestoreMutationBuilder(this.colName, 'upsert', values, this.filters);
  }

  update(values: any): FirestoreMutationBuilder {
    return new FirestoreMutationBuilder(this.colName, 'update', values, this.filters);
  }

  delete(): FirestoreMutationBuilder {
    return new FirestoreMutationBuilder(this.colName, 'delete', null, this.filters);
  }

  // Allow `await query` syntax directly
  then(resolve: (value: { data: any[]; error: any }) => void, reject?: (reason: any) => void) {
    this.executeQuery()
      .then(data => resolve({ data, error: null }))
      .catch(err => resolve({ data: [], error: err }));
  }
}

function mapFirebaseUser(user: FirebaseNativeUser | null): User | null {
  if (!user) return null;
  const username = user.displayName || user.email?.split('@')[0] || 'User';
  return {
    id: user.uid,
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || username,
    username: username,
    created_at: user.metadata?.creationTime || new Date().toISOString(),
    user_metadata: {
      username: username,
      avatar_url: user.photoURL || undefined,
    },
  };
}

export const firebaseClient = {
  from(tableName: string) {
    return new FirestoreQueryBuilder(tableName);
  },

  auth: {
    async getSession() {
      const current = auth.currentUser;
      const user = mapFirebaseUser(current);
      return {
        data: {
          session: user ? { user } : null,
        },
        error: null,
      };
    },

    onAuthStateChange(callback: (event: string, session: { user: User | null } | null) => void) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        const user = mapFirebaseUser(fbUser);
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
      });

      return {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };
    },

    async signInWithOAuth(options?: { provider?: string; options?: { redirectTo?: string; [key: string]: any } }) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const user = mapFirebaseUser(result.user);
        return { data: { user }, error: null };
      } catch (error: any) {
        console.error('Firebase signInWithPopup error:', error);
        return { data: null, error };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = mapFirebaseUser(result.user);
        return { data: { user }, error: null };
      } catch (error: any) {
        const errorCode = error?.code || '';

        // If credentials are not recognized, the user may not have registered in Firebase Auth yet.
        // We attempt to create their account smoothly.
        if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found') {
          try {
            const createResult = await createUserWithEmailAndPassword(auth, email, password);
            const user = mapFirebaseUser(createResult.user);
            if (user) {
              try {
                // Ensure document exists in Firestore users collection
                await setDoc(doc(db, 'users', user.id), {
                  id: user.id,
                  email: user.email,
                  username: user.username,
                  name: user.name,
                  created_at: new Date().toISOString(),
                }, { merge: true });
              } catch (saveErr) {
                console.warn('Auto-seed user record notice:', saveErr);
              }
            }
            return { data: { user }, error: null };
          } catch (createErr: any) {
            if (createErr?.code === 'auth/email-already-in-use') {
              const friendlyError = new Error('كلمة المرور غير صحيحة لهذا الحساب / Incorrect password for this account.');
              return { data: null, error: friendlyError };
            }
            if (createErr?.code === 'auth/weak-password') {
              const friendlyError = new Error('كلمة المرور يجب أن تتكون من 6 خانات على الأقل / Password must be at least 6 characters.');
              return { data: null, error: friendlyError };
            }
          }
        }

        let message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة / Invalid email or password.';
        if (errorCode === 'auth/invalid-email') {
          message = 'صيغة البريد الإلكتروني غير صالحة / Invalid email address.';
        } else if (errorCode === 'auth/too-many-requests') {
          message = 'تم حظر المحاولات مؤقتاً لتكرار الطلبات. يرجى الانتظار قليلاً / Too many attempts. Please try again later.';
        } else if (error?.message) {
          message = error.message;
        }

        return { data: null, error: new Error(message) };
      }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string }; emailRedirectTo?: string; [key: string]: any } }) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const username = options?.data?.username;
        if (username && result.user) {
          await updateProfile(result.user, { displayName: username });
        }
        const user = mapFirebaseUser(result.user);
        return { data: { user, session: { user } }, error: null };
      } catch (error: any) {
        console.error('Firebase signUp error:', error);
        return { data: null, error };
      }
    },

    async signOut() {
      try {
        await fbSignOut(auth);
        return { error: null };
      } catch (error: any) {
        console.error('Firebase signOut error:', error);
        return { error };
      }
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          try {
            // Upload to Cloudinary via server-side endpoint
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await fetch('/api/upload/cloudinary', {
              method: 'POST',
              body: formData,
            });
            const result = await uploadRes.json();

            if (!uploadRes.ok || !result.success) {
              throw new Error(result.error || 'Failed to upload file');
            }

            // Record in files collection
            try {
              const fileDoc = {
                name: file.name,
                url: result.url,
                public_id: result.public_id,
                resource_type: result.resource_type || 'image',
                size: file.size,
                created_at: new Date().toISOString(),
                user_id: auth.currentUser?.uid || 'anonymous',
              };
              await setDoc(doc(db, 'files', result.public_id || `${Date.now()}`), fileDoc, { merge: true });
            } catch (docErr) {
              console.warn('Could not record file in Firestore files collection:', docErr);
            }

            return {
              data: {
                id: result.public_id,
                path: result.url,
                url: result.url,
                resource_type: result.resource_type || 'image',
              },
              error: null,
            };
          } catch (err: any) {
            console.error('Storage upload error:', err);
            return { data: null, error: err };
          }
        },

        getPublicUrl(idOrUrl: string) {
          return {
            data: {
              publicUrl: idOrUrl,
            },
          };
        },
      };
    },
  },
};

export const firebase = firebaseClient;
export const firebaseDb = firebaseClient;
export default firebaseClient;
