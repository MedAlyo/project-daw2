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
      // reset quantity after adding
      setQuantity(1);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-800 underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }
  
  const images = product.images && product.images.length > 0 ? product.images : ['/placeholder-image.png'];
  const isOutOfStock = product.stockQuantity <= 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* breadcrumb */}
      <nav className="mb-6">
        <Link href="/products" className="text-blue-600 hover:text-blue-800">
          ← Back to Products
        </Link>
      </nav>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* product images */}
        <div className="space-y-4">
          {/* main image */}
          <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
            <Image
              src={images[selectedImageIndex]}
              alt={product.name}
              layout="fill"
              objectFit="cover"
            />
          </div>
          
          {/* thumbnail images */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 ${
                    selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* product details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</p>
          </div>
          
          {/* stock status */}
          <div>
            {isOutOfStock ? (
              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                Out of Stock
              </span>
            ) : (
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {product.stockQuantity} in stock
              </span>
            )}
          </div>
          
          {/* description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
          
          {/* add to cart section */}
          {user && user.role === 'buyer' && (
            <div className="space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="font-medium">Quantity:</label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2"
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
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          )}
          
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                Please <Link href="/account/login" className="text-blue-600 hover:text-blue-800 underline">log in</Link> to add items to your cart.
              </p>
            </div>
          )}
          
          {user && user.role === 'seller' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                You are viewing this as a seller. Switch to a buyer account to purchase items.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}