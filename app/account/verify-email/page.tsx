'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sendVerificationEmail } from '@/lib/firebase/authActions';
import { auth } from '@/lib/firebase/config';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      router.push('/');
    }
    if (!loading && !user) {
      router.push('/account/login');
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user) {
      setError('You must be logged in to resend a verification email.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsResending(true);
    try {
      await sendVerificationEmail(user);
      setMessage('A new verification email has been sent. Please check your inbox (and spam folder).');
    } catch (err: any) {
      console.error("Resend Verification Error:", err);
      setError(err.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (auth.currentUser) {
      setIsLoading(true);
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setMessage('Email successfully verified! Redirecting...');
          router.push('/');
        } else {
          setError('Email not yet verified. Please check your email or try resending.');
        }
      } catch (err) {
        console.error("Error reloading user:", err);
        setError('Could not check verification status. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <p className="text-gray-700">Loading user information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <p className="text-gray-700">Please login to verify your email.</p>
        <Link href="/account/login" className="mt-4 font-medium text-blue-600 hover:text-blue-500">
            Go to Login
        </Link>
      </div>
    );
  }

  if (user && user.emailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <p className="text-green-600">Your email is already verified!</p>
        <Link href="/" className="mt-4 font-medium text-blue-600 hover:text-blue-500">
            Go to Homepage
        </Link>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg border border-gray-200 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Verify Your Email Address</h1>
        <p className="text-gray-700">
          A verification email has been sent to <strong>{user?.email}</strong>.
          Please check your inbox (and spam folder) and click the link to verify your account.
        </p>

        {message && (
          <p className="text-green-600 text-sm">{message}</p>
        )}
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
            <button
                onClick={handleResendVerification}
                disabled={isResending || isLoading}
                className="w-full sm:w-auto flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {isResending ? 'Resending...' : 'Resend Verification Email'}
            </button>
             <button
                onClick={handleCheckVerification}
                disabled={isLoading || isResending}
                className="w-full sm:w-auto flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isLoading ? 'Checking...' : "I've Verified My Email"}
            </button>
        </div>

        <p className="mt-6 text-sm text-gray-600">
          Wrong email or need to change it?{' '}
          <Link href="/account/profile" className="font-medium text-blue-600 hover:text-blue-500">
            Go to Profile
          </Link>
          {' '}or{' '}
           <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}