'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, updateProductStock, ShippingAddress, OrderCreateData } from '@/lib/firebase/firestoreActions';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phoneNumber: '',
  });
  
  // redirect if cart is empty or user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/account/login');
      return;
    }
    
    if (user.role !== 'buyer') {
      router.push('/dashboard/seller');
      return;
    }
    
    if (state.items.length === 0) {
      router.push('/products');
      return;
    }
  }, [user, state.items.length, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const validateForm = (): boolean => {
    const required = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    return required.every(field => shippingAddress[field as keyof ShippingAddress]?.toString().trim() !== '');
  };
  
  const handlePlaceOrder = async () => {
    if (!user || !validateForm()) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // group items by seller/store
      const ordersByStore = state.items.reduce((acc, item) => {
        const storeId = item.product.storeId;
        const sellerId = item.product.sellerId;
        
        if (!acc[storeId]) {
          acc[storeId] = {
            sellerId,
            storeId,
            items: [],
            totalAmount: 0,
          };
        }
        
        acc[storeId].items.push({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        });
        
        acc[storeId].totalAmount += item.product.price * item.quantity;
        
        return acc;
      }, {} as Record<string, any>);
      
      // create separate orders for each store
      const orderPromises = Object.values(ordersByStore).map(async (storeOrder: any) => {
        const orderData: OrderCreateData = {
          buyerId: user.uid,
          buyerName: user.displayName || user.email || 'Unknown Buyer',
          sellerId: storeOrder.sellerId,
          storeId: storeOrder.storeId,
          items: storeOrder.items,
          totalAmount: storeOrder.totalAmount,
          shippingAddress,
        };
        
        const orderId = await createOrder(orderData);
        
        // update product stock
        await updateProductStock(storeOrder.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })));
        
        return orderId;
      });
      
      const orderIds = await Promise.all(orderPromises);
      
      // clear cart after successful order creation
      clearCart();
      
      // redirect to order confirmation
      router.push(`/orders/confirmation?orders=${orderIds.join(',')}`);
      
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* shipping information */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={shippingAddress.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* order summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {state.items.map((item) => {
                  const imageUrl = item.product.images && item.product.images.length > 0 
                    ? item.product.images[0] 
                    : '/placeholder-image.png';
                  
                  return (
                    <div key={item.product.id} className="flex items-center space-x-3 border-b pb-4">
                      <div className="relative w-16 h-16 bg-gray-200 rounded">
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          layout="fill"
                          objectFit="cover"
                          className="rounded"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{item.product.name}</h3>
                        <p className="text-gray-600 text-sm">
                          ${item.product.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total: ${state.total.toFixed(2)}</span>
                  <span className="text-sm text-gray-600">{state.itemCount} items</span>
                </div>
              </div>
            </div>
            
            {/* error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* place order button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !validateForm()}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                loading || !validateForm()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
            
            <Link href="/products" className="block text-center text-blue-600 hover:text-blue-800 underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}