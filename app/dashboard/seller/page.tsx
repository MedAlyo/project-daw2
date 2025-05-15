'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

/**
 * Seller Dashboard Page
 * Displays content relevant to a seller and protects the route.
 * Redirects to buyer dashboard if user is a buyer.
 */
export default function SellerDashboardPage() {
  const { user, loading } = useAuth(); // Get user and loading state from context
  const router = useRouter();

  // Protect the route: Redirect if not authenticated or if user is a buyer
  useEffect(() => {
     // Wait until loading is false to check user status
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/account/login');
      } else if (user.role === 'buyer') {
        // Redirect to buyer dashboard if user is a buyer
        router.push('/dashboard/buyer');
      }
    }
  }, [user, loading, router]); // Depend on user, loading, and router

  // Show loading state while checking auth status or if user is null/undefined initially
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  // Once loaded and user is confirmed as a seller
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>
       {/* Use user.displayName which is set during registration */}
      <p className="text-gray-700">Welcome, {user.displayName || user.email}!</p>

      {/* TODO: Add seller-specific content here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example Section: Your Listings */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Listings</h2>
          <p className="text-gray-600">Display a list of products the seller has listed.</p>
           {/* Placeholder for listings list */}
           <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Product X - Active</li>
            <li className="text-gray-700">Product Y - Draft</li>
            {/* ... more listings */}
          </ul>
        </div>

        {/* Example Section: Pending Orders */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Orders</h2>
          <p className="text-gray-600">Display orders that need processing.</p>
           {/* Placeholder for pending orders list */}
           <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Order #12346 - New</li>
            <li className="text-gray-700">Order #12347 - Processing</li>
            {/* ... more orders */}
          </ul>
        </div>
      </div>

      {/* Add more sections as needed */}
    </div>
  );
}