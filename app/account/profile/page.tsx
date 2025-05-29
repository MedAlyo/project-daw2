'use client'; // If you need client-side hooks like useAuth

import React from 'react';
import { useAuth } from '@/context/AuthContext'; // Assuming you want to display user info
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login'); // Redirect if not logged in
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    return null; // Or a message prompting login, handled by redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <p className="text-lg"><strong>Email:</strong> {user.email}</p>
        <p className="text-lg"><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
        <p className="text-lg"><strong>UID:</strong> {user.uid}</p>
        <p className="text-lg"><strong>Role:</strong> {user.role || 'Not set'}</p>
        {/* TODO: Add more profile information and edit functionality */}
      </div>
    </div>
  );
}