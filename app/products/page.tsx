'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getProductsByProximity,
  getAllProducts,
  Product,
  getAllStores,
  Store
} from '@/lib/firebase/firestoreActions';
import { getUserLocation, calculateDistance } from '@/lib/utils/location';
import ProductCard from '@/components/products/ProductCard';
import {
  FiMapPin,
  FiSearch,
  FiAlertCircle,
  FiLoader,
  FiShoppingBag,
  FiChevronDown,
  FiInfo,
  FiFilter
} from 'react-icons/fi';

interface UserLocation {
  lat: number;
  lng: number;
}

interface ProductWithDistance extends Product {
  distance?: number;
  storeLocation?: { lat: number; lng: number }; 
}

function ProductsPageContent() {
  const [products, setProducts] = useState<ProductWithDistance[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const loadProducts = async (searchRadius: number = radius) => {
    try {
      setLoading(true);
      setError(null);
      let fetchedProducts: ProductWithDistance[] = [];
      let location: UserLocation | null = null;

      try {
        location = await getUserLocation();
        setUserLocation(location);
      } catch (locError) {
        console.warn('Could not get user location:', locError);
        setError('Could not determine your location. Showing all products or results based on your search.');
      }

      const allStores: Store[] = await getAllStores();

      if (searchQuery) {
        const allProductsData: Product[] = await getAllProducts();
        fetchedProducts = allProductsData.map(product => {
          const store = allStores.find((s) => s.id === product.storeId);
          let distance;
          let storeLoc;
          if (location && store && typeof store.latitude === 'number' && typeof store.longitude === 'number') {
            distance = calculateDistance(
              location.lat,
              location.lng,
              store.latitude,
              store.longitude
            );
            storeLoc = { lat: store.latitude, lng: store.longitude };
          }
          return {
            ...product,
            distance,
            storeLocation: storeLoc,
          };
        });
      } else if (location) {
        const nearbyProductsData: Product[] = await getProductsByProximity(
          location.lat,
          location.lng,
          searchRadius
        );
        fetchedProducts = nearbyProductsData.map(product => {
          const store = allStores.find((s) => s.id === product.storeId);
          let distance;
          let storeLoc;
          if (location && store && typeof store.latitude === 'number' && typeof store.longitude === 'number') {
            distance = calculateDistance(
              location.lat,
              location.lng,
              store.latitude,
              store.longitude
            );
            storeLoc = { lat: store.latitude, lng: store.longitude };
          }
          return {
            ...product,
            distance,
            storeLocation: storeLoc,
          };
        });
      } else {
        const allProductsData: Product[] = await getAllProducts();
         fetchedProducts = allProductsData.map(product => {
          const store = allStores.find((s) => s.id === product.storeId);
          let storeLoc;
          if (store && typeof store.latitude === 'number' && typeof store.longitude === 'number') {
            storeLoc = { lat: store.latitude, lng: store.longitude };
          }
          return {
            ...product,
            storeLocation: storeLoc,
          };
        });
        if (!error) setError('Showing all products as location is unavailable.');
      }

      fetchedProducts.sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance;
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      });

      setProducts(fetchedProducts);

    } catch (err) {
      console.error('Error loading products:', err);
      if (!error) {
        setError(
          'Could not load products. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(radius);
  }, [radius]);

  useEffect(() => {
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseQuery) ||
          (product.description && product.description.toLowerCase().includes(lowerCaseQuery)) ||
          (product.category && product.category.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);


  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  const displayProducts = searchQuery ? filteredProducts : products;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {searchQuery ? `Results for "${searchQuery}"` : 'Products Near You'}
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {searchQuery 
              ? `Showing products matching your search. Clear search to see all nearby items.`
              : 'Discover items from local sellers based on your current location.'}
          </p>
        </header>

        {userLocation && !searchQuery && (
          <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center text-sm text-green-600">
              <FiMapPin className="w-5 h-5 mr-2" />
              <span>Searching within {radius < 1 ? `${radius * 1000}m` : `${radius}km`} of your current location.</span>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="radius" className="text-sm font-medium text-gray-700">
                <FiSearch className="inline w-4 h-4 mr-1" />
                Search radius:
              </label>
              <div className="relative">
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8 shadow-sm"
                >
                  <option value={0.5}>500 m</option>
                  <option value={1}>1 km</option>
                  <option value={2}>2 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg shadow-sm flex items-start">
            <FiAlertCircle className="w-6 h-6 mr-3 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Unable to load products</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => loadProducts()} 
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 underline transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mb-5" />
            <p className="text-xl font-semibold text-gray-700">Finding products...</p>
            <p className="text-gray-500 mt-1">Please wait a moment.</p>
          </div>
        ) : displayProducts.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-8">
              <FiSearch className="w-20 h-20 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                No Results for "{searchQuery}"
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any products matching your search term.
                Try a different search, or clear the search to see products near you.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <p className="font-medium text-gray-700">Suggestions:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
                  <li>Check your spelling or try different keywords.</li>
                  <li>Try a more general search term.</li>
                  <li><a href="/products" className="text-blue-600 hover:underline">Clear search</a> to see all available products nearby.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-lg shadow-lg p-8">
              <FiShoppingBag className="w-20 h-20 text-blue-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                No Products Found Nearby
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                There are currently no active products within {radius < 1 ? `${radius * 1000}m` : `${radius}km`} of your location, or matching your current filters.
                Try expanding your search radius or check back later!
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <p className="font-medium text-gray-700">Suggestions:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
                  <li>Increase your search radius using the selector above (if location is active).</li>
                  <li>Ensure your browser has location permissions enabled for this site.</li>
                  <li>Check back later as new products are added frequently.</li>
                </ul>
              </div>
              {userLocation && (
                <button
                  onClick={() => handleRadiusChange(Math.min(radius * 2, 50))}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Expand Search to {Math.min(radius * 2, 50) < 1 ? `${Math.min(radius * 2, 50) * 1000}m` : `${Math.min(radius * 2, 50)}km`}
                </button>
              )}
            </div>
          )
        ) : (
          <>
            {(searchQuery && displayProducts.length > 0) && (
                <div className="mb-6 text-sm text-gray-600 flex items-center bg-blue-50 p-3 rounded-md border border-blue-200">
                    <FiFilter className="w-4 h-4 mr-2 text-blue-600" />
                    Showing {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} matching "{searchQuery}". 
                    {userLocation && `Sorted by proximity.`}
                    <a href="/products" className="ml-2 text-blue-600 hover:underline text-xs font-medium">(Clear Search)</a>
                </div>
            )}
            {(!searchQuery && displayProducts.length > 0 && userLocation) && (
                <div className="mb-6 text-sm text-gray-600 flex items-center">
                    <FiInfo className="w-4 h-4 mr-2 text-blue-500" />
                    Found {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} within {radius < 1 ? `${radius * 1000}m` : `${radius}km`}.
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userLocation={userLocation}
                  storeLocation={product.storeLocation}
                  distance={product.distance}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen py-24 text-center"><FiLoader className="w-12 h-12 text-blue-600 animate-spin mb-5" /><p className="text-xl font-semibold text-gray-700">Loading page...</p></div>}> 
      <ProductsPageContent />
    </Suspense>
  );
}