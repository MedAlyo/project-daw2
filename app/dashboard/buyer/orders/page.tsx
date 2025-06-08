'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByBuyer, Order } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';

export default function BuyerOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  
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
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (user && user.role === 'buyer') {
        try {
          setOrdersLoading(true);
          const buyerOrders = await getOrdersByBuyer(user.uid);
          setOrders(buyerOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrdersError('Failed to load orders');
        } finally {
          setOrdersLoading(false);
        }
      }
    };
    
    fetchOrders();
  }, [user]);
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-700">Loading orders...</p>
      </div>
    );
  }
  
  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
            <p className="text-gray-700">Track and manage your orders</p>
          </div>
          <Link href="/dashboard/buyer">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
      
      {/* filter tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* orders list */}
      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : ordersError ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{ordersError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h2>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'Start shopping to see your orders here'
              : `You don't have any ${filter} orders at the moment`
            }
          </p>
          <Link href="/products">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-gray-600">
                    Placed on {order.createdAt.toDate().toLocaleDateString()} at {order.createdAt.toDate().toLocaleTimeString()}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                  <Link href={`/dashboard/buyer/orders/${order.id}`}>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}