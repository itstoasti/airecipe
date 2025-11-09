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
  justSignedUp: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearJustSignedUp: () => void;
  getValidAccessToken: () => Promise<string>;
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
  const [justSignedUp, setJustSignedUp] = useState(false);

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
      console.log('AuthContext: Calling supabaseAuth.signUp...');
      const data = await supabaseAuth.signUp(email, password);
      console.log('AuthContext: Signup response:', JSON.stringify(data, null, 2));

      // Check if we have access_token and user (email confirmation disabled)
      if (data.access_token && data.user) {
        console.log('AuthContext: Access token and user exist, creating session...');
        const session: AuthSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
          },
        };
        await saveSession(session);
        setJustSignedUp(true);
        console.log('AuthContext: justSignedUp set to true');
        return;
      }

      // Check if session property exists (alternative response format)
      if (data.session) {
        console.log('AuthContext: Session property exists, saving...');
        await saveSession(data.session);
        setJustSignedUp(true);
        console.log('AuthContext: justSignedUp set to true');
        return;
      }

      // Check if email confirmation is required
      if (data.confirmation_sent_at || (data.id && !data.access_token)) {
        console.log('AuthContext: Email confirmation required');
        throw new Error(
          'Account created! Please check your email to confirm your account, then sign in.'
        );
      }

      // Unexpected response
      console.log('AuthContext: Unexpected signup response');
      throw new Error('Unexpected response from signup');
    } catch (error: any) {
      console.error('AuthContext: Signup error:', error);
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
      // Try to sign out via API, but don't fail if token is expired
      if (session?.access_token) {
        try {
          await supabaseAuth.signOut(session.access_token);
        } catch (apiError: any) {
          // Ignore JWT errors (token expired, invalid, etc.)
          // We'll still clear the local session
          console.log('Sign out API call failed (ignoring):', apiError?.code || apiError?.message);
        }
      }
      await clearSession();
    } catch (error: any) {
      console.error('Error clearing session:', error);
      // Force clear session even if something goes wrong
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

  const clearJustSignedUp = () => {
    setJustSignedUp(false);
  };

  // Helper function to check if JWT token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      // Consider token expired if it expires in less than 5 minutes
      return expirationTime - currentTime < 5 * 60 * 1000;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Consider token expired if we can't parse it
    }
  };

  // Get a valid access token, refreshing if necessary
  const getValidAccessToken = async (): Promise<string> => {
    if (!session) {
      throw new Error('No active session');
    }

    // Check if token is expired or about to expire
    if (isTokenExpired(session.access_token)) {
      console.log('Access token expired, refreshing...');
      try {
        const { session: newSession } = await supabaseAuth.refreshToken(session.refresh_token);
        await saveSession(newSession);
        console.log('Token refreshed successfully');
        return newSession.access_token;
      } catch (error: any) {
        console.error('Failed to refresh token:', error);
        // If refresh fails, clear session and force re-login
        await clearSession();
        throw new Error('Session expired. Please sign in again.');
      }
    }

    return session.access_token;
  };

  const value = {
    user,
    session,
    loading,
    justSignedUp,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearJustSignedUp,
    getValidAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
