'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyResetCode, resetUserPassword } from '@/lib/firebase/authActions';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null); // null: checking, true: valid, false: invalid
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing password reset code. Please request a new one.');
      setIsValidCode(false);
      return;
    }

    const checkCode = async () => {
      setIsLoading(true);
      try {
        const email = await verifyResetCode(oobCode);
        setUserEmail(email);
        setIsValidCode(true);
        setMessage(`You are resetting password for ${email}.`);
      } catch (err: any) {
        console.error("Verify Reset Code Error:", err);
        setError(err.message || 'Invalid or expired password reset code. Please request a new one.');
        setIsValidCode(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkCode();
  }, [oobCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }
    if (!oobCode) {
      setError("Password reset code is missing.");
      return;
    }

    setIsLoading(true);
    try {
      await resetUserPassword(oobCode, newPassword);
      setMessage('Your password has been successfully reset. You can now login with your new password.');
      // Optionally redirect to login after a delay
      setTimeout(() => router.push('/account/login'), 3000);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isValidCode === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <p className="text-gray-700">Verifying reset code...</p>
      </div>
    );
  }

  if (!isValidCode && !isLoading) { // Show error if code is invalid and not loading
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Link href="/account/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Request a new password reset link
            </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center text-gray-900">Reset Your Password</h1>
        {userEmail && <p className="text-sm text-center text-gray-600">Enter a new password for {userEmail}.</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
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

          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !isValidCode}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
        {message && (
             <p className="mt-6 text-center text-sm text-gray-600">
                <Link href="/account/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Back to Login
                </Link>
            </p>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}