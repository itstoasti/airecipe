import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAuth } from '../utils/supabaseClient';

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session from AsyncStorage on app start
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem('supabase_session');
      if (sessionJson) {
        const savedSession = JSON.parse(sessionJson);
        setSession(savedSession);
        setUser(savedSession.user);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (newSession: AuthSession) => {
    try {
      await AsyncStorage.setItem('supabase_session', JSON.stringify(newSession));
      setSession(newSession);
      setUser(newSession.user);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('supabase_session');
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await supabaseAuth.signUp(email, password);

      if (data.session) {
        await saveSession(data.session);
      } else if (data.user) {
        // Email confirmation required
        throw new Error('Please check your email to confirm your account');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await supabaseAuth.signIn(email, password);

      if (data.session) {
        await saveSession(data.session);
      } else {
        throw new Error('Failed to sign in');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      if (session) {
        await supabaseAuth.signOut(session.access_token);
      }
      await clearSession();
    } catch (error: any) {
      console.error('Error signing out:', error);
      // Clear session even if API call fails
      await clearSession();
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await supabaseAuth.resetPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
