'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getStoreBySellerId, updateStoreDetails } from '@/lib/firebase/firestoreActions';
import { updateUserPassword } from '@/lib/firebase/authActions';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>
});

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
            setShopLocation(storeData.address || ''); // Changed from storeData.location
            setShopLatitude(storeData.latitude || 40.7128);
            setShopLongitude(storeData.longitude || -74.0060);
            setStoreId(storeData.id);
          } else {
            if (user.role !== 'buyer') {
              setFeedbackMessage('No shop found. You can create one from the dashboard.');
            }
          }
        } catch (error) {
          console.error('Error fetching store data:', error);
          if (user.role !== 'buyer') {
            setFeedbackMessage('Failed to load shop details.');
          }
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
      console.log('Updating store with data:', updateData);
      await updateStoreDetails(storeId, updateData);
      setFeedbackMessage('Shop details updated successfully!');
    } catch (error) {
      console.error('Error updating shop details:', error);
      setFeedbackMessage('Failed to update shop details. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">My Profile</h1>
        {feedbackMessage && (
          <div
            className={`mb-6 p-4 rounded-md text-sm ${ 
              feedbackMessage.includes('success') 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
            role="alert"
          >
            {feedbackMessage}
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Account Information</h2>
          <div className="space-y-3">
            <p className="text-md text-gray-600">
              <strong className="font-medium text-gray-800">Email:</strong> {user.email}
            </p>
            <p className="text-md text-gray-600">
              <strong className="font-medium text-gray-800">Display Name:</strong> {user.displayName || 'Not set'}
            </p>
             <p className="text-md text-gray-600">
              <strong className="font-medium text-gray-800">Role:</strong> <span className="capitalize">{user.role || 'Not set'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                required
                placeholder="Enter new password"
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Password
            </button>
          </form>
        </div>

        {user.role === 'seller' && storeId && (
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 border-b pb-3">Manage Shop</h2>
            <form onSubmit={handleShopDetailsUpdate} className="space-y-6">
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                  required
                  placeholder="Your Awesome Shop"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Shop Location</label>
                  <button
                    type="button"
                    onClick={() => setUseMapForLocation(!useMapForLocation)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {useMapForLocation ? 'Enter address manually' : 'Pin on map'}
                  </button>
                </div>

                {useMapForLocation ? (
                  <div className="space-y-3">
                    <div className="h-72 w-full rounded-lg overflow-hidden border border-gray-300">
                        <LocationPicker
                            latitude={shopLatitude}
                            longitude={shopLongitude}
                            onLocationChange={handleLocationChange}
                        />
                    </div>
                    <p className="text-xs text-gray-500 italic text-center">Click on the map to set your shop location. The address below will update.</p>
                    <input
                      type="text"
                      value={shopLocation}
                      onChange={(e) => setShopLocation(e.target.value)} // Allow manual edit if needed
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                      placeholder="Address (auto-filled from map or enter manually)"
                      required
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    id="shopLocation"
                    value={shopLocation}
                    onChange={(e) => setShopLocation(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                    required
                    placeholder="Enter shop address"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Update Shop Details
              </button>
            </form>
          </div>
        )}
        {user.role === 'seller' && !storeId && !loading && (
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 text-center">
            <p className="text-md text-gray-600">You do not have a shop yet.</p>
            <p className="text-sm text-gray-500 mt-2">Please create one from your seller dashboard to manage it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}