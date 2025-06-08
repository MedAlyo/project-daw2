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
        className="relative p-3 text-gray-700 hover:text-blue-600 transition-all duration-200 hover:bg-gray-100 rounded-lg group"
        aria-label={`Shopping cart with ${state.itemCount} items`}
      >
        {/* Improved cart icon */}
        <svg
          className="w-6 h-6 group-hover:scale-110 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 3M7 13l1.5 3m0 0h8m-8 0a2 2 0 104 0m4 0a2 2 0 104 0"
          />
        </svg>
        
        {/* Enhanced item count badge */}
        {state.itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
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