'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile } from '@/lib/firebase/firestoreActions';
import { FiUserPlus, FiLogIn, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiBriefcase, FiShoppingCart } from 'react-icons/fi';

export default function RegisterPage() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const router = useRouter();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
       setError("Password should be at least 6 characters long.");
       return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, {
          displayName: username,
        });

        await createUserProfile(firebaseUser.uid, username, role);
        await firebaseSendEmailVerification(firebaseUser);
        await signOut(auth);

        router.push('/account/login?status=registered');
      } else {
        setError('User creation failed unexpectedly. Please try again.');
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Please try another.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. It should be at least 6 characters long.');
      } else {
        setError(err.message || 'Failed to register. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="text-center">
          <FiUserPlus className="mx-auto text-5xl text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join LocaShop today!</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="username"
              name="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 pr-4 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Username"
            />
          </div>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 pr-4 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Email Address"
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 py-3 block w-full bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out disabled:opacity-70"
              disabled={isLoading}
              placeholder="Confirm Password"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to register as a:
            </label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              {[ 
                { id: 'buyer', label: 'Buyer', icon: <FiShoppingCart className="mr-2"/> },
                { id: 'seller', label: 'Seller', icon: <FiBriefcase className="mr-2"/> }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => !isLoading && setRole(item.id as 'buyer' | 'seller')}
                  className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out 
                    ${role === item.id 
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 border-blue-500 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  <input
                    id={`role-${item.id}`}
                    name="role"
                    type="radio"
                    value={item.id}
                    checked={role === item.id}
                    onChange={() => setRole(item.id as 'buyer' | 'seller')}
                    disabled={isLoading}
                    className="opacity-0 w-0 h-0 absolute"
                  />
                  {item.icon}
                  <label htmlFor={`role-${item.id}`} className="text-sm font-medium cursor-pointer select-none">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-lg border border-red-300">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-blue-500 disabled:opacity-60 transition duration-150 ease-in-out group"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <FiUserPlus className="mr-2 h-5 w-5 transition-transform duration-150 ease-in-out group-hover:scale-110" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/account/login" className="font-medium text-blue-600 hover:text-purple-700 hover:underline">
            <FiLogIn className="inline mr-1 mb-0.5" />
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}