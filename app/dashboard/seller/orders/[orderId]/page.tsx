'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrderById, Order as FirestoreOrder } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';

interface OrderDetail extends Omit<FirestoreOrder, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const fetchedOrder = await getOrderById(orderId);
        if (fetchedOrder) {
          setOrder({
            ...fetchedOrder,
            createdAt: fetchedOrder.createdAt.toDate().toLocaleString(),
            updatedAt: fetchedOrder.updatedAt.toDate().toLocaleString(),
          });
        } else {
          setError('Order not found.');
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading order details...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Order not found.</div>;

  const getStatusClasses = (status: FirestoreOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-sky-100 text-sky-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/seller/orders" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            Back to Orders
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Order Details</h1>
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Order Information</h2>
                <dl className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><dt className="font-medium text-gray-500">Order ID:</dt><dd className="text-gray-700">{order.id}</dd></div>
                  <div className="flex justify-between items-center"><dt className="font-medium text-gray-500">Status:</dt><dd><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusClasses(order.status)}`}>{order.status}</span></dd></div>
                  <div className="flex justify-between"><dt className="font-medium text-gray-500">Total Amount:</dt><dd className="text-gray-700 font-semibold">${order.totalAmount.toFixed(2)}</dd></div>
                  <div className="flex justify-between"><dt className="font-medium text-gray-500">Payment Method:</dt><dd className="text-gray-700">{order.paymentMethod}</dd></div>
                  <div className="flex justify-between"><dt className="font-medium text-gray-500">Date Placed:</dt><dd className="text-gray-700">{order.createdAt}</dd></div>
                  <div className="flex justify-between"><dt className="font-medium text-gray-500">Last Updated:</dt><dd className="text-gray-700">{order.updatedAt}</dd></div>
                  {order.trackingNumber && <div className="flex justify-between"><dt className="font-medium text-gray-500">Tracking #:</dt><dd className="text-gray-700">{order.trackingNumber}</dd></div>}
                </dl>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Shipping Address</h2>
                <address className="text-sm text-gray-600 not-italic">
                  <strong className="text-gray-700">{order.shippingAddress.name}</strong><br />
                  {order.shippingAddress.addressLine1}<br />
                  {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                  {order.shippingAddress.phoneNumber && <><br />Phone: {order.shippingAddress.phoneNumber}</>}
                </address>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Items Ordered</h2>
              <ul className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <li key={index} className="py-4 flex justify-between items-start">
                    <div className="flex-grow">
                      <p className="font-medium text-gray-800">{item.productName}</p>
                      <p className="text-xs text-gray-500">Product ID: {item.productId}</p>
                      <p className="text-xs text-gray-500">Store ID: {item.storeId}</p>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">{item.quantity} x ${item.price.toFixed(2)}</p>
                      <p className="font-semibold text-gray-800">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {order.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Customer Notes</h2>
                <p className="text-sm text-gray-600 p-4 bg-gray-50 rounded-md">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}