'use client';
import { useState, useEffect } from 'react';
import { getProductsByProximity, Product, getAllStores, Store } from '@/lib/firebase/firestoreActions';
import { getUserLocation, calculateDistance } from '@/lib/utils/location';
import ProductCard from '@/components/products/ProductCard';

interface UserLocation {
  lat: number;
  lng: number;
}

interface ProductWithDistance extends Product {
  distance?: number;
  storeLocation?: { lat: number; lng: number };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(10);
  const [stores, setStores] = useState<Store[]>([]);
  
  const loadNearbyProducts = async (searchRadius: number = radius) => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await getUserLocation();
      setUserLocation(location);
      
      // Get all stores for location data
      const allStores = await getAllStores();
      setStores(allStores);
      
      const nearbyProducts = await getProductsByProximity(
        location.lat, location.lng, searchRadius
      );
      
      // Add distance and store location data to products
      const productsWithDistance: ProductWithDistance[] = nearbyProducts.map(product => {
        const store = allStores.find(s => s.id === product.storeId);
        if (store && store.latitude && store.longitude) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            store.latitude,
            store.longitude
          );
          return {
            ...product,
            distance,
            storeLocation: { lat: store.latitude, lng: store.longitude }
          };
        }
        return product;
      });
      
      // Sort by distance (closest first)
      productsWithDistance.sort((a, b) => {
        if (a.distance && b.distance) return a.distance - b.distance;
        if (a.distance) return -1;
        if (b.distance) return 1;
        return 0;
      });
      
      setProducts(productsWithDistance);
    } catch (error) {
      console.error('Error loading nearby products:', error);
      setError('Could not load products. Please enable location access and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadNearbyProducts();
  }, []);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation) {
      loadNearbyProducts(newRadius);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products Near You</h1>
        
        {/* Search radius selector */}
        {userLocation && (
          <div className="flex items-center space-x-2">
            <label htmlFor="radius" className="text-sm font-medium text-gray-700">
              Search radius:
            </label>
            <select
              id="radius"
              value={radius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Location info */}
      {userLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">📍 Searching within {radius}km of your location</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Unable to load products</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => loadNearbyProducts()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding products near you...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No products found nearby
          </h2>
          <p className="text-gray-600 mb-4">
            There are no active products within {radius}km of your location.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Try:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Increasing your search radius</li>
              <li>Checking back later for new products</li>
              <li>Visiting our shops page to see all available stores</li>
            </ul>
          </div>
          <button 
            onClick={() => handleRadiusChange(50)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Search within 50km
          </button>
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            Found {products.length} product{products.length !== 1 ? 's' : ''} near you
          </div>
          
          {/* Products grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
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
  );
}