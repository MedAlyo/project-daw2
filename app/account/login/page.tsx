'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase/firestoreActions'; // Ensure this is correctly imported

// It's good practice to wrap the content that uses useSearchParams in Suspense
// if this page is not already doing so at a higher level in your layout.
// For this example, I'll assume Suspense is handled or we'll create a wrapper.

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth(); // user from AuthContext

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Display messages from query parameters (e.g., after registration or email verification)
  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    if (status === 'registered') {
      setInfoMessage('Registration successful! Please check your email to verify your account and then log in.');
    } else if (status === 'verified') {
      setInfoMessage('Email successfully verified! You can now log in.');
    } else if (message) {
      setInfoMessage(decodeURIComponent(message));
    }
  }, [searchParams]);

  // useEffect to handle users who are already logged in and visit the login page
  useEffect(() => {
    // Only run if auth state is not loading and user object from context exists
    if (!authLoading && user) {
      if (user.emailVerified) {
        // User is logged in and email is verified.
        // Redirect based on role from AuthContext if the role is available.
        if (user.role === 'seller') {
          router.push('/dashboard/seller');
        } else if (user.role === 'buyer') {
          router.push('/dashboard/buyer');
        } else if (user.role) {
          // Role is present in context but unexpected
          console.warn(`Login Page: User already logged in with unexpected role in context: ${user.role}. Redirecting to home.`);
          router.push('/');
        }
        // If user.role is undefined here, it means AuthContext might still be fetching it.
        // In this scenario, this useEffect should not prematurely redirect.
        // The handleLogin function is responsible for the redirect immediately after a new login attempt.
      } else {
        // User is logged in but email is not verified
        router.push('/account/verify-email');
      }
    }
    // If !authLoading && !user, they are not logged in, so they should stay on the login page.
  }, [user, authLoading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null); // Clear previous info messages on new login attempt
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Check if email is verified first
      if (firebaseUser && !firebaseUser.emailVerified) {
        setIsLoading(false);
        console.log('Redirecting to verify email page: /account/verify-email');
        router.push('/account/verify-email');
        return;
      }

      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setIsLoading(false);

          if (userProfile?.role === 'seller') {
            console.log('Redirecting seller to dashboard: /dashboard/seller');
            router.push('/dashboard/seller');
          } else if (userProfile?.role === 'buyer') {
            console.log('Redirecting buyer to dashboard: /dashboard/buyer');
            router.push('/dashboard/buyer');
          } else {
            console.log(`Redirecting to home due to unexpected role: '${userProfile?.role}'`);
            router.push('/');
          }
          return;
        } catch (profileError) {
          console.error("Error fetching user profile after login:", profileError);
          setError('Login successful, but failed to retrieve your user details. Please try again or contact support.');
          setIsLoading(false);
          // Optionally, you could sign the user out here if profile data is critical
          // await signOut(auth);
          return; // Exit function
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to login. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center text-gray-900">Login to Your Account</h1>

        {infoMessage && (
          <p className="text-blue-600 text-sm text-center p-3 bg-blue-50 rounded-md">{infoMessage}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-md">{error}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
          <div className="text-sm text-right">
            <Link href="/account/forgot-password" passHref className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
            </Link>
          </div>
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
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/account/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

// If you are using useSearchParams, the component needs to be wrapped in Suspense
// or be a child of a component that is.
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}