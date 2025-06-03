'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';

const CartIcon: React.FC = () => {
  const { state } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        {/* cart icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
          />
        </svg>
        
        {/* item count badge */}
        {state.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {state.itemCount > 99 ? '99+' : state.itemCount}
          </span>
        )}
      </button>
      
      <CartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};

export default CartIcon;