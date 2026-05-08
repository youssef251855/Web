'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, OperationType } from './supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  username: string | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; session: any | null }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsernameState] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUsername(session.user.id);
      else {
        setUsernameState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('username').eq('id', userId).single();
      if (!error && data) {
        setUsernameState(data.username);
      } else {
        setUsernameState(null);
      }
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    try {
      await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const setUsername = async (newUsername: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('users').upsert({
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
