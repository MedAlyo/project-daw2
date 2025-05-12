'use client'; // Context needs to be client-side

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Import your Firebase auth instance

// Define the shape of the context data
interface AuthContextType {
  user: User | null; // The Firebase User object or null if not logged in
  loading: boolean; // Loading state to handle initial auth check
}

// Create the context with a default value
// Using 'undefined' initially helps differentiate between "loading" and "no user"
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode; // Allow wrapping other components
}

/**
 * AuthProvider component
 * Manages the authentication state using Firebase's onAuthStateChanged
 * and provides the user and loading state to its children via context.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start in loading state

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update user state with the current user (or null)
      setLoading(false); // Set loading to false once the check is complete
    });

    // Cleanup function: Unsubscribe from the listener when the component unmounts
    // This prevents memory leaks
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Provide the user and loading state to children components
  const value = { user, loading };

  // Don't render children until the initial auth check is complete
  // You could show a loading spinner here instead if preferred
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the AuthContext
 * Provides a convenient way to access the auth state and ensures the context is used within an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Throw an error if useAuth is used outside of an AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};