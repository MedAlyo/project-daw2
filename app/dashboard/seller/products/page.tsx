'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
// Assuming you'll create Firestore functions in a new file, e.g., lib/firebase/firestoreActions.ts
import { getProductsBySeller, Product as FirestoreProduct } from '@/lib/firebase/firestoreActions'; // Import getProductsBySeller and the Product type

// Define a basic Product type (should match the one in edit page)
// interface Product { // It's better to use the Product type from firestoreActions
//   id: string;
//   name: string;
//   price: number;
//   stock: number; 
//   // Add other fields as needed
// }

/**
 * Seller Product List Page
 * Displays a list of products for the logged-in seller.
 */
export default function SellerProductsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<FirestoreProduct[]>([]); // Use FirestoreProduct
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Protect the route and fetch products
  useEffect(() => {
    // Redirect if not authenticated after loading
    if (!loading && !user) {
      router.push('/account/login');
      return; // Stop execution if redirecting
    }

    // If user is logged in, fetch their products
    if (user) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setError(null);
        try {
          // TODO: Implement getSellerProducts function in firestoreActions.ts
          // This function should query the 'products' collection where sellerId matches user.uid
          const sellerProducts = await getProductsBySeller(user.uid); // Call getProductsBySeller
          setProducts(sellerProducts);
          // Placeholder data removed
        } catch (err: any) {
          console.error("Error fetching seller products:", err);
          setError('Failed to load products. Please try again.');
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProducts();
    }
  }, [user, loading, router]); // Depend on user, loading, router

  // Show loading state while checking auth or fetching products
  if (loading || isLoadingProducts || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">{loading || !user ? 'Loading user...' : 'Loading products...'}</p>
      </div>
    );
  }

  // Display products once loaded
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Products</h1>

      <div className="mb-6">
        <Link href="/dashboard/seller/products/new" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm">
          Add New Product
        </Link>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {products.length === 0 ? (
        <p className="text-gray-600">You have no products listed yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Quantity {/* Changed from Stock */}
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.price.toFixed(2)}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.stockQuantity} {/* Changed from product.stock */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/seller/products/${product.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    {/* TODO: Add Delete button */}
                    {/* The delete functionality is implemented on the edit page */}
                    {/* <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}