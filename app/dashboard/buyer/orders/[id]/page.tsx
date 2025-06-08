'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrderById, Order, ShippingAddress } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // protect the route
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/account/login');
      } else if (user.role === 'seller') {
        router.push('/dashboard/seller');
      }
    }
  }, [user, loading, router]);
  
  // fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (user && user.role === 'buyer' && orderId) {
        try {
          setOrderLoading(true);
          const orderData = await getOrderById(orderId);
          
          if (orderData && orderData.buyerId === user.uid) {
            setOrder(orderData);
          } else {
            setOrderError('Order not found or access denied');
          }
        } catch (error) {
          console.error('Error fetching order:', error);
          setOrderError('Failed to load order details');
        } finally {
          setOrderLoading(false);
        }
      }
    };
    
    fetchOrder();
  }, [user, orderId]);
  
  if (loading || orderLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (orderError || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">{orderError || 'The order you are looking for does not exist.'}</p>
          <Link href="/dashboard/buyer/orders" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Placed on {order.createdAt.toDate().toLocaleDateString()} at {order.createdAt.toDate().toLocaleTimeString()}
              </p>
            </div>
            <Link href="/dashboard/buyer/orders">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                ← Back to Orders
              </button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* order details */}
          <div className="lg:col-span-2 space-y-6">
            {/* order status */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Order Status</h2>
                <OrderStatusBadge status={order.status} />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['pending', 'processing', 'shipped', 'delivered'].includes(order.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={order.status === 'pending' ? 'font-medium' : 'text-gray-600'}>
                    Order Placed
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['processing', 'shipped', 'delivered'].includes(order.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={order.status === 'processing' ? 'font-medium' : 'text-gray-600'}>
                    Processing
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['shipped', 'delivered'].includes(order.status) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={order.status === 'shipped' ? 'font-medium' : 'text-gray-600'}>
                    Shipped
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={order.status === 'delivered' ? 'font-medium' : 'text-gray-600'}>
                    Delivered
                  </span>
                </div>
              </div>
            </div>
            
            {/* order items */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-4 last:border-b-0">
                    <div>
                      <h3 className="font-medium">{item.productName}</h3>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* sidebar */}
          <div className="space-y-6">
            {/* shipping address */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
              <div className="text-gray-700 space-y-1">
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phoneNumber && (
                  <p className="pt-2 border-t mt-2">
                    Phone: {order.shippingAddress.phoneNumber}
                  </p>
                )}
              </div>
            </div>
            
            {/* order summary */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items ({order.items.length}):</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* actions */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-3">Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                  Track Package
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors">
                  Contact Seller
                </button>
                {order.status === 'delivered' && (
                  <button className="w-full bg-green-100 text-green-700 py-2 px-4 rounded hover:bg-green-200 transition-colors">
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}