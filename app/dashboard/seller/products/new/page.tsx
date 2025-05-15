'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
// Assuming you'll create Firestore functions
import { addProduct } from '@/lib/firebase/firestoreActions'; // Import addProduct

/**
 * Seller Add New Product Page
 * Provides a form to add a new product.
 */
export default function AddNewProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>(''); // Use string for input
  const [stock, setStock] = useState<string>(''); // Use string for input
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Protect the route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">Loading user information...</p>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Basic validation
    if (!name || !description || !price || !stock) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    const priceNumber = parseFloat(price);
    const stockNumber = parseInt(stock, 10);

    if (isNaN(priceNumber) || priceNumber < 0) {
        setError('Please enter a valid price.');
        setIsLoading(false);
        return;
    }
     if (isNaN(stockNumber) || stockNumber < 0) {
        setError('Please enter a valid stock quantity.');
        setIsLoading(false);
        return;
    }


    // Prepare product data
    const productData = {
      sellerId: user.uid, // Associate product with the logged-in seller
      name,
      description,
      price: priceNumber,
      stock: stockNumber,
      imageUrl, // Optional
      // createdAt and updatedAt will be added in the firestoreActions function
    };

    try {
      // TODO: Implement addProduct function in firestoreActions.ts
      // This function should add the productData to the 'products' collection
      await addProduct(productData); // Call the imported addProduct function

      setSuccess('Product added successfully!');
      // Clear form or redirect
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImageUrl('');
      // Optional: Redirect after a delay
      // setTimeout(() => router.push('/dashboard/seller/products'), 2000);

    } catch (err: any) {
      console.error("Error adding product:", err);
      setError(err.message || 'Failed to add product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Product</h1>

      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
            ></textarea>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
            />
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              id="stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              min="0"
              step="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
            />
          </div>

           {/* Image URL (Optional) */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-70"
              disabled={isLoading}
            />
          </div>


          {success && (
            <p className="text-green-600 text-sm text-center">{success}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
            <Link href="/dashboard/seller/products" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Product List
            </Link>
        </div>
      </div>
    </div>
  );
}