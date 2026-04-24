'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  username: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  username: null,
  signIn: async () => {},
  logout: async () => {},
  setUsername: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsernameState] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUsernameState(userDoc.data().username);
          } else {
            setUsernameState(null);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setUsernameState(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setUsername = async (newUsername: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: newUsername,
        createdAt: serverTimestamp(),
      });
      setUsernameState(newUsername);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, username, signIn, logout, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
