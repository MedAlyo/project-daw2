'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase/firestoreActions';
import { FiLogIn, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    const errorCode = searchParams.get('error_code');

    if (status === 'registered') {
      setInfoMessage('Registration successful! Please check your email to verify your account and then log in.');
    } else if (status === 'verified') {
      setInfoMessage('Email successfully verified! You can now log in.');
    } else if (status === 'reset_sent') {
      setInfoMessage('Password reset email sent. Please check your inbox.');
    } else if (status === 'password_updated') {
      setInfoMessage('Password successfully updated. You can now log in with your new password.');
    } else if (message) {
      setInfoMessage(decodeURIComponent(message));
    }

    if (errorCode === 'auth/user-disabled') {
        setError("Your account has been disabled. Please contact support.");
    } else if (errorCode) {
        setError("An error occurred. Please try again.")
    }

  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.emailVerified) {
        const targetDashboard = user.role === 'seller' ? '/dashboard/seller' 
                              : user.role === 'buyer' ? '/' 
                              : '/'; 
        router.push(targetDashboard);
      } else {
        router.push('/account/verify-email?source=login');
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser && !firebaseUser.emailVerified) {
        setIsLoading(false);
        router.push('/account/verify-email?source=login&email=' + encodeURIComponent(email));
        return;
      }

      if (firebaseUser && firebaseUser.emailVerified) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setIsLoading(false);

        if (userProfile?.role === 'seller') {
          router.push('/dashboard/seller');
        } else if (userProfile?.role === 'buyer') {
          router.push('/dashboard/buyer');
        } else {
          router.push('/');
        }
        return;
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Your account may be temporarily locked. Please try again later or reset your password.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError(err.message || 'Failed to login. Please check your details and try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="text-center">
          <FiLogIn className="mx-auto text-5xl text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to continue to LocaShop.</p>
        </div>

        {infoMessage && (
          <div className="flex items-start p-3 text-sm text-blue-700 bg-blue-50 rounded-lg border border-blue-300">
            <FiCheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{infoMessage}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-300">
            <FiAlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 pr-4 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Email Address"
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="text-sm text-right">
            <Link href="/account/forgot-password" className="font-medium text-blue-600 hover:text-purple-700 hover:underline">
                Forgot your password?
            </Link>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-blue-500 disabled:opacity-60 transition duration-150 ease-in-out group"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <FiLogIn className="mr-2 h-5 w-5 transition-transform duration-150 ease-in-out group-hover:scale-110" />
                  Sign In
                </>
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/account/register" className="font-medium text-blue-600 hover:text-purple-700 hover:underline">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl border border-gray-200 text-center">
            <FiLogIn className="mx-auto text-5xl text-blue-600 mb-4 animate-pulse" />
            <h1 className="text-2xl font-semibold text-gray-700">Loading Login Page...</h1>
            <p className="text-gray-500">Please wait a moment.</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}