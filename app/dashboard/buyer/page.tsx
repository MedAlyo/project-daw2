'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getOrdersByBuyer, Order } from '@/lib/firebase/firestoreActions';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';

export default function BuyerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
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
        <p className="text-gray-700">Loading dashboard...</p>
      </div>
    );
  }
  
  const recentOrders = orders.slice(0, 5);
  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'processing');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Dashboard</h1>
        <p className="text-gray-700">Welcome back, {user.displayName || user.email}!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📦</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
              <p className="text-gray-600">Pending Orders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="text-3xl mr-4">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
              </p>
              <p className="text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
            <Link href="/dashboard/buyer/orders" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : ordersError ? (
            <p className="text-red-600 text-center py-8">{ordersError}</p>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link href="/products">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Start Shopping
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        {order.createdAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  
                  <Link href={`/dashboard/buyer/orders/${order.id}`}>
                    <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                      View Details →
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <Link href="/products">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-left">
                <div className="flex items-center">
                  <span className="text-xl mr-3">🛍️</span>
                  <div>
                    <p className="font-medium">Browse Products</p>
                    <p className="text-sm text-blue-100">Discover local products near you</p>
                  </div>
                </div>
              </button>
            </Link>
            
            <Link href="/dashboard/buyer/orders">
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-left">
                <div className="flex items-center">
                  <span className="text-xl mr-3">📋</span>
                  <div>
                    <p className="font-medium">Order History</p>
                    <p className="text-sm text-gray-600">View all your past orders</p>
                  </div>
                </div>
              </button>
            </Link>
            
            <Link href="/account/profile">
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-left">
                <div className="flex items-center">
                  <span className="text-xl mr-3">👤</span>
                  <div>
                    <p className="font-medium">Account Settings</p>
                    <p className="text-sm text-gray-600">Manage your profile and preferences</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}