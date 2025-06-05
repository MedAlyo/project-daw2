'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getStoreById, getProductsByStoreId, Store, Product } from '@/lib/firebase/firestoreActions';
import ProductCard from '@/components/products/ProductCard';
import Link from 'next/link';

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;
  
  // Add this debug log
  console.log('Store ID from params:', storeId);
  
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Store Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The store you are looking for does not exist.'}</p>
          <Link 
            href="/shops"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Banner Image */}
          {store.bannerUrl && (
            <div className="w-full h-64 mb-6 rounded-lg overflow-hidden">
              <img 
                src={store.bannerUrl} 
                alt={`${store.name} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Store Info */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            {store.logoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={store.logoUrl} 
                  alt={`${store.name} logo`}
                  className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                />
              </div>
            )}
            
            {/* Store Details */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{store.name}</h1>
              {store.description && (
                <p className="text-gray-600 text-lg mb-4">{store.description}</p>
              )}
              
              {/* Categories */}
              {store.categories && store.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {store.categories.map((category, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                {(store.location || store.address || store.city || store.country) && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Address</h3>
                    {/* Debug info - remove after testing */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-400 mb-2">
                        Debug: location="{store.location}", lat={store.latitude}, lng={store.longitude}
                      </div>
                    )}
                    {store.location ? (
                      <p>{store.location}</p>
                    ) : (
                      <>
                        <p>{store.address}</p>
                        <p>{store.city}, {store.country} {store.postalCode}</p>
                      </>
                    )}
                    {/* Add directions button */}
                    {(store.latitude && store.longitude) && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        📍 Get Directions
                      </a>
                    )}
                  </div>
                )}
                
                {store.phone && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Contact</h3>
                    <a 
                      href={`tel:${store.phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {store.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Products ({products.length})
          </h2>
          <Link 
            href="/shops"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to All Shops
          </Link>
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Products Available</h3>
            <p className="text-gray-600">This store hasn't added any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}