'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react'; // Added Suspense
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext'; // Added useAuth import

/**
 * Login page component with monochromatic styling.
 * Handles redirection for unverified emails and displays messages based on query params.
 */
function LoginPageContent() { // Renamed to LoginPageContent
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // For status messages
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams(); // Get search params

  // Effect to check for existing logged-in user
  useEffect(() => {
    if (user) {
      router.push('/'); // Or to a dashboard/profile page
    }
  }, [user, router]);

  // Effect to display message if redirected from registration
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'registered') {
      setInfoMessage('Registration successful! Please verify your email, then log in.');
      // Optionally, remove the query param from URL to prevent message on refresh
      // router.replace('/account/login', { scroll: false }); // Next.js 13+ way
    }
  }, [searchParams, router]);


  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null); // Clear info message on new login attempt
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check if email is verified
      if (userCredential.user && !userCredential.user.emailVerified) {
        // If email is not verified, redirect to the verify-email page
        router.push('/account/verify-email');
      } else {
        // If email is verified, proceed to the main application page
        router.push('/');
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
      setIsLoading(false); // Reset loading state on error
    }
    // Do not set isLoading to false here if successful, as router.push will navigate away
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center text-gray-900">Welcome Back</h1>

        {/* Display informational message if present */}
        {infoMessage && (
          <p className="text-blue-600 text-sm text-center bg-blue-50 p-3 rounded-md">{infoMessage}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="••••••••"
            />
          </div>
          {/* Forgot Password Link */}
          <div className="text-sm text-right">
            <Link href="/account/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </Link>
          </div>

          {/* Display Error Message */}
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {/* Submit Button - Blue accent */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        {/* Link to Register Page - Medium gray text, blue link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/account/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

// Wrap LoginPageContent with Suspense because useSearchParams must be used in a Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}