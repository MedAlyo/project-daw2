'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder, ShippingAddress, OrderCreateData } from '@/lib/firebase/firestoreActions';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiMapPin, FiCreditCard, FiChevronDown, FiChevronUp, FiAlertCircle, FiCheckCircle, FiLoader, FiSave, FiTrash2, FiPlusCircle } from 'react-icons/fi';

export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [processingStep, setProcessingStep] = useState<string>('');
  const [shippingCost, setShippingCost] = useState(5.99); 
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'creditCard'>('creditCard');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState<ShippingAddress | null>(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  const detectCountryFromAddress = async (address: string, city: string, postalCode: string) => {
    if (!address.trim() || !city.trim()) return;
    setIsDetectingCountry(true);
    try {
      const query = `${address}, ${city}${postalCode ? ', ' + postalCode : ''}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].address) {
          const detectedCountry = data[0].address.country;
          if (detectedCountry) {
            setShippingAddress(prev => ({
              ...prev,
              country: detectedCountry
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error detecting country:', error);
    } finally {
      setIsDetectingCountry(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (shippingAddress.addressLine1 && shippingAddress.city && !useExistingAddress) {
        detectCountryFromAddress(
          shippingAddress.addressLine1,
          shippingAddress.city,
          shippingAddress.postalCode
        );
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [shippingAddress.addressLine1, shippingAddress.city, shippingAddress.postalCode, useExistingAddress]);

  useEffect(() => {
    if (!user) {
      router.push('/account/login?redirect=/checkout');
      return;
    }
    if (user.role !== 'buyer') {
      router.push('/dashboard/seller');
      return;
    }
    if (state.items.length === 0 && !loading) {
      router.push('/products');
      return;
    }
  }, [user, state.items.length, router, loading]);

  useEffect(() => {
    if (user) {
      const mockAddresses: ShippingAddress[] = [
        {
          fullName: 'John Doe Saved',
          addressLine1: '123 Saved St',
          addressLine2: 'Apt 4B',
          city: 'Savedville',
          state: 'CA',
          postalCode: '90210',
          country: 'United States',
          phoneNumber: '555-123-4567',
        },
      ];
      setSavedAddresses(mockAddresses);
    }
  }, [user]);

  useEffect(() => {
    calculateShipping();
  }, [state.items, state.total, shippingAddress.country]);

  const calculateShipping = () => {
    const baseShipping = 5.99;
    const itemCount = state.itemCount;
    const weight = itemCount * 0.5; 

    let shipping = baseShipping;
    if (weight > 5) shipping += (weight - 5) * 0.5;
    if (state.total > 75) shipping = 0; 

    setShippingCost(shipping);

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (shipping === 0 ? 3 : 5));
    setEstimatedDelivery(deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
  };

  const validateField = (name: keyof ShippingAddress, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'addressLine1':
        if (!value.trim()) return 'Address is required';
        break;
      case 'city':
        if (!value.trim()) return 'City is required';
        break;
      case 'state':
        if (!value.trim()) return 'State/Province is required';
        break;
      case 'postalCode':
        if (!value.trim()) return 'Postal code is required';
        if (!/^[a-zA-Z0-9\s-]{3,}$/.test(value)) return 'Invalid postal code format';
        break;
      case 'country':
        if (!value.trim()) return 'Country is required';
        break;
      case 'phoneNumber':
        if (value && !/^(\+[1-9]{1,4}[ \-\.\s]?)?(\([0-9]{1,4}\)[ \-\.\s]?)?[0-9]{1,4}([ \-\.\s]?[0-9]{1,4}){1,3}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Invalid phone number format';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as { name: keyof ShippingAddress, value: string };
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }));

    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/');
    }
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
    }
    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validateForm = (): boolean => {
    const currentErrors: Record<string, string> = {};
    let formIsValid = true;
    (Object.keys(shippingAddress) as Array<keyof ShippingAddress>).forEach(key => {
      if (key === 'addressLine2' || key === 'phoneNumber') return; 
      const error = validateField(key, shippingAddress[key]?.toString() || '');
      if (error) {
        currentErrors[key] = error;
        formIsValid = false;
      }
    });
    setFieldErrors(currentErrors);
    return formIsValid;
  };

  const handlePlaceOrder = async () => {
    if (!user || !validateForm()) {
      setError('Please fill in all required shipping fields correctly.');
      document.getElementById('shipping-form-start')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (paymentMethod === 'creditCard') {
      if (!cardDetails.cardholderName.trim() || !cardDetails.cardNumber.trim() || !cardDetails.expiryDate.trim() || !cardDetails.cvv.trim()) {
        setError('Please fill in all required card details.');
        document.getElementById('payment-form-start')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setProcessingStep('Validating order details...');
      await new Promise(resolve => setTimeout(resolve, 500)); 

      setProcessingStep('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      setProcessingStep('Creating your order...');
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
          imageUrl: item.product.images?.[0] || '',
        });
        acc[storeId].totalAmount += item.product.price * item.quantity;
        return acc;
      }, {} as Record<string, any>);

      const orderPromises = Object.values(ordersByStore).map(async (storeOrder: any) => {
        const orderData: OrderCreateData = {
          buyerId: user.uid,
          buyerName: user.displayName || user.email || 'Unknown Buyer',
          sellerId: storeOrder.sellerId,
          storeId: storeOrder.storeId,
          items: storeOrder.items,
          totalAmount: storeOrder.totalAmount,
          shippingAddress: useExistingAddress || shippingAddress,
          status: 'pending',
          paymentMethod: paymentMethod,
          shippingCost: shippingCost / Object.keys(ordersByStore).length, 
          taxAmount: (storeOrder.totalAmount * 0.08) / Object.keys(ordersByStore).length, 
        };
        const orderId = await createOrder(orderData);
        return orderId;
      });

      const orderIds = await Promise.all(orderPromises);
      setProcessingStep('Order Placed Successfully!');
      setSuccessMessage(`Your order has been placed! Order ID(s): ${orderIds.join(', ')}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      clearCart();
      router.push(`/orders/confirmation?orders=${orderIds.join(',')}`);

    } catch (err: any) {
      console.error('Error placing order:', err);
      setError(`Failed to place order: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setProcessingStep('');
    }
  };

  const subtotal = state.total;
  const taxRate = 0.08; 
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + shippingCost + taxAmount;

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900 p-4 text-white">
        <FiLoader className="animate-spin text-5xl text-purple-400 mb-4" />
        <p className="text-xl">Redirecting to login...</p>
      </div>
    );
  }

  if (state.items.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-purple-900 p-4 text-white">
        <FiShoppingCart className="text-6xl text-purple-400 mb-6" />
        <h2 className="text-3xl font-semibold mb-4">Your Cart is Empty</h2>
        <p className="text-lg text-gray-300 mb-8">Looks like you haven't added any products yet.</p>
        <Link href="/products"
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">
          Start Shopping
        </Link>
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-gray-300 text-gray-800 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 text-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <FiShoppingCart className="text-4xl text-indigo-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-md">
            <FiAlertCircle className="mr-2 text-red-500" /> {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-md">
            <FiCheckCircle className="mr-2 text-green-500" /> {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div id="shipping-form-start" className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-700 flex items-center">
                <FiMapPin className="mr-2" /> Shipping Information
              </h2>

              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <button 
                    onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                    className="flex items-center justify-between w-full text-left text-indigo-600 hover:text-indigo-700 mb-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <span>{useExistingAddress ? `Using: ${useExistingAddress.addressLine1}` : 'Use a saved address?'}</span>
                    {showSavedAddresses ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {showSavedAddresses && (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1 bg-gray-50 rounded-md border border-gray-200">
                      {savedAddresses.map((address, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setShippingAddress(address);
                            setUseExistingAddress(address);
                            setFieldErrors({}); 
                            setShowSavedAddresses(false);
                          }}
                          className={`w-full text-left p-3 border rounded-md transition-all duration-150 ease-in-out 
                            ${useExistingAddress && useExistingAddress.addressLine1 === address.addressLine1 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-indigo-500 text-gray-700 hover:text-indigo-700'}`}
                        >
                          <div className="font-medium">{address.fullName}</div>
                          <div className="text-sm text-gray-600">
                            {address.addressLine1}, {address.city}, {address.postalCode}
                          </div>
                        </button>
                      ))}
                       <button
                          type="button"
                          onClick={() => {
                            setUseExistingAddress(null);
                            setShippingAddress({ fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: '', phoneNumber: '' });
                            setShowSavedAddresses(false);
                          }}
                          className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-100 hover:border-blue-500 mt-2 flex items-center justify-center text-blue-600"
                        >
                          <FiPlusCircle className="mr-2" /> Add New Address
                        </button>
                    </div>
                  )}
                </div>
              )}

              {!useExistingAddress && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>Full Name *</label>
                    <input type="text" id="fullName" name="fullName" value={shippingAddress.fullName} onChange={handleInputChange} className={inputClass} required />
                    {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1 dark:text-red-400">{fieldErrors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="addressLine1" className={labelClass}>Address Line 1 *</label>
                    <input type="text" id="addressLine1" name="addressLine1" value={shippingAddress.addressLine1} onChange={handleInputChange} className={inputClass} required />
                    {fieldErrors.addressLine1 && <p className="text-red-400 text-xs mt-1">{fieldErrors.addressLine1}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className={labelClass}>City *</label>
                      <input type="text" id="city" name="city" value={shippingAddress.city} onChange={handleInputChange} className={inputClass} required />
                      {fieldErrors.city && <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="state" className={labelClass}>State / Province *</label>
                      <input type="text" id="state" name="state" value={shippingAddress.state} onChange={handleInputChange} className={inputClass} required />
                      {fieldErrors.state && <p className="text-red-400 text-xs mt-1">{fieldErrors.state}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postalCode" className={labelClass}>Postal Code *</label>
                      <input type="text" id="postalCode" name="postalCode" value={shippingAddress.postalCode} onChange={handleInputChange} className={inputClass} required />
                      {fieldErrors.postalCode && <p className="text-red-400 text-xs mt-1">{fieldErrors.postalCode}</p>}
                    </div>
                    <div>
                      <label htmlFor="country" className={labelClass}>Country * {isDetectingCountry && <FiLoader className="inline animate-spin ml-1 text-blue-500 dark:text-purple-400"/>}</label>
                      <input type="text" id="country" name="country" value={shippingAddress.country} onChange={handleInputChange} className={inputClass} required />
                      {fieldErrors.country && <p className="text-red-400 text-xs mt-1">{fieldErrors.country}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className={labelClass}>Phone Number (Optional)</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber" value={shippingAddress.phoneNumber} onChange={handleInputChange} className={inputClass} />
                    {fieldErrors.phoneNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.phoneNumber}</p>}
                  </div>
                  <div className="flex items-center mt-4">
                    <input type="checkbox" id="saveAddress" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-gray-100 dark:text-purple-600 dark:border-gray-500 dark:bg-gray-700" />
                    <label htmlFor="saveAddress" className="ml-2 text-sm text-black">Save this address for future orders</label>
                  </div>
                </div>
              )}
            </div>

            <div id="payment-form-start" className="bg-white p-6 rounded-xl shadow-xl border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-700 flex items-center">
                <FiCreditCard className="mr-2" /> Payment Method
              </h2>
              
              {paymentMethod === 'creditCard' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardholderName" className={labelClass}>Cardholder Name</label>
                    <input type="text" name="cardholderName" id="cardholderName" value={cardDetails.cardholderName} onChange={handleCardDetailsChange} className={inputClass} placeholder="Full Name as on Card" />
                  </div>
                  
                  <div className="flex space-x-2 mb-3">
                    <Image src="/visa.svg" alt="Visa" width={32} height={20} onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={32} height={20} onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Image src="/amex.svg" alt="American Express" width={32} height={20} onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>

                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-600 mb-1">Card Number</label>
                    <input type="text" name="cardNumber" id="cardNumber" value={cardDetails.cardNumber} onChange={handleCardDetailsChange} className={inputClass} placeholder="0000 0000 0000 0000" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
                      <input type="text" name="expiryDate" id="expiryDate" value={cardDetails.expiryDate} onChange={handleCardDetailsChange} className={inputClass} placeholder="MM/YY" maxLength={5} />
                    </div>
                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-600 mb-1">CVV</label>
                      <input type="text" name="cvv" id="cvv" value={cardDetails.cvv} onChange={handleCardDetailsChange} className={inputClass} placeholder="123" maxLength={4} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white backdrop-blur-md p-6 rounded-xl shadow-xl border border-gray-700 sticky top-20">
              <h2 className="text-2xl font-semibold mb-6 text-purple-400 flex items-center">
                <FiShoppingCart className="mr-2" /> Order Summary
              </h2>
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {state.items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <div className="flex items-center">
                      <Image 
                        src={item.product.images?.[0] || '/placeholder-image.png'} 
                        alt={item.product.name} 
                        width={50} 
                        height={50} 
                        className="rounded-md mr-3 object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-700 pt-4">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-400">Subtotal:</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-400">Shipping:</p>
                  <p>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-400">Tax ({(taxRate * 100).toFixed(0)}%):</p>
                  <p>${taxAmount.toFixed(2)}</p>
                </div>
                {estimatedDelivery && (
                  <div className="flex justify-between text-xs pt-1 text-purple-400">
                    <p>Estimated Delivery:</p>
                    <p>{estimatedDelivery}</p>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-600 mt-3">
                  <p>Total:</p>
                  <p>${totalAmount.toFixed(2)}</p>
                </div>
              </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || state.items.length === 0}
                className={`w-full mt-8 py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-in-out flex items-center justify-center
                  ${loading || state.items.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-purple-500/50 transform hover:scale-105'}`}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    <span>{processingStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" />
                    Place Order
                  </>
                )}
              </button>
              {state.items.length > 0 && !loading && (
                <p className="text-xs text-gray-500 mt-3 text-center">By placing your order, you agree to our Terms of Service.</p>
              )}
            </div>
          </div>
        </div>
      </div>
);
}