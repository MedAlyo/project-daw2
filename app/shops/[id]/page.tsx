'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getStoreById, getProductsByStoreId, Store, Product } from '@/lib/firebase/firestoreActions';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        console.log('Fetching store data for ID:', storeId); // Add this
        setIsLoading(true);
        
        // Fetch store details
        const storeData = await getStoreById(storeId);
        console.log('Store data received:', storeData); // Add this
        if (!storeData) {
          setError('Store not found');
          return;
        }
        setStore(storeData);
        
        // Fetch store products
        const storeProducts = await getProductsByStoreId(storeId);
        console.log('Products received:', storeProducts); // Add this
        setProducts(storeProducts);
        
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError('Failed to load store information');
      } finally {
        setIsLoading(false);
      }
    };

    if (storeId) {
      fetchStoreData();
    } else {
      console.log('No store ID provided'); // Add this
    }
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">Loading Store Details...</p>
          <p className="text-gray-500 text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Store Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">{error || 'We couldn\'t find the store you\'re looking for. It might have been moved or deleted.'}</p>
        <Link 
          href="/shops"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Back to All Shops
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="bg-white shadow-lg pb-8">
        <div className="max-w-7xl mx-auto">
          {store.bannerUrl && (
            <div className="w-full h-56 sm:h-72 md:h-80 lg:h-96 shadow-inner overflow-hidden bg-gray-200">
              <img 
                src={store.bannerUrl} 
                alt={`${store.name} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className={`flex flex-col sm:flex-row items-start gap-6 ${store.bannerUrl ? '-mt-16 sm:-mt-20' : 'pt-8' }`}>
              {store.logoUrl && (
                <div className="flex-shrink-0 z-10">
                  <img 
                    src={store.logoUrl} 
                    alt={`${store.name} logo`}
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-full border-4 border-white bg-white shadow-xl"
                  />
                </div>
              )}
              
              <div className={`flex-1 ${store.logoUrl ? 'pt-4 sm:pt-6' : ''}`}>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 break-words">{store.name}</h1>
                {store.description && (
                  <p className="text-gray-600 text-base sm:text-lg mb-4 leading-relaxed">{store.description}</p>
                )}
                
                {store.categories && store.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {store.categories.map((category, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium rounded-full shadow-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700 mt-4 pt-4 border-t border-gray-200">
                  {(store.location || store.address || store.city || store.country) && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1 text-base">Location</h3>
                      {store.location ? (
                        <p>{store.location}</p>
                      ) : (
                        <>
                          {store.address && <p>{store.address}</p>}
                          {(store.city || store.country || store.postalCode) && 
                            <p>{[store.city, store.country, store.postalCode].filter(Boolean).join(', ')}</p>}
                        </>
                      )}
                      {(store.latitude && store.longitude) && (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 group-hover:text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Get Directions
                        </a>
                      )}
                    </div>
                  )}
                  
                  {store.phone && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1 text-base">Contact</h3>
                      <a 
                        href={`tel:${store.phone}`}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 group-hover:text-indigo-700" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {store.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Products <span className="text-gray-500 font-normal">({products.length})</span>
          </h2>
          <Link 
            href="/shops"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 transform transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Shops
          </Link>
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl bg-white">
            <div className="text-gray-400 mb-6">
              <svg className="w-20 h-20 mx-auto opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">This store is busy setting things up! Check back soon to see their amazing products.</p>
          </div>
        )}
      </div>
    </div>
  );
}