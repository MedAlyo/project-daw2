'use client'; // If you need client-side hooks like useAuth

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Assuming you want to display user info
import { useRouter } from 'next/navigation';
import { getStoreBySellerId, updateStoreDetails } from '@/lib/firebase/firestoreActions'; // TODO: Implement these functions
import { updateUserPassword } from '@/lib/firebase/authActions'; // TODO: Implement this function

// Define a type for the store data for better type safety
interface StoreData {
  name: string;
  location: string;
  // Add other store fields if necessary
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null); // To store the ID of the seller's store
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login'); // Redirect if not logged in
    }
    if (user && user.uid) {
      // Fetch store data when user is available
      const fetchStoreData = async () => {
        try {
          // TODO: Ensure getStoreBySellerId is implemented and handles cases where a store might not exist yet
          const storeData = await getStoreBySellerId(user.uid);
          if (storeData) {
            setShopName(storeData.name || '');
            setShopLocation(storeData.location || '');
            setStoreId(storeData.id); // Assuming storeData has an id field
          } else {
            // Handle case where no store is found for the seller, perhaps prompt to create one
            setFeedbackMessage('No shop found. You can create one from the dashboard.');
          }
        } catch (error) {
          console.error('Error fetching store data:', error);
          setFeedbackMessage('Failed to load shop details.');
        }
      };
      fetchStoreData();
    }
  }, [user, loading, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setFeedbackMessage('Please enter a new password.');
      return;
    }
    try {
      // TODO: Implement updateUserPassword in authActions.ts
      await updateUserPassword(newPassword);
      setFeedbackMessage('Password updated successfully!');
      setNewPassword(''); // Clear the input field
    } catch (error) {
      console.error('Error updating password:', error);
      setFeedbackMessage('Failed to update password. Please try again.');
    }
  };

  const handleShopDetailsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.uid || !storeId) {
        setFeedbackMessage('User or store information is missing.');
        return;
    }
    if (!shopName || !shopLocation) {
      setFeedbackMessage('Shop name and location cannot be empty.');
      return;
    }
    try {
      // TODO: Ensure updateStoreDetails is implemented in firestoreActions.ts
      await updateStoreDetails(storeId, { name: shopName, location: shopLocation });
      setFeedbackMessage('Shop details updated successfully!');
    } catch (error) {
      console.error('Error updating shop details:', error);
      setFeedbackMessage('Failed to update shop details. Please try again.');
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    return null; // Or a message prompting login, handled by redirect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      {feedbackMessage && <p className={`mb-4 ${feedbackMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{feedbackMessage}</p>}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="text-lg"><strong>Email:</strong> {user.email}</p>
        <p className="text-lg"><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
        {/* UID and Role are removed as per requirement */}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Update Password
          </button>
        </form>
      </div>

      {user.role === 'seller' && storeId && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Manage Shop</h2>
          <form onSubmit={handleShopDetailsUpdate}>
            <div className="mb-4">
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">Shop Name</label>
              <input
                type="text"
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="shopLocation" className="block text-sm font-medium text-gray-700">Shop Location</label>
              <input
                type="text"
                id="shopLocation"
                value={shopLocation}
                onChange={(e) => setShopLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Update Shop Details
            </button>
          </form>
        </div>
      )}
      {user.role === 'seller' && !storeId && !loading && (
         <p className="text-lg">You do not have a shop yet. Please create one from your dashboard.</p>
      )}

      {/* TODO: Add more profile information and edit functionality if needed */}
    </div>
  );
}