'use client';

import { useEffect, useState } from 'react';
import { getAllStores, Store } from '@/lib/firebase/firestoreActions';
import { getUserLocation, calculateDistance } from '@/lib/utils/location';
import Link from 'next/link';

interface StoreWithDistance extends Store {
  distance?: number;
}

export default function ShopsPage() {
  const [stores, setStores] = useState<StoreWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoresAndLocation = async () => {
      try {
        // Fetch stores
        const allStores = await getAllStores();
        
        // Try to get user location
        try {
          const location = await getUserLocation();
          setUserLocation(location);
          
          // Calculate distances for stores that have coordinates
          const storesWithDistance: StoreWithDistance[] = allStores.map(store => {
            if (store.latitude && store.longitude) {
              const distance = calculateDistance(
                location.lat,
                location.lng,
                store.latitude,
                store.longitude
              );
              return { ...store, distance };
            }
            return { ...store };
          });
          
          // Sort by distance (closest first)
          storesWithDistance.sort((a: StoreWithDistance, b: StoreWithDistance) => {
            if (a.distance && b.distance) return a.distance - b.distance;
            if (a.distance) return -1;
            if (b.distance) return 1;
            return 0;
          });
          
          setStores(storesWithDistance);
        } catch (locError) {
          console.warn('Could not get user location:', locError);
          setLocationError('Location access denied. Distances will not be shown.');
          setStores(allStores.map(store => ({ ...store })));
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Failed to load stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoresAndLocation();
  }, []);

  const getGoogleMapsUrl = (store: Store) => {
    if (store.latitude && store.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    } else if (store.address && store.city && store.country) {
      const address = `${store.address}, ${store.city}, ${store.country}`;
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shops</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
              <div className="bg-gray-200 h-32 rounded-md mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shops</h1>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shops</h1>
      <p className="text-gray-600 mb-4">Discover local shops and sellers in your area.</p>
      
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">{locationError}</p>
        </div>
      )}
      
      {userLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">📍 Showing distances from your current location</p>
        </div>
      )}
      
      {stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              {store.bannerUrl && (
                <img 
                  src={store.bannerUrl} 
                  alt={`${store.name} banner`}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              )}
              
              <div className="flex items-start gap-4">
                {store.logoUrl && (
                  <img 
                    src={store.logoUrl} 
                    alt={`${store.name} logo`}
                    className="w-16 h-16 object-cover rounded-full"
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{store.name}</h3>
                    {store.distance && (
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {store.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{store.description}</p>
                  
                  <div className="text-sm text-gray-500 mb-2">
                    {store.location ? (
                      <p>{store.location}</p>
                    ) : (
                      <>
                        <p>{store.address}</p>
                        <p>{store.city}, {store.country} {store.postalCode}</p>
                      </>
                    )}
                  </div>
                  
                  {store.categories && store.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {store.categories.slice(0, 3).map((category, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {store.categories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{store.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 flex-wrap">
                    <Link 
                      href={`/shops/${store.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Store
                    </Link>
                    {store.phone && (
                      <a 
                        href={`tel:${store.phone}`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Call
                      </a>
                    )}
                    <a 
                      href={getGoogleMapsUrl(store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      📍 Directions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No shops available at the moment.</p>
          <p className="text-gray-400 text-sm mt-2">Check back later for new local businesses!</p>
        </div>
      )}
    </div>
  );
}