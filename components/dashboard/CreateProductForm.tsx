'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createProductListing, Product } from '@/lib/firebase/firestoreActions';

interface CreateProductFormProps {
  onProductCreated: (productId: string) => void; // Callback after product is created
  storeId: string; // <-- ADDED: Prop to receive the storeId
}

export default function CreateProductForm({ onProductCreated, storeId }: CreateProductFormProps) { // <-- UPDATED: Destructure storeId
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('draft'); // Default to draft
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError('You must be logged in to create a product.');
      return;
    }

    if (!storeId) { // <-- ADDED: Check if storeId is provided
      setError('Store ID is missing. Cannot create product.');
      return;
    }

    if (!productName || !description || !price || !stock) {
      setError('Please fill in all required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    setIsLoading(true);

    try {
      // Ensure the type here matches what createProductListing expects
      // Omit fields that are auto-generated or come from elsewhere (like sellerUid, storeId)
      const productData: Omit<Product, 'id' | 'sellerId' | 'storeId' | 'createdAt' | 'updatedAt' | 'imageUrl'> = {
        name: productName,
        description,
        price: priceNum,
        stock: stockNum,
        status, 
      };
      // Pass user.uid as sellerUid, the storeId, and the productData
      const productId = await createProductListing(user.uid, storeId, productData); // <-- UPDATED: Pass storeId
      setProductName('');
      setDescription('');
      setPrice('');
      setStock('');
      setStatus('draft');
      onProductCreated(productId); // Notify parent component
    } catch (err) {
      console.error('Failed to create product:', err);
      setError((err as Error).message || 'Failed to create product. Please try again.');
    } finally { // Corrected syntax: removed extra '}'
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Product</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock Quantity</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            min="0"
            step="1"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'draft')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}