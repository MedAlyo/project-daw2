'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserProfile } from '@/lib/firebase/firestoreActions';

interface AuthUser extends FirebaseUser {
  role?: 'buyer' | 'seller';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            const authUser: AuthUser = {
              ...firebaseUser,
              role: userProfile.role,
            };
            setUser(authUser);
          } else {
            console.warn("Auth user exists but no Firestore profile found:", firebaseUser.uid);
            setUser(firebaseUser as AuthUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(firebaseUser as AuthUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the AuthContext.
 * @returns The AuthContext value (user and loading state).
 * @throws Error if used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};