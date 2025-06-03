'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import CartIcon from '@/components/cart/CartIcon';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/config';

/**
 * Header component using a monochromatic theme with a blue accent.
 */
const Header: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
      console.log('User logged out');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    // White background, subtle gray border
    <header className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo using a darker gray */}
        <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors">
          LocaShop
        </Link>

        {/* Navigation Links - Medium gray */}
        <div className="space-x-5 sm:space-x-6 flex items-center">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Products
          </Link>
          <Link href="/shops" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Shops
          </Link>

          {/* Conditional rendering */}
          {loading ? (
            <span className="text-sm text-gray-400">...</span>
          ) : user ? (
            // Logged in state - Medium gray links, subtle red for logout
            <>
              {user.role === 'seller' && (
                <Link href="/dashboard/seller" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Seller Dashboard
                </Link>
              )}
              <Link href="/account/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            // Logged out state - Medium gray login, blue accent for register
            <>
              <Link href="/account/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link
                href="/account/register"
                // Keep blue accent for primary CTA
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded-md transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;