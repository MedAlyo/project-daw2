'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowRight } from 'react-icons/fi';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { state, removeItem, updateQuantity } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden="true"
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-br from-gray-50 to-slate-100 dark:from-slate-800 dark:to-gray-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
            <FiShoppingCart className="mr-3 text-sky-500" />
            Shopping Cart
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close cart"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {state.items.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center h-full">
              <FiShoppingCart size={64} className="mb-6 text-slate-400 dark:text-slate-500" />
              <p className="text-xl font-medium text-slate-700 dark:text-slate-300">Your cart is empty</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Looks like you haven't added anything yet.</p>
              <button 
                onClick={onClose} 
                className="mt-8 px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold rounded-lg shadow-md hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                Continue Shopping <FiArrowRight className="ml-2" />
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {state.items.map((item) => {
                const imageUrl = item.product.images && item.product.images.length > 0
                  ? item.product.images[0]
                  : '/placeholder-image.png';

                return (
                  <li key={item.product.id} className="flex items-start space-x-4 py-6 bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-md text-slate-800 dark:text-slate-100 truncate">{item.product.name}</h3>
                      <p className="text-sky-600 dark:text-sky-400 text-sm font-medium mt-1">${item.product.price.toFixed(2)}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <FiMinus size={16} />
                          </button>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                          aria-label="Remove item"
                        >
                          <FiTrash2 size={18} className="mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {state.items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">Total:</span>
                <span className="text-xl font-bold text-sky-600 dark:text-sky-400 ml-2">${state.total.toFixed(2)}</span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">{state.itemCount} {state.itemCount === 1 ? 'item' : 'items'}</span>
            </div>

            <Link href="/checkout" passHref>
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white py-3.5 px-6 rounded-lg font-semibold shadow-lg hover:from-sky-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 flex items-center justify-center"
              >
                Proceed to Checkout <FiArrowRight className="ml-2" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;