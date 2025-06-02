'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, updateProduct, Product } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState(''); // Renamed from stock to stockQuantity
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/account/login');
      return;
    }
    if (user.role !== 'seller') {
      router.push('/dashboard/buyer'); // Or some other appropriate page
      return;
    }

    if (productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedProduct = await getProductById(productId);
          if (fetchedProduct) {
            if (fetchedProduct.sellerId !== user.uid) {
              setError('You are not authorized to edit this product.');
              setProduct(null);
            } else {
              setProduct(fetchedProduct);
              setName(fetchedProduct.name);
              setDescription(fetchedProduct.description);
              setPrice(fetchedProduct.price.toString());
              setStockQuantity(fetchedProduct.stockQuantity.toString()); // Changed from fetchedProduct.stock
              setStatus(fetchedProduct.status);
            }
          } else {
            setError('Product not found.');
          }
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Failed to load product details. Please try again.');
        }
        setIsLoading(false);
      };
      fetchProduct();
    }
  }, [productId, user, authLoading, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!product || !user || user.uid !== product.sellerId) {
      setError('Cannot update product. Authorization failed or product not loaded.');
      console.error('Update failed: Authorization or product not loaded.', { product, user });
      return;
    }

    // Basic Validation
    if (!name.trim() || !description.trim() || !price.trim() || !stockQuantity.trim()) { // Changed from stock.trim()
      setError('All fields except image are required.');
      console.error('Update failed: Validation error - missing fields.');
      return;
    }
    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stockQuantity, 10); // Changed from stock
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Price must be a positive number.');
      console.error('Update failed: Validation error - invalid price.');
      return;
    }
    if (isNaN(numericStock) || numericStock < 0) {
      setError('Stock must be a non-negative number.');
      console.error('Update failed: Validation error - invalid stock.'); // Consider changing log message too
      return;
    }

    setIsLoading(true);
    try {
      const productDataToUpdate = {
        name: name.trim(),
        description: description.trim(),
        price: numericPrice,
        stockQuantity: numericStock, // Changed from stock
        status,
      };
      console.log('Attempting to update product with ID:', productId, 'Data:', productDataToUpdate);
      await updateProduct(productId, productDataToUpdate);
      setSuccessMessage('Product updated successfully!');
      console.log('Product updated successfully:', productId);
      // Update local product state with the new data, using Timestamp.now() for updatedAt
      setProduct(prev => 
        prev 
          ? { 
              ...prev, 
              ...productDataToUpdate, 
              updatedAt: Timestamp.now() // Corrected: Use Timestamp.now()
            } 
          : null
      );
    } catch (err) {
      console.error('Error updating product in handleSubmit:', err);
      setError('Failed to update product. Please try again. Check console for details.');
    }
    setIsLoading(false);
  };

  if (authLoading || (isLoading && !error && !product)) {
    return <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading product details...</p></div>;
  }

  if (error && !product) { // Show error if product couldn't be loaded at all
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500 text-center">{error}</p>
        <div className="text-center mt-4">
          <Link href="/dashboard/seller" legacyBehavior>
            <a className="text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Dashboard
            </a>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!product) { // Should ideally be covered by isLoading or error states
      return <div className="flex justify-center items-center h-screen"><p className="text-lg">Product not found or not authorized.</p></div>;
  }


  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Edit Product</h1>
            <Link href="/dashboard/seller" legacyBehavior>
              <a className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                &larr; Back to Dashboard
              </a>
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
              <strong className="font-bold">Success: </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0.01"
                  step="0.01"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock" // HTML name attribute can remain 'stock' if preferred, but ensure consistency
                  id="stock"   // HTML id attribute can remain 'stock' if preferred
                  required
                  min="0"
                  step="1"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={stockQuantity} // Changed from stock
                  onChange={(e) => setStockQuantity(e.target.value)} // Changed from setStock
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                id="status"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'draft')}
                disabled={isLoading}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
            
            {/* Placeholder for image upload if you add it later */}
            {/* 
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Product Image (Optional)
              </label>
              <input type="file" name="image" id="image" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
            */}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}