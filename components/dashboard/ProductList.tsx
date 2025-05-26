'use client';

import React from 'react';
import { Product } from '@/lib/firebase/firestoreActions'; // Assuming Product interface is exported from here
import Link from 'next/link'; // Import Link for navigation

interface ProductListProps {
  products: Product[];
  onEditProduct: (productId: string) => void; // Callback for edit
  onDeleteProduct: (productId: string) => Promise<void>; // Callback for delete, async for potential confirmation
}

export default function ProductList({ products, onEditProduct, onDeleteProduct }: ProductListProps) {
  if (!products || products.length === 0) {
    return <p className="text-gray-600">You haven't added any products yet.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Products</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{product.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link href={`/dashboard/seller/products/${product.id}`} legacyBehavior>
                    <a className="text-indigo-600 hover:text-indigo-900">Edit</a>
                  </Link>
                  <button
                    onClick={async () => {
                      // Consider adding a confirmation dialog here
                      if (window.confirm('Are you sure you want to delete this product?')) {
                        try {
                          await onDeleteProduct(product.id);
                          // Optionally, show a success message or trigger a refresh
                        } catch (error) {
                          console.error('Failed to delete product:', error);
                          // Optionally, show an error message to the user
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}