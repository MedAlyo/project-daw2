'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getStoreBySellerId, updateStoreDetails } from '@/lib/firebase/firestoreActions';
import { updateUserPassword } from '@/lib/firebase/authActions';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center">Loading map...</div>
});

// Define a type for the store data for better type safety
interface StoreData {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  // Add other store fields if necessary
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopLatitude, setShopLatitude] = useState<number>(40.7128); // Default to NYC
  const [shopLongitude, setShopLongitude] = useState<number>(-74.0060);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [useMapForLocation, setUseMapForLocation] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login');
    }
    if (user && user.uid) {
      const fetchStoreData = async () => {
        try {
          const storeData = await getStoreBySellerId(user.uid);
          if (storeData) {
            setShopName(storeData.name || '');
            setShopLocation(storeData.location || '');
            setShopLatitude(storeData.latitude || 40.7128);
            setShopLongitude(storeData.longitude || -74.0060);
            setStoreId(storeData.id);
          } else {
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
      await updateUserPassword(newPassword);
      setFeedbackMessage('Password updated successfully!');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      setFeedbackMessage('Failed to update password. Please try again.');
    }
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setShopLatitude(lat);
    setShopLongitude(lng);
    setShopLocation(address);
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
      const updateData = { 
        name: shopName, 
        location: shopLocation,
        latitude: shopLatitude,
        longitude: shopLongitude
      };
      console.log('Updating store with data:', updateData); // Debug log
      await updateStoreDetails(storeId, updateData);
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
    return null;
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Shop Location</label>
                <button
                  type="button"
                  onClick={() => setUseMapForLocation(!useMapForLocation)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {useMapForLocation ? 'Use text input' : 'Use interactive map'}
                </button>
              </div>
              
              {useMapForLocation ? (
                <div className="space-y-2">
                  <LocationPicker
                    latitude={shopLatitude}
                    longitude={shopLongitude}
                    onLocationChange={handleLocationChange}
                  />
                  <p className="text-sm text-gray-600">Click on the map to set your shop location</p>
                  <input
                    type="text"
                    value={shopLocation}
                    onChange={(e) => setShopLocation(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Address will be auto-filled when you click on the map"
                    required
                  />
                </div>
              ) : (
                <input
                  type="text"
                  id="shopLocation"
                  value={shopLocation}
                  onChange={(e) => setShopLocation(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              )}
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
    </div>
  );
}