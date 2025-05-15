'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  signOut // Import signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile } from '@/lib/firebase/firestoreActions'; // Import createUserProfile

/**
 * Register page component with monochromatic styling.
 * Allows user to choose role (Buyer/Seller) during registration.
 * After registration, user is signed out and redirected to login.
 */
export default function RegisterPage() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer'); // Add state for role, default to buyer
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // --- Validations ---
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
       setError("Password should be at least 6 characters long.");
       return;
    }
    // --- End Validations ---

    setIsLoading(true);

    try {
      // Create the user with email and password using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        const firebaseUser = userCredential.user;

        // Update the user's profile with the displayName (username) in Firebase Auth
        await updateProfile(firebaseUser, {
          displayName: username,
        });

        // Create a user profile document in Firestore with the chosen role
        await createUserProfile(firebaseUser.uid, username, role); // Call createUserProfile

        // Send the email verification link
        await firebaseSendEmailVerification(firebaseUser);

        // IMPORTANT: Sign the user out after registration and sending verification
        await signOut(auth);

        // Redirect to the login page with a status message
        router.push('/account/login?status=registered');
      } else {
        // Fallback if user object is not available, though unlikely after successful creation
        setError('User creation failed unexpectedly. Please try again.');
        setIsLoading(false); // Ensure loading state is reset
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Failed to register. Please try again.');
      }
      setIsLoading(false); // Reset loading state on error
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center text-gray-900">Create Account</h1>
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="Choose a username"
            />
          </div>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="Minimum 6 characters"
            />
          </div>
          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Register as:
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="role-buyer"
                  name="role"
                  type="radio"
                  value="buyer"
                  checked={role === 'buyer'}
                  onChange={() => setRole('buyer')}
                  disabled={isLoading}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="role-buyer" className="ml-2 block text-sm text-gray-900">
                  Buyer
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="role-seller"
                  name="role"
                  type="radio"
                  value="seller"
                  checked={role === 'seller'}
                  onChange={() => setRole('seller')}
                   disabled={isLoading}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="role-seller" className="ml-2 block text-sm text-gray-900">
                  Seller
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/account/login" className="font-medium text-blue-600 hover:text-blue-500">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}