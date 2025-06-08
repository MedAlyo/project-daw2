'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getProductsBySeller, Product as FirestoreProduct } from '@/lib/firebase/firestoreActions';
import { FiPlusCircle, FiEdit3, FiPackage, FiLoader, FiAlertTriangle, FiInbox } from 'react-icons/fi';

export default function SellerProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/account/login?message=Please login to view your products.');
      return;
    }

    if (user) {
      if (user.role !== 'seller') {
        router.push('/dashboard/buyer?error=unauthorized_seller_page');
        return;
      }
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setError(null);
        try {
          const sellerProducts = await getProductsBySeller(user.uid);
          setProducts(sellerProducts);
        } catch (err: any) {
          console.error("Error fetching seller products:", err);
          setError('Failed to load your products. Please refresh the page or try again later.');
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProducts();
    }
  }, [user, loading, router]);

  if (loading || !user || (user && user.role !== 'seller')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4 text-center">
        <FiLoader className="animate-spin text-4xl text-blue-600 mb-4" />
        <p className="text-lg font-semibold text-gray-700">
          {loading || !user ? 'Authenticating...' : 'Verifying seller account...'}
        </p>
        <p className="text-gray-500">Please wait a moment.</p>
      </div>
    );
  }
  
  if (isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4 text-center">
        <FiLoader className="animate-spin text-4xl text-blue-600 mb-4" />
        <p className="text-lg font-semibold text-gray-700">Loading Your Products...</p>
        <p className="text-gray-500">Fetching your product list.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4 md:px-8 selection:bg-purple-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-300">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiPackage className="text-4xl text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Your Products</h1>
          </div>
          <Link 
            href="/dashboard/seller/products/new" 
            className="flex items-center justify-center py-2.5 px-5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-blue-500 group"
          >
            <FiPlusCircle className="mr-2 h-5 w-5 transition-transform duration-150 ease-in-out group-hover:rotate-90" />
            Add New Product
          </Link>
        </div>

        {error && (
          <div className="flex items-start p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 shadow">
            <FiAlertTriangle className="h-5 w-5 mr-3 flex-shrink-0 text-red-600" />
            <div>
                <h3 className="font-medium">Error Loading Products</h3>
                <p>{error}</p>
            </div>
          </div>
        )}

        {products.length === 0 && !isLoadingProducts && !error ? (
          <div className="text-center py-12 px-6 bg-white rounded-xl shadow-xl border border-gray-200">
            <FiInbox size={56} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Products Yet</h2>
            <p className="text-gray-500 mb-6">It looks like you haven't added any products. Get started by adding your first one!</p>
            <Link 
                href="/dashboard/seller/products/new" 
                className="inline-flex items-center justify-center py-2.5 px-6 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-blue-500 group"
            >
                <FiPlusCircle className="mr-2 h-5 w-5 transition-transform duration-150 ease-in-out group-hover:rotate-90" />
                Add Your First Product
            </Link>
          </div>
        ) : products.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.stockQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/seller/products/${product.id}`} className="flex items-center text-blue-600 hover:text-purple-700 transition-colors duration-150">
                        <FiEdit3 className="mr-1.5 h-4 w-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}