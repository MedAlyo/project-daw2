'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // To ensure user is logged in

export default function Manage2FAPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-10">Loading user information...</div>;
  }

  if (!user) {
    // Or redirect to login
    return (
        <div className="text-center py-10">
            <p>Please <Link href="/account/login" className="text-blue-600 hover:underline">login</Link> to manage 2FA.</p>
        </div>
    );
  }

  // Placeholder content for 2FA management
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center text-gray-900">Two-Factor Authentication (2FA)</h1>
        <p className="text-gray-700 text-center">
          This feature is currently under development.
        </p>
        <p className="text-gray-600 text-sm text-center">
          Implementing 2FA via email requires sending a one-time code to your registered email address
          after you log in with your password. You would then enter that code to complete the login process.
        </p>
        {/* 
          Future implementation might include:
          - A button to "Enable Email 2FA"
          - If enabled, a button to "Disable Email 2FA"
          - Information about how it works
        */}
        <div className="mt-6 text-center">
            <Link href="/account/profile" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Profile
            </Link>
        </div>
      </div>
    </div>
  );
}