'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateProductForm from '@/components/dashboard/CreateProductForm';
import ProductList from '@/components/dashboard/ProductList';
import { getProductsBySeller, Product, deleteProduct, getStoresByOwner, getOrdersBySeller, Order, updateOrderStatus } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAddProductFormVisible, setIsAddProductFormVisible] = useState(false); // New state for form visibility

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

  const fetchSellerStores = async () => {
    if (!user?.uid) return;

    try {
      const stores = await getStoresByOwner(user.uid);

      if (stores.length > 0) {
        setCurrentStoreId(stores[0]?.id ?? null);
      } else {
        setInfoMessage('No stores found. Please create a store first.');
        setCurrentStoreId('no-store');
      }
    } catch (error) {
      console.error('Error in fetchSellerStores:', error);
      setInfoMessage('Error loading store information.');
      // Set a default store ID to prevent infinite loading
      setCurrentStoreId('error');
    }
  };

  // Fetch pending orders for the seller
  const fetchPendingOrders = async () => {
    if (!user?.uid) return;

    setIsLoadingOrders(true);
    try {
      const orders = await getOrdersBySeller(user.uid, 'pending');
      setPendingOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setInfoMessage('Error loading pending orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setInfoMessage(`Order ${orderId} status updated to ${newStatus}`);
      await fetchPendingOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error updating order status:', error);
      setInfoMessage('Failed to update order status. Please try again.');
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    const fetchData = async () => {
      if (user?.uid) {
        await Promise.all([
          fetchSellerProducts(),
          fetchSellerStores(),
          fetchPendingOrders()
        ]);
      }
    };

    fetchData();
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

  if (loading || !user || (user.role === 'seller' && !currentStoreId)) {
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
  if (currentStoreId === 'no-store') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Your Seller Dashboard</h1>
          <p className="mb-6">You need to create a store before you can start selling.</p>
          <Link
            href="/dashboard/seller/create-store"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Your First Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-700 mt-1">Welcome, {user.displayName || user.email}!</p>
          <p className="text-sm text-gray-500">Managing Store ID: {currentStoreId}</p>
        </div>

        {/* Add this Link component */}
        <Link
          href="/dashboard/seller/orders"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          View Orders
        </Link>
      </div>

      {infoMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {infoMessage}
        </div>
      )}

      {/* Section to Add New Product - Now Collapsible */}
      <div className="mb-8">
        <button
          onClick={() => setIsAddProductFormVisible(!isAddProductFormVisible)}
          className="flex items-center justify-center w-full px-4 py-2 mb-4 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          {isAddProductFormVisible ? 'Hide Add Product Form' : 'Show Add Product Form'}
          <svg
            className={`w-5 h-5 ml-2 transform transition-transform duration-200 ${isAddProductFormVisible ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isAddProductFormVisible && currentStoreId && currentStoreId !== 'error' && currentStoreId !== 'no-store' ? (
          <CreateProductForm
            onProductCreated={handleProductCreated}
            storeId={currentStoreId}
          />
        ) : isAddProductFormVisible && (
          <p className="text-orange-500">
            {currentStoreId === 'error' ? 'Store information is not available. Cannot add products.' :
             currentStoreId === 'no-store' ? 'Please create a store before adding products.' :
             'Store information is loading. Cannot add products yet.'}
          </p>
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

      {/* Pending Orders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Pending Orders</h2>
            <Link
              href="/dashboard/seller/orders"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          {isLoadingOrders ? (
            <p className="text-gray-600">Loading orders...</p>
          ) : pendingOrders.length > 0 ? (
            <ul className="space-y-3">
              {pendingOrders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {order.buyerName || 'N/A'} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        disabled={order.status !== 'pending'}
                      >
                        Mark as Processing
                      </button>
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
              <p className="mt-1 text-sm text-gray-500">New orders will appear here when customers purchase your products.</p>
            </div>
          )}
        </div>

        {/* Sales Overview - Placeholder for future implementation */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Overview</h2>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sales analytics coming soon</h3>
            <p className="mt-1 text-sm text-gray-500">Track your sales performance and insights</p>
          </div>
        </div>
      </div>

      {/* TODO: Add seller-specific content here */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example Section: Pending Orders */}
      {/* <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Orders</h2>
          <p className="text-gray-600">Display orders that need processing.</p>
          {/* Placeholder for pending orders list */}
      {/* <ul className="mt-4 space-y-2">
            <li className="text-gray-700">Order #12346 - New</li>
            <li className="text-gray-700">Order #12347 - Processing</li>
            {/* ... more orders */}
      {/* </ul>
        </div>
      </div> */}
    </div>
  );
}