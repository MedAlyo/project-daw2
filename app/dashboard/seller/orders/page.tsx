'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller, updateOrderStatus, Order as FirestoreOrder } from '@/lib/firebase/firestoreActions';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface PageOrder { 
  id: string;
  buyerId: string;
  buyerName?: string; 
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  status: FirestoreOrder['status']; 
  total: number;
  createdAt: Timestamp;
  shippingAddress: {
    name: string;
    address: string; 
    city: string;
    postalCode: string;
    country: string;
  };
}

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PageOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const firestoreOrders = await getOrdersBySeller(user.uid);
        const pageOrders = firestoreOrders.map(o => ({
          ...o,
          buyerId: o.userId, // Assuming buyerId in PageOrder maps to userId in FirestoreOrder
          buyerName: o.shippingAddress.name, // Or another source for buyerName if available
          total: o.totalAmount, 
          items: o.items.map(item => ({ // Ensure items are correctly mapped
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: o.shippingAddress.name,
            address: o.shippingAddress.addressLine1, // Map addressLine1 to address
            city: o.shippingAddress.city,
            postalCode: o.shippingAddress.postalCode,
            country: o.shippingAddress.country,
          }
        })) as PageOrder[];
        setOrders(pageOrders);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: FirestoreOrder['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      console.log(`Order ${orderId} status updated to ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status.');
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="text-red-600 p-4 bg-red-100 border border-red-400 rounded-md">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Seller Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">There are currently no orders to display.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-800">Order #{order.id.slice(0, 8)}</p>
                      {order.buyerName && <p className="text-sm text-gray-500">Buyer: {order.buyerName}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {order.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                    <span className={`mt-2 sm:mt-0 text-xs font-semibold px-3 py-1 rounded-full ${ 
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 
                      order.status === 'shipped' ? 'bg-green-100 text-green-800 border border-green-300' : 
                      order.status === 'delivered' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-300' : 
                      order.status === 'refunded' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      'bg-gray-100 text-gray-800 border border-gray-300' }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Items:</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between font-semibold text-gray-800">
                      <span>Total:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-5 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <select 
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as FirestoreOrder['status'])}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2.5 shadow-sm transition-colors duration-150 hover:border-gray-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <Link 
                    href={`/dashboard/seller/orders/${order.id}`} 
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 w-full sm:w-auto"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}