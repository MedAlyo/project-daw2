'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Product, getProductById } from '@/lib/firebase/firestoreActions';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const { addItem } = useCart();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(productId);
        if (productData) {
          setProduct(productData);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId]);
  
  const handleAddToCart = () => {
    if (product && user) {
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
      setQuantity(1);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex flex-col justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-indigo-600 mb-4"></div>
        <p className="text-xl font-semibold text-indigo-700">Loading Product...</p>
        <p className="text-gray-600 mt-1">Please wait a moment.</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex justify-center items-center p-4">
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-12 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6 text-lg">{error || 'The product you are looking for does not exist or could not be loaded.'}</p>
          <Link href="/products" legacyBehavior>
            <a className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              Back to All Products
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ['/placeholder-image.png'];
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 py-8 sm:py-12 px-4">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-xl p-6 sm:p-8 md:p-10">
        <nav className="mb-6 sm:mb-8">
          <Link href="/products" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm inline-flex items-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Products
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                layout="fill"
                objectFit="contain" 
                priority 
              />
            </div>

            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all duration-150 ease-in-out ${selectedImageIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500 ring-offset-1' : 'border-gray-200 hover:border-indigo-400'}
                    `}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 py-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-indigo-600">${product.price.toFixed(2)}</p>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="inline-block bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                  Out of Stock
                </span>
              ) : (
                <span className="inline-block bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                  {product.stockQuantity} in stock
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {user && user.role === 'buyer' && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {!isOutOfStock && (
                  <div className="flex items-center space-x-3">
                    <label htmlFor="quantity" className="font-medium text-gray-700">Quantity:</label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    >
                      {Array.from({ length: Math.min(10, product.stockQuantity) }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${isOutOfStock
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                    }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            )}

            {!user && (
              <div className="bg-purple-50 border-l-4 border-purple-300 rounded-r-lg p-4 shadow-sm">
                <p className="text-purple-800">
                  Please <Link href="/account/login" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">log in</Link> to add items to your cart.
                </p>
              </div>
            )}

            {user && user.role === 'seller' && (
              <div className="bg-indigo-50 border-l-4 border-indigo-300 rounded-r-lg p-4 shadow-sm">
                <p className="text-indigo-800">
                  You are viewing this as a seller. Switch to a buyer account to purchase items.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}