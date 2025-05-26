'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateProductForm from '@/components/dashboard/CreateProductForm';
import ProductList from '@/components/dashboard/ProductList';
import { getProductsBySeller, Product, deleteProduct } from '@/lib/firebase/firestoreActions'; // Import deleteProduct

/**
 * Seller Dashboard Page
 * Displays content relevant to a seller and protects the route.
 * Redirects to buyer dashboard if user is a buyer.
 */
export default function SellerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [infoMessage, setInfoMessage] = useState<string | null>(null); // For success messages
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null); // <-- ADDED: State for storeId

  // Function to fetch/refresh products
  const fetchSellerProducts = async () => {
    if (user && user.uid) {
      setIsLoadingProducts(true);
      try {
        const fetchedProducts = await getProductsBySeller(user.uid);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setInfoMessage('Error fetching your products. Please try again later.');
      } finally {
        setIsLoadingProducts(false);
      }
    }
  };

  // Fetch products for the current seller on initial load or user change
  useEffect(() => {
    fetchSellerProducts();
    // TODO: Replace this with actual logic to fetch the seller's store ID(s)
    // For now, using a placeholder. If a seller has multiple stores, you'll need a selection mechanism.
    if (user && user.role === 'seller') {
      // Example: Fetch the first store associated with the seller or a default one
      // const fetchedStoreId = await getSellerStoreId(user.uid); 
      // setCurrentStoreId(fetchedStoreId);
      setCurrentStoreId('default-store-id-placeholder'); // <-- ADDED: Placeholder storeId
    }
  }, [user]);

  // Protect the route: Redirect if not authenticated or if user is a buyer
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/account/login');
      } else if (user.role === 'buyer') {
        router.push('/dashboard/buyer');
      }
    }
  }, [user, loading, router]);

  const handleProductCreated = async (productId: string) => {
    setInfoMessage(`Product successfully created with ID: ${productId}. You can now view it in your listings.`);
    await fetchSellerProducts(); // Refresh product list
    setTimeout(() => setInfoMessage(null), 5000); // Clear message after 5 seconds
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/dashboard/seller/products/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !user.uid) {
      setInfoMessage('You must be logged in to delete products.');
      return;
    }
    // Confirmation is handled in ProductList, but you could add another layer here if needed
    try {
      await deleteProduct(productId); // Call Firestore action to delete
      setInfoMessage('Product successfully deleted.');
      await fetchSellerProducts(); // Refresh the product list
    } catch (error) {
      console.error('Error deleting product:', error);
      setInfoMessage('Failed to delete product. Please try again.');
    } finally {
      setTimeout(() => setInfoMessage(null), 5000); // Clear message
    }
  };

  if (loading || !user || (user.role === 'seller' && !currentStoreId)) { // <-- UPDATED: Add currentStoreId to loading condition
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  // Ensure user is a seller before rendering seller-specific content
  if (user.role !== 'seller') {
    // This case should ideally be handled by the redirect effect, 
    // but as a fallback or for clarity:
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <p className="text-gray-700">Access denied. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>
      <p className="text-gray-700 mb-6">Welcome, {user.displayName || user.email}!</p>
      <p className="text-sm text-gray-500 mb-4">Managing Store ID: {currentStoreId}</p> {/* Optional: Display current store ID for debugging */} 

      {infoMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {infoMessage}
        </div>
      )}

      {/* Section to Add New Product */}
      <div className="mb-8">
        {/* Pass currentStoreId to CreateProductForm */}
        {currentStoreId ? (
          <CreateProductForm 
            onProductCreated={handleProductCreated} 
            storeId={currentStoreId} // <-- UPDATED: Pass storeId as prop
          />
        ) : (
          <p className="text-orange-500">Store information is loading or not available. Cannot add products.</p>
        )}
      </div>

      {/* Section: Your Listings */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Listings</h2>
        {isLoadingProducts ? (
          <p className="text-gray-600">Loading your products...</p>
        ) : products.length > 0 ? (
          <ProductList 
            products={products} 
            onEditProduct={handleEditProduct} 
            onDeleteProduct={handleDeleteProduct} 
          />
        ) : (
          <p className="text-gray-600">You haven't listed any products yet. Add one above!</p>
        )}
      </div>

      {/* TODO: Add seller-specific content here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example Section: Pending Orders */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Orders</h2>
          <p className="text-gray-600">Display orders that need processing.</p>
          {/* Placeholder for pending orders list */}
          <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Order #12346 - New</li>
            <li className="text-gray-700">Order #12347 - Processing</li>
            {/* ... more orders */}
          </ul>
        </div>
      </div>

      {/* Add more sections as needed */}
    </div>
  );
}