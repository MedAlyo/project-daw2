'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
// Assuming you'll create Firestore functions
import { getProductById, updateProduct, deleteProduct } from '@/lib/firebase/firestoreActions'; // Import Firestore functions
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

// Define a basic Product type (should match the one in list page and firestoreActions)
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string; // Optional
  sellerId: string; // Important for security checks
  createdAt: Timestamp; // Changed from Date to Timestamp
  updatedAt: Timestamp; // Changed from Date to Timestamp
}

/**
 * Seller Edit Product Page
 * Fetches and displays a specific product for editing or deletion.
 */
export default function EditProductPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams(); // Get route parameters
  const productId = params.productId as string; // Get the product ID from the URL

  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state for fetching product
  const [isSaving, setIsSaving] = useState<boolean>(false); // Loading state for saving changes
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // Loading state for deletion

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Protect the route and fetch the product
  useEffect(() => {
    // Redirect if not authenticated after loading
    if (!loading && !user) {
      router.push('/account/login');
      return; // Stop execution if redirecting
    }

    // If user is logged in and productId is available, fetch the product
    if (user && productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // TODO: Implement getProductById function in firestoreActions.ts
          // This function should fetch the product document by its ID
          const fetchedProduct = await getProductById(productId); // Call getProductById

          if (!fetchedProduct) {
            setError('Product not found.');
            setProduct(null); // Explicitly set product to null
          } else if (fetchedProduct.sellerId !== user.uid) {
             // Security check: Ensure the logged-in user owns this product
             setError('You do not have permission to edit this product.');
             setProduct(null); // Explicitly set product to null
          }
          else {
            setProduct(fetchedProduct);
            // Populate form fields with fetched data
            setName(fetchedProduct.name);
            setDescription(fetchedProduct.description);
            setPrice(fetchedProduct.price.toFixed(2)); // Format price for input
            setStock(fetchedProduct.stock.toString()); // Format stock for input
            setImageUrl(fetchedProduct.imageUrl || '');
          }
        } catch (err: any) {
          console.error("Error fetching product:", err);
          setError(err.message || 'Failed to load product. Please try again.');
          setProduct(null); // Explicitly set product to null on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchProduct();
    } else if (!productId && !loading) {
         // Handle case where productId is missing from the URL
         setError('Product ID is missing from the URL.');
         setIsLoading(false);
         setProduct(null);
    }
  }, [user, loading, router, productId]); // Depend on user, loading, router, and productId

  // Show loading state while checking auth or fetching product
  if (loading || isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">{loading || !user ? 'Loading user...' : 'Loading product...'}</p>
      </div>
    );
  }

  // Show error if product not found or permission denied
  if (error && !product) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg border border-gray-200 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Error</h1>
                <p className="text-red-600 text-sm">{error}</p>
                 <Link href="/dashboard/seller/products" className="font-medium text-blue-600 hover:text-blue-500">
                    Back to Product List
                </Link>
            </div>
        </div>
      );
  }

  // Render form if product is loaded and user has permission
  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

     // Basic validation
    if (!name || !description || !price || !stock) {
      setError('Please fill in all required fields.');
      setIsSaving(false);
      return;
    }

    const priceNumber = parseFloat(price);
    const stockNumber = parseInt(stock, 10);

    if (isNaN(priceNumber) || priceNumber < 0) {
        setError('Please enter a valid price.');
        setIsSaving(false);
        return;
    }
     if (isNaN(stockNumber) || stockNumber < 0) {
        setError('Please enter a valid stock quantity.');
        setIsSaving(false);
        return;
    }

    // Prepare updated product data
    const updatedProductData = {
      name,
      description,
      price: priceNumber,
      stock: stockNumber,
      imageUrl, // Optional
      // updatedAt will be added in the firestoreActions function
    };

    try {
      // TODO: Implement updateProduct function in firestoreActions.ts
      // This function should update the product document by its ID
      await updateProduct(productId, updatedProductData); // Call updateProduct

      setSuccess('Product updated successfully!');
      // Optional: Refresh product data after update if needed
      // const fetchedProduct = await getProductById(productId);
      // setProduct(fetchedProduct);

    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!product || !confirm(`Are you sure you want to delete "${product.name}"?`)) {
          return;
      }

      setIsDeleting(true);
      setError(null);
      setSuccess(null);

      try {
          // TODO: Implement deleteProduct function in firestoreActions.ts
          // This function should delete the product document by its ID
          await deleteProduct(productId); // Call deleteProduct

          setSuccess('Product deleted successfully! Redirecting...');
          // Redirect to product list after deletion
          setTimeout(() => router.push('/dashboard/seller/products'), 2000);

      } catch (err: any) {
          console.error("Error deleting product:", err);
          setError(err.message || 'Failed to delete product. Please try again.');
          setIsDeleting(false);
      }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Product: {product?.name}</h1>

      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow border border-gray-200">
        <form onSubmit={handleUpdate} className="space-y-5">
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
              disabled={isSaving || isDeleting}
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
              disabled={isSaving || isDeleting}
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
              disabled={isSaving || isDeleting}
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
              disabled={isSaving || isDeleting}
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
              disabled={isSaving || isDeleting}
            />
          </div>

          {success && (
            <p className="text-green-600 text-sm text-center">{success}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
             <button
              type="button" // Use type="button" to prevent form submission
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="flex-1 flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
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