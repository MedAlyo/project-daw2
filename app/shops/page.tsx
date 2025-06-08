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
        const allStores = await getAllStores();
        
        try {
          const location = await getUserLocation();
          setUserLocation(location);
          
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
    } else if (store.address) { // Use store.address directly
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-700">Discover Shops</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg animate-pulse">
                <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-700">Discover Shops</h1>
          <div className="text-center py-12">
            <p className="text-red-600 text-xl">{error}</p>
            <p className="text-gray-600 mt-2">We couldn't load the shops. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-center text-gray-700">Discover Shops</h1>
        <p className="text-gray-600 mb-8 text-center text-lg">Explore local shops and unique sellers in your area.</p>
        
        {stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
              >
                {store.bannerImageUrl && (
                  <img 
                    src={store.bannerImageUrl} 
                    alt={`${store.name} banner`}
                    className="w-full h-36 object-cover rounded-lg mb-4 shadow-sm"
                  />
                )}
                
                <div className="flex items-start gap-4">
                  {store.profilePictureUrl && (
                    <img 
                      src={store.profilePictureUrl} 
                      alt={`${store.name} logo`}
                      className="w-16 h-16 object-cover rounded-full border-2 border-gray-200 shadow-sm"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-xl font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                        <Link href={`/shops/${store.id}`}>{store.name}</Link>
                      </h3>
                      {store.distance !== undefined && (
                        <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                          {store.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed line-clamp-2">{store.description}</p>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      {store.address && <p>{store.address}</p>}
                    </div>
                    
                    {store.tags && store.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {store.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                        {store.tags.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs rounded-full shadow-sm">
                            +{store.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-auto pt-3 border-t border-gray-200">
                      <Link 
                        href={`/shops/${store.id}`}
                        className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 ease-in-out transform hover:scale-105 flex-grow sm:flex-grow-0"
                      >
                        View Store
                      </Link>
                      {store.contactPhone && (
                        <a 
                          href={`tel:${store.contactPhone}`}
                          className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex-grow sm:flex-grow-0"
                        >
                          Call
                        </a>
                      )}
                      <a 
                        href={getGoogleMapsUrl(store)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex-grow sm:flex-grow-0"
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
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 6v.01M12 18v.01" />
            </svg>
            <h3 className="mt-2 text-2xl font-semibold text-gray-700">No Shops Found</h3>
            <p className="mt-1 text-gray-500">We couldn't find any shops matching your criteria or there are no shops available yet.</p>
            <p className="text-gray-500 text-sm mt-1">Check back later for new local businesses!</p>
          </div>
        )}
      </div>
    </div>
  );
}