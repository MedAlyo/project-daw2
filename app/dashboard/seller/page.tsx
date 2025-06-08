'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateProductForm from '@/components/dashboard/CreateProductForm';
import ProductList from '@/components/dashboard/ProductList';
import { getProductsBySeller, Product, deleteProduct, getStoresByOwner, getOrdersBySeller, Order, updateOrderStatus } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';
import { FiPlusCircle, FiEye, FiAlertCircle, FiCheckCircle, FiArchive, FiSend, FiEdit3, FiTrash2, FiPackage, FiClipboard, FiLoader } from 'react-icons/fi';

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [infoMessage, setInfoMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isAddProductFormVisible, setIsAddProductFormVisible] = useState(false);

  const clearInfoMessage = useCallback(() => {
    setTimeout(() => setInfoMessage(null), 5000);
  }, []);

  const fetchSellerData = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingProducts(true);
      setIsLoadingOrders(true);
      try {
        const stores = await getStoresByOwner(user.uid);
        if (stores.length > 0) {
          const storeId = stores[0]?.id;
          setCurrentStoreId(storeId ?? null);
          if (storeId) {
            const [fetchedProducts, fetchedOrders] = await Promise.all([
              getProductsBySeller(user.uid),
              getOrdersBySeller(user.uid, 'pending'),
            ]);
            setProducts(fetchedProducts);
            setPendingOrders(fetchedOrders);
          } else {
            setProducts([]);
            setPendingOrders([]);
          }
        } else {
          setInfoMessage({ type: 'error', message: 'No stores found. Please create a store first.' });
          setCurrentStoreId('no-store');
          setProducts([]);
          setPendingOrders([]);
        }
      } catch (error) {
        console.error('Error fetching seller data:', error);
        setInfoMessage({ type: 'error', message: 'Error loading your dashboard data. Please try again later.' });
        setCurrentStoreId('error');
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingOrders(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/account/login');
      } else if (user.role === 'buyer') {
        router.push('/dashboard/buyer');
      } else if (user.role === 'seller') {
        fetchSellerData();
      }
    }
  }, [user, authLoading, router, fetchSellerData]);

  const handleProductCreated = async () => {
    if (!user) {
      setInfoMessage({ type: 'error', message: 'User not found. Cannot refresh products.' });
      clearInfoMessage();
      return;
    }
    await fetchSellerData();
    setInfoMessage({ type: 'success', message: 'Product created successfully!' });
    setTimeout(() => setInfoMessage(null), 3000);
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/dashboard/seller/products/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !user.uid) {
      setInfoMessage({ type: 'error', message: 'You must be logged in to delete products.' });
      clearInfoMessage();
      return;
    }
    try {
      await deleteProduct(productId);
      setInfoMessage({ type: 'success', message: 'Product successfully deleted.' });
      await fetchSellerData();
    } catch (error) {
      console.error('Error deleting product:', error);
      setInfoMessage({ type: 'error', message: 'Failed to delete product. Please try again.' });
    }
    clearInfoMessage();
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setInfoMessage({ type: 'success', message: `Order ${orderId} status updated to ${newStatus}` });
      await fetchSellerData();
    } catch (error) {
      console.error('Error updating order status:', error);
      setInfoMessage({ type: 'error', message: 'Failed to update order status. Please try again.' });
    }
    clearInfoMessage();
  };

  if (authLoading || !user || (user.role === 'seller' && currentStoreId === null)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-100 to-sky-100 p-6">
        <FiLoader className="animate-spin text-4xl text-blue-600 mb-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading your dashboard...</p>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    );
  }

  if (user.role !== 'seller') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-slate-100 to-red-100 p-6">
        <FiAlertCircle className="text-4xl text-red-600 mb-4" />
        <p className="text-xl text-red-700 font-semibold">Access Denied</p>
        <p className="text-gray-500">You do not have permission to view this page. Redirecting...</p>
      </div>
    );
  }

  if (currentStoreId === 'no-store') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-slate-50 to-sky-50 min-h-[calc(100vh-160px)] flex flex-col justify-center items-center">
        <div className="max-w-md text-center p-8 bg-white shadow-xl rounded-xl">
          <FiAlertCircle className="text-5xl text-blue-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Welcome, Seller!
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            To start selling, you need to create your online store first.
          </p>
          <Link
            href="/dashboard/seller/create-store"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 active:scale-95"
          >
            <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
            Create Your Store
          </Link>
        </div>
      </div>
    );
  }

  if (currentStoreId === 'error') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-slate-50 to-red-50 min-h-[calc(100vh-160px)] flex flex-col justify-center items-center">
        <div className="max-w-md text-center p-8 bg-white shadow-xl rounded-xl">
          <FiAlertCircle className="text-5xl text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4 text-red-600">
            Something Went Wrong
          </h1>
          <p className="mb-8 text-lg text-gray-600">
            We encountered an error loading your store information. Please try refreshing the page or contact support if the issue persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all transform hover:scale-105 active:scale-95"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-gradient-to-br from-slate-50 to-sky-50 min-h-[calc(100vh-160px)]">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Seller Dashboard
            </h1>
            <p className="text-gray-600 mt-1 text-lg">Welcome back, {user.displayName || user.email}!</p>
            {currentStoreId && <p className="text-sm text-gray-500">Managing Store ID: <span className='font-semibold text-gray-700'>{currentStoreId}</span></p>}
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Link
              href="/dashboard/seller/orders"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiClipboard className="w-5 h-5 mr-2" />
              View All Orders
            </Link>
          </div>
        </div>
      </header>

      {infoMessage && (
        <div className={`mb-6 p-4 rounded-lg shadow-md text-sm flex items-center gap-3 ${infoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {infoMessage.type === 'error' ? <FiAlertCircle className="h-5 w-5" /> : <FiCheckCircle className="h-5 w-5" />}
          <span>{infoMessage.message}</span>
        </div>
      )}

      <section className="mb-10 md:mb-12 p-6 bg-white shadow-xl rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Manage Your Products</h2>
          <button
            onClick={() => setIsAddProductFormVisible(!isAddProductFormVisible)}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 active:scale-95"
          >
            <FiPlusCircle className="w-5 h-5 mr-2" />
            {isAddProductFormVisible ? 'Hide Form' : 'Add New Product'}
          </button>
        </div>

        {isAddProductFormVisible && currentStoreId && typeof currentStoreId === 'string' && currentStoreId !== 'no-store' && currentStoreId !== 'error' && user && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-slate-50">
            <CreateProductForm
              storeId={currentStoreId}
              onProductCreated={handleProductCreated}
            />
          </div>
        )}

        {isLoadingProducts ? (
          <div className="flex flex-col items-center justify-center py-10">
            <FiLoader className="animate-spin text-3xl text-blue-500 mb-3" />
            <p className="text-gray-600">Loading your products...</p>
          </div>
        ) : products.length > 0 ? (
          <ProductList
            products={products}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        ) : (
          <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
            <FiPackage className="text-5xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Yet</h3>
            <p className="text-gray-500 mb-6">It looks like you haven't added any products to your store. Click the button above to add your first product!</p>
            {!isAddProductFormVisible && (
                 <button
                    onClick={() => setIsAddProductFormVisible(true)}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105 active:scale-95"
                >
                    <FiPlusCircle className="w-5 h-5 mr-2" />
                    Add Your First Product
                </button>
            )}
          </div>
        )}
      </section>

      <section className="p-6 bg-white shadow-xl rounded-xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pending Customer Orders</h2>
        {isLoadingOrders ? (
          <div className="flex flex-col items-center justify-center py-10">
            <FiLoader className="animate-spin text-3xl text-blue-500 mb-3" />
            <p className="text-gray-600">Loading pending orders...</p>
          </div>
        ) : pendingOrders.length > 0 ? (
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <div>
                    <p className="text-sm text-gray-500">Order ID: <span className="font-medium text-gray-700">{order.id}</span></p>
                    <p className="text-lg font-semibold text-blue-600">Total: ${order.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Date: {order.createdAt.toDate().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Status: <span className="px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">{order.status}</span></p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                      className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all transform hover:scale-105 active:scale-95"
                    >
                      <FiSend className="w-4 h-4 mr-1.5" /> Mark as Shipped
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                      className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all transform hover:scale-105 active:scale-95"
                    >
                      <FiCheckCircle className="w-4 h-4 mr-1.5" /> Mark as Completed
                    </button>
                     <Link
                        href={`/dashboard/seller/orders/${order.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95"
                      >
                        <FiEye className="w-4 h-4 mr-1.5" /> View Details
                      </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
            <FiArchive className="text-5xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Orders</h3>
            <p className="text-gray-500">You currently have no orders awaiting action.</p>
          </div>
        )}
      </section>
    </div>
  );
}