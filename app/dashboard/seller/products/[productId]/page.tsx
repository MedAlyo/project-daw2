'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductById, updateProduct, Product } from '@/lib/firebase/firestoreActions';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';


export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/account/login');
      return;
    }
    if (user.role !== 'seller') {
      router.push('/dashboard/buyer');
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
              setStockQuantity(fetchedProduct.stockQuantity.toString());
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
    if (!name.trim() || !description.trim() || !price.trim() || !stockQuantity.trim()) {
      setError('All fields except image are required.');
      console.error('Update failed: Validation error - missing fields.');
      return;
    }
    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stockQuantity, 10);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Price must be a positive number.');
      console.error('Update failed: Validation error - invalid price.');
      return;
    }
    if (isNaN(numericStock) || numericStock < 0) {
      setError('Stock must be a non-negative number.');
      console.error('Update failed: Validation error - invalid stock.');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = product.images?.[0] || '';
      
      if (imageFile) {
        setIsUploadingImage(true);
        const storage = getStorage();
        const imageRef = ref(storage, `products/${productId}/image-${crypto.randomUUID()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
        setIsUploadingImage(false);
      }

      const productDataToUpdate = {
        name: name.trim(),
        description: description.trim(),
        price: numericPrice,
        stockQuantity: numericStock,
        status,
        images: imageUrl ? [imageUrl] : product.images || [],
      };
      
      console.log('Attempting to update product with ID:', productId, 'Data:', productDataToUpdate);
      await updateProduct(productId, productDataToUpdate);
      setSuccessMessage('Product updated successfully!');
      console.log('Product updated successfully:', productId);
      setProduct(prev => 
        prev 
          ? { 
              ...prev, 
              ...productDataToUpdate, 
              updatedAt: Timestamp.now()
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex justify-center items-center p-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-indigo-600">Loading product details...</p>
          <p className="text-gray-500 mt-2">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex justify-center items-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
          <div className="mt-6">
            <Link href="/dashboard/seller" legacyBehavior>
              <a className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors">
                Back to Dashboard
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 flex justify-center items-center p-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Product not found or not authorized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Edit Product
            </h1>
            <Link href="/dashboard/seller" legacyBehavior>
              <a className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap mt-1">
                &larr; Back to Dashboard
              </a>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 text-green-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading || isUploadingImage}
                placeholder="e.g. Handcrafted Wooden Bowl"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || isUploadingImage}
                placeholder="Describe your product in detail..."
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isLoading || isUploadingImage}
                  placeholder="e.g. 29.99"
                />
              </div>
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  id="stockQuantity"
                  required
                  min="0"
                  step="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  disabled={isLoading || isUploadingImage}
                  placeholder="e.g. 50"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'draft')}
                disabled={isLoading || isUploadingImage}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                Product Image (Current: {product.images && product.images[0] ? 'Uploaded' : 'None'})
              </label>
              {product.images && product.images[0] && (
                <div className="my-2">
                  <img src={product.images[0]} alt={product.name} className="max-h-40 rounded-md border border-gray-200 shadow-sm" />
                </div>
              )}
              <input 
                type="file" 
                name="imageFile" 
                id="imageFile" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50"
                disabled={isLoading || isUploadingImage}
              />
              {isUploadingImage && <p className="text-xs text-indigo-600 mt-1">Uploading image...</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || isUploadingImage}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
              >
                {isLoading || isUploadingImage ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}