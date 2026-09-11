'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { firebaseDb, FirebaseClientUser } from './firebase-db';

export type AppwriteUser = FirebaseClientUser;

interface AuthContextType {
  user: FirebaseClientUser | null;
  loading: boolean;
  username: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ user: FirebaseClientUser | null; session: any | null }>;
  logout: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  username: null,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => ({ user: null, session: null }),
  logout: async () => {},
  setUsername: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsernameState] = useState<string | null>(null);

  const fetchUsername = useCallback(async (userId: string, currentUserObj?: any) => {
    try {
      const activeUser = currentUserObj || user;
      const fallbackName = activeUser?.username || activeUser?.name || activeUser?.user_metadata?.username || activeUser?.email?.split('@')[0] || '';

      const { data, error } = await firebaseDb.from('users').select('username, name').eq('id', userId).single();
      if (!error && data && data.username) {
        setUsernameState(data.username);
      } else if (fallbackName) {
        setUsernameState(fallbackName);
        try {
          await firebaseDb.from('users').upsert({
            id: userId,
            username: fallbackName,
            name: activeUser?.name || fallbackName,
            email: activeUser?.email || '',
          });
        } catch (e) {
          console.warn('Auto-seed user record notice:', e);
        }
      } else {
        setUsernameState(null);
      }
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && Object.prototype.toString.call(event.reason) === '[object Event]') {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    firebaseDb.auth
      .getSession()
      .then(({ data: { session } }: any) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchUsername(session.user.id, session.user);
        else setLoading(false);
      })
      .catch((err: any) => {
        console.warn('Initial session check failed:', err);
        setLoading(false);
      });

    const { data: { subscription } } = firebaseDb.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsername(session.user.id, session.user);
      } else {
        setUsernameState(null);
        setLoading(false);
      }
    });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      await firebaseDb.auth.signInWithOAuth({ provider: 'google' });
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await firebaseDb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await firebaseDb.auth.signUp({ 
      email, 
      password,
      options: { 
        data: { username: name }
      }
    });

    if (error) throw error;
    
    if (data?.user) {
      await firebaseDb.from('site_users').upsert({
        id: data.user.id,
        email: data.user.email,
        name: name,
        role: 'user',
        owner_id: data.user.id
      });
    }

    return data || { user: null, session: null };
  };

  const logout = async () => {
    await firebaseDb.auth.signOut();
  };

  const setUsername = async (newUsername: string) => {
    if (!user) return;
    try {
      const { error } = await firebaseDb.from('users').upsert({
        id: user.id,
        email: user.email,
        username: newUsername,
      });
      if (error) throw error;
      setUsernameState(newUsername);
    } catch (error: any) {
      console.error("Error setting username", error);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, username, signIn, signInWithEmail, signUpWithEmail, logout, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
