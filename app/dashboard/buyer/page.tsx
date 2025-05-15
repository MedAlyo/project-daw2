'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

/**
 * Buyer Dashboard Page
 * Displays content relevant to a buyer and protects the route.
 * Redirects to seller dashboard if user is a seller.
 */
export default function BuyerDashboardPage() {
  const { user, loading } = useAuth(); // Get user and loading state from context
  const router = useRouter();

  // Protect the route: Redirect if not authenticated or if user is a seller
  useEffect(() => {
    // Wait until loading is false to check user status
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/account/login');
      } else if (user.role === 'seller') {
        // Redirect to seller dashboard if user is a seller
        router.push('/dashboard/seller');
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

  // Once loaded and user is confirmed as a buyer
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Buyer Dashboard</h1>
      {/* Use user.displayName which is set during registration */}
      <p className="text-gray-700">Welcome, {user.displayName || user.email}!</p>

      {/* TODO: Add buyer-specific content here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example Section: Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <p className="text-gray-600">Display a list of recent orders here.</p>
          {/* Placeholder for order list */}
          <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Order #12345 - Pending</li>
            <li className="text-gray-700">Order #12344 - Delivered</li>
            {/* ... more orders */}
          </ul>
        </div>

        {/* Example Section: Saved Items */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Items</h2>
          <p className="text-gray-600">Display items the user has saved.</p>
           {/* Placeholder for saved items list */}
           <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Product A</li>
            <li className="text-gray-700">Product B</li>
            {/* ... more saved items */}
          </ul>
        </div>
      </div>

      {/* Add more sections as needed */}
    </div>
  );
}