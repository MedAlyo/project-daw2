// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Import your Firebase auth instance
import { getUserProfile } from '@/lib/firebase/firestoreActions'; // Import getUserProfile

// Define the type for the user object in the context
// Extend FirebaseUser to include the role from Firestore
interface AuthUser extends FirebaseUser {
  role?: 'buyer' | 'seller'; // Add the role property
  // Add any other profile fields you fetch from Firestore here
}

// Define the type for the AuthContext value
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean; // Indicates if the initial auth state is still loading
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context to the application.
 * Listens to Firebase Auth state changes and fetches user profile from Firestore.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // Start loading

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If a user is logged in, fetch their profile from Firestore
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          if (userProfile) {
            // Combine Firebase Auth user data with Firestore profile data
            const authUser: AuthUser = {
              ...firebaseUser,
              role: userProfile.role,
              // Add other profile fields here if needed
            };
            setUser(authUser);
          } else {
            // Handle case where Auth user exists but no profile in Firestore (shouldn't happen with our flow)
            console.warn("Auth user exists but no Firestore profile found:", firebaseUser.uid);
            setUser(firebaseUser as AuthUser); // Use auth data as fallback
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(firebaseUser as AuthUser); // Use auth data as fallback on error
        }
      } else {
        // If no user is logged in
        setUser(null);
      }
      setLoading(false); // Auth state is now loaded
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs only once on mount

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