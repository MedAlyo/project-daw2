'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/firebase/firestoreActions';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FiMapPin, FiShoppingCart, FiLogIn, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';

interface ProductCardProps {
  product: Product;
  userLocation?: { lat: number; lng: number } | null;
  storeLocation?: { lat: number; lng: number } | null;
  distance?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, distance, storeLocation }) => {
  const { addItem } = useCart();
  const { user } = useAuth();

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product && user && user.role === 'buyer' && !isOutOfStock) {
      addItem(product);
    }
  };

  const getGoogleMapsUrl = () => {
    if (storeLocation) {
      return `https://www.google.com/maps/dir/?api=1&destination=${storeLocation.lat},${storeLocation.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.name)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col h-full group">
      <Link href={`/products/${product.id}`} className="block relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
        {distance !== undefined && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center">
            <FiMapPin className="w-3 h-3 mr-1" /> {distance.toFixed(1)} km
          </div>
        )}
        {isOutOfStock && (
            <div className="absolute bottom-2 left-2 bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center">
                <FiAlertTriangle className="w-3 h-3 mr-1" /> Out of Stock
            </div>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <Link href={`/products/${product.id}`} className="block mb-1">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 truncate" title={product.name}>
            {product.name}
          </h3>
        </Link>

        <p className="text-2xl font-bold text-gray-900 mb-2">
          ${product.price.toFixed(2)}
        </p>

        {!isOutOfStock && product.stockQuantity > 0 && (
          <p className="text-sm text-green-600 mb-2 font-medium">
            {product.stockQuantity} in stock
          </p>
        )}

        {distance !== undefined && storeLocation && (
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center mb-3 transition-colors"
          >
            <FiExternalLink className="w-3 h-3 mr-1" /> Get Directions
          </a>
        )}

        <div className="mt-auto pt-3">
          {user && user.role === 'buyer' && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out flex items-center justify-center shadow-sm hover:shadow-md transform hover:scale-105 ${isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
            >
              <FiShoppingCart className="w-4 h-4 mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}

          {!user && (
            <Link href="/account/login" className="block w-full">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors duration-300 ease-in-out flex items-center justify-center shadow-sm hover:shadow-md">
                <FiLogIn className="w-4 h-4 mr-2" />
                Login to Purchase
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;