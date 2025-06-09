'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createStore } from '@/lib/firebase/firestoreActions';
import { geocodeAddress } from '@/lib/utils/location';
import { Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = getStorage();

interface StoreFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  categories: string;
}

export default function CreateStoreForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    phone: '',
    email: '',
    categories: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'logo') {
        setLogoFile(file);
      } else {
        setBannerFile(file);
      }
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!user) {
      setError('You must be logged in to create a store.');
      setIsSubmitting(false);
      return;
    }

    try {
      setIsUploading(true);
      
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.country} ${formData.postalCode}`;
      const coordinates = await geocodeAddress(fullAddress);
      
      if (!coordinates) {
        setError('Unable to find location for the provided address. Please check and try again.');
        setIsSubmitting(false);
        setIsUploading(false);
        return;
      }

      let logoUrl = '';
      let bannerUrl = '';

      if (logoFile) {
        const logoRef = ref(storage, `stores/${user.uid}/logo-${crypto.randomUUID()}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      if (bannerFile) {
        const bannerRef = ref(storage, `stores/${user.uid}/banner-${crypto.randomUUID()}`);
        await uploadBytes(bannerRef, bannerFile);
        bannerUrl = await getDownloadURL(bannerRef);
      }

      const storeData = {
        ownerId: user.uid,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        phone: formData.phone,
        email: formData.email,
        categories: formData.categories.split(',').map(cat => cat.trim()),
        location: coordinates,
        logoUrl,
        bannerUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await createStore(storeData);
      router.push('/dashboard/seller');
    } catch (error) {
      console.error('Error creating store:', error);
      setError('Failed to create store. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'logo')}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {logoFile && (
              <p className="mt-1 text-sm text-gray-500">
                {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Banner
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'banner')}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {bannerFile && (
              <p className="mt-1 text-sm text-gray-500">
                {bannerFile.name} ({(bannerFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Store Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories (comma separated)
            </label>
            <input
              type="text"
              name="categories"
              value={formData.categories}
              onChange={handleChange}
              placeholder="e.g., Electronics, Clothing, Groceries"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add categories to help customers find your store
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Store'}
          </button>
        </div>
      </form>
    </div>
  );
}