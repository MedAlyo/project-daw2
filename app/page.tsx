'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFeaturedProducts, Product, getProductSuggestions } from '@/lib/firebase/firestoreActions';
import ProductCard from '@/components/products/ProductCard';
import { FiSearch, FiBox, FiShoppingBag, FiMapPin, FiThumbsUp } from 'react-icons/fi';

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const products = await getFeaturedProducts();
        setFeaturedProducts(products);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError('Failed to load featured products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const results = await getProductSuggestions(query.trim());
      setSuggestions(results);
      setIsSuggestionsVisible(results.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      debouncedFetchSuggestions(query);
    } else {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    router.push(`/products/${productId}`);
    setIsSuggestionsVisible(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSuggestionsVisible(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 py-8 md:py-12 bg-gradient-to-b from-slate-50 to-white">
      <section className="text-center py-12 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Shop Online, Discover Locally
          </h1>
          <p className="mb-10 text-lg text-gray-600 leading-relaxed">
            Find everything you need from the comfort of your home or from your favorite neighborhood stores. LocaShop connects you to the best of both worlds, seamlessly.
          </p>
          <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row justify-center items-center gap-3 mb-8 max-w-xl mx-auto">
            <div className="relative flex-grow w-full sm:w-auto">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20}/>
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-3 border border-gray-300 bg-white rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow hover:shadow-md"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchQuery.trim() && suggestions.length > 0) {
                    setIsSuggestionsVisible(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsSuggestionsVisible(false);
                  }, 150);
                }}
              />
              {isSuggestionsVisible && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingSuggestions ? (
                    <li className="px-4 py-2 text-gray-500">Loading...</li>
                  ) : (
                    suggestions.map(product => (
                      <li
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                        onMouseDown={() => handleSuggestionClick(product.id)}
                      >
                        {product.name}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg w-full sm:w-auto shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Search
            </button>
          </form>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm sm:text-base">
              <Link href="/products" className="flex items-center text-blue-600 hover:text-purple-700 font-medium transition-colors group">
                  <FiShoppingBag className="mr-2 transition-transform group-hover:rotate-[-5deg]" size={20}/> Browse All Products
              </Link>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link href="/shops" className="flex items-center text-blue-600 hover:text-purple-700 font-medium transition-colors group">
                  <FiMapPin className="mr-2 transition-transform group-hover:rotate-[5deg]" size={20}/> Explore Local Shops
              </Link>
          </div>
        </div>
      </section>

      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800 text-center">
            Featured Products
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg animate-pulse overflow-hidden">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="h-5 bg-gray-300 rounded-md mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded-md mb-3 w-1/2"></div>
                  <div className="h-6 bg-gray-300 rounded-md w-1/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">Oops! {error}</p>
              <p className='text-gray-600 text-sm mt-1'>Please check back later.</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 border border-gray-200 rounded-lg">
              <FiBox size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No featured products available right now.</p>
              <p className='text-gray-500 text-sm mt-1'>Explore other items or check back soon!</p>
            </div>
          )}
          
          {featuredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/products" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105">
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-12 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 text-center text-gray-800">
            How LocaShop Works
          </h2>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 text-center">
            <div className="p-6 bg-slate-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mx-auto shadow-md">
                <FiSearch size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Discover & Search</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse a wide range of products or use our smart search to find items available online or in stores near you.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white mx-auto shadow-md">
                <FiShoppingBag size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">2. Choose Your Way</h3>
              <p className="text-gray-600 leading-relaxed">
                Opt for convenient online delivery straight to your door or find the closest local shop for quick pickup.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-center mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white mx-auto shadow-md">
                <FiThumbsUp size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Enjoy & Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your products hassle-free and feel good about supporting local businesses when you shop nearby.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
