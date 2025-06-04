'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/firebase/firestoreActions';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface ProductCardProps {
  product: Product;
  userLocation?: { lat: number; lng: number } | null;
  storeLocation?: { lat: number; lng: number } | null;
  distance?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, userLocation, storeLocation, distance }) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';
  const isOutOfStock = product.stockQuantity <= 0;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product && user && user.role === 'buyer') {
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
    <div className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out overflow-hidden">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full h-48 bg-gray-200">
          <Image 
            src={imageUrl} 
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="group-hover:opacity-75 transition-opacity duration-200 ease-in-out"
          />
          {distance && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              {distance.toFixed(1)} km
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors" title={product.name}>
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xl font-bold text-gray-900 mt-1">
          ${product.price.toFixed(2)}
        </p>
        
        {isOutOfStock ? (
          <p className="text-sm text-red-600 mt-1">Out of Stock</p>
        ) : (
          <p className="text-sm text-green-600 mt-1">{product.stockQuantity} in stock</p>
        )}

        {/* Distance and directions */}
        {distance && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-gray-600">📍 {distance.toFixed(1)} km away</span>
            <a 
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Directions
            </a>
          </div>
        )}
        
        {/* add to cart button */}
        {user && user.role === 'buyer' && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full mt-3 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
        
        {!user && (
          <Link href="/account/login">
            <button className="w-full mt-3 py-2 px-4 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              Login to Purchase
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;