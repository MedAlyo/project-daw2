'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderById, Order } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderIds = searchParams.get('orders')?.split(',') || [];
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const orderPromises = orderIds.map(id => getOrderById(id));
        const fetchedOrders = await Promise.all(orderPromises);
        const validOrders = fetchedOrders.filter(order => order !== null) as Order[];
        setOrders(validOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderIds.length > 0) {
      fetchOrders();
    } else {
      setLoading(false);
      setError('No order ID found in URL.');
    }
  }, [orderIds]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Information</h1>
          <p className="text-gray-600 mb-4">{error || 'Could not load your order details at this time.'}</p>
          <Link href="/products" className="text-blue-600 hover:text-blue-800 underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order{orders.length > 1 ? 's have' : ' has'} been placed successfully.
          </p>
        </div>
        
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h2>
                  <p className="text-sm text-gray-600">
                    Placed on {order.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-3">
                {order.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Order Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {orders.length > 1 && (
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Grand Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow border mt-6">
          <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
          <div className="text-gray-700">
            <p>{orders[0].shippingAddress.name}</p>
            <p>{orders[0].shippingAddress.addressLine1}</p>
            {orders[0].shippingAddress.addressLine2 && (
              <p>{orders[0].shippingAddress.addressLine2}</p>
            )}
            <p>
              {orders[0].shippingAddress.city}, {orders[0].shippingAddress.state} {orders[0].shippingAddress.postalCode}
            </p>
            <p>{orders[0].shippingAddress.country}</p>
            {orders[0].shippingAddress.phoneNumber && (
              <p>Phone: {orders[0].shippingAddress.phoneNumber}</p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard/buyer" className="flex-1">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              View Order History
            </button>
          </Link>
          <Link href="/products" className="flex-1">
            <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}