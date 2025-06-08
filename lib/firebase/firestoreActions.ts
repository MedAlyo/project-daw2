import { db, auth } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { calculateDistance } from '@/lib/utils/location';

const productsCollection = collection(db, 'products');
const usersCollection = collection(db, 'users');
const storesCollection = collection(db, 'stores');
const ordersCollection = collection(db, 'orders');

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'buyer' | 'seller';
  storeId?: string; 
  createdAt: Timestamp;
  
}

interface ProductData {
  sellerId: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  status: 'active' | 'draft';
  images?: string[];
  category?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product extends ProductData { 
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ADDED: Function to upload product image to Firebase Storage
/**
 * Uploads a product image to Firebase Storage.
 * @param file The image file to upload.
 * @param productId The ID of the product (used for path organization).
 * @returns A promise that resolves to the download URL of the uploaded image.
 */
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  const storage = getStorage();
  // Create a storage reference: products/{productId}/{fileName}
  const storageRef = ref(storage, `products/${productId}/${file.name}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image: ', error);
    throw new Error('Failed to upload image.');
  }
};

// Product Functions

/**
 * Adds a new product listing to Firestore.
 * @param productData The data for the new product.
 * @returns The ID of the newly created product document.
 */
export const addProduct = async (sellerUid: string, storeId: string, productData: Omit<Product, 'id' | 'sellerId' | 'storeId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Timestamp.now();
    const dataToSave: ProductData = {
      sellerId: sellerUid, 
      storeId: storeId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
      status: productData.status,
      images: productData.images || [],
      category: productData.category, 
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(productsCollection, dataToSave);
    console.log('Product added with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding product: ', e);
    throw new Error('Failed to add product.');
  }
}

/**
 * Gets a single product by ID.
 * @param productId The ID of the product to fetch.
 * @returns The product data or null if not found.
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDoc = doc(productsCollection, productId);
    const productSnapshot = await getDoc(productDoc);
    
    if (productSnapshot.exists()) {
      const data = productSnapshot.data() as ProductData;
      return {
        id: productSnapshot.id,
        ...data,
      };
    } else {
      console.log('No product found with ID:', productId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
};

/**
 * Updates an existing product in Firestore.
 * @param productId The ID of the product to update.
 * @param updatedData An object containing the fields to update.
 * @returns A promise that resolves when the product is updated.
 */
export const updateProduct = async (productId: string, updatedData: Partial<ProductData>): Promise<void> => {
  try {
    const productDocRef = doc(productsCollection, productId);
    await updateDoc(productDocRef, {
      ...updatedData,
      updatedAt: Timestamp.now(), // Always update the updatedAt timestamp
    });
    console.log(`Product with ID: ${productId} updated successfully.`);
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product.');
  }
};


/**
 * Retrieves all products listed by a specific seller.
 * @param sellerId The ID of the seller.
 * @returns A promise that resolves to an array of products.
 */
export const getProductsBySeller = async (sellerId: string): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products;
  } catch (error) {
    console.error('Error fetching products by seller:', error);
    throw new Error('Failed to fetch products by seller.');
  }
};

/**
 * Deletes a product from Firestore.
 * @param productId The ID of the product to delete.
 * @returns A promise that resolves when the product is deleted.
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const productDocRef = doc(productsCollection, productId);
    await deleteDoc(productDocRef);
    console.log(`Product with ID: ${productId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product.');
  }
};

// User Functions

/**
 * Retrieves a user's profile from Firestore.
 * @param uid The user's unique ID.
 * @returns The user's profile data, or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(usersCollection, uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { uid, ...userDocSnap.data() } as UserProfile;
    } else {
      console.log('No such user profile!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile.');
  }
};

// TODO: Add other user-related functions like createUserProfile, updateUserProfile if they don't exist

// Add this function
/**
 * Creates a new user profile in Firestore.
 * @param uid The user's unique ID.
 * @param displayName The user's display name.
 * @param role The user's role ('buyer' or 'seller').
 * @returns A promise that resolves when the profile is created.
 */
export const createUserProfile = async (uid: string, displayName: string, role: 'buyer' | 'seller'): Promise<void> => {
  try {
    const userDocRef = doc(usersCollection, uid);
    await setDoc(userDocRef, {
      email: auth.currentUser?.email, // Assuming you want to store the email
      displayName: displayName,
      role: role,
      createdAt: Timestamp.now(),
      // Add other default profile fields here if needed
    });
    console.log(`User profile created for UID: ${uid}`);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile.');
  }
};

// Store Interface (Assuming a basic structure)
export interface Store {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  socialMediaLinks?: Record<string, string>;
  operatingHours?: Record<string, string>; 
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags?: string[];
  averageRating?: number;
  reviewCount?: number;
}

export interface StoreData {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Store Functions
/**
 * Retrieves all stores owned by a specific user.
 * @param ownerId The ID of the store owner.
 * @returns A promise that resolves to an array of stores.
 */
export const getStoresByOwner = async (ownerId: string): Promise<Store[]> => {
  try {
    const q = query(storesCollection, where('ownerId', '==', ownerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const stores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
    return stores;
  } catch (error) {
    console.error('Error fetching stores by owner:', error);
    throw new Error('Failed to fetch stores by owner.');
  }
};

/**
 * Retrieves a single store by its seller's ID (ownerId).
 * Assumes a seller has at most one store, returns the first one found.
 * @param sellerId The ID of the seller (store owner).
 * @returns A promise that resolves to the store data or null if not found.
 */
export const getStoreBySellerId = async (sellerId: string): Promise<Store | null> => {
  try {
    const q = query(storesCollection, where('ownerId', '==', sellerId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Return the first store found for the seller
      const storeDoc = querySnapshot.docs[0];
      return { id: storeDoc.id, ...storeDoc.data() } as Store;
    }
    return null; // No store found for this seller
  } catch (error) {
    console.error('Error fetching store by seller ID:', error);
    throw new Error('Failed to fetch store by seller ID.');
  }
};

/**
 * Retrieves a store by its ID.
 * @param storeId The ID of the store to retrieve.
 * @returns A promise that resolves to the store or null if not found.
 */
export const getStoreById = async (storeId: string): Promise<Store | null> => {
  try {
    const storeDoc = doc(storesCollection, storeId);
    const storeSnapshot = await getDoc(storeDoc);
    
    if (storeSnapshot.exists()) {
      return { id: storeSnapshot.id, ...storeSnapshot.data() } as Store;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching store by ID:', error);
    throw new Error('Failed to fetch store.');
  }
};

/**
 * Retrieves all active products from a specific store.
 * @param storeId The ID of the store.
 * @returns A promise that resolves to an array of products from the store.
 */
export const getProductsByStoreId = async (storeId: string): Promise<Product[]> => {
  try {
    const q = query(
      productsCollection, 
      where('storeId', '==', storeId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products;
  } catch (error) {
    console.error('Error fetching products by store ID:', error);
    throw new Error('Failed to fetch store products.');
  }
};

/**
 * Updates an existing store in Firestore.
 * @param storeId The ID of the store to update.
 * @param updatedData An object containing the fields to update.
 * @returns A promise that resolves when the store is updated.
 */
export const updateStoreDetails = async (storeId: string, updates: Partial<StoreData>) => {
  try {
    const storeRef = doc(storesCollection, storeId);
    await updateDoc(storeRef, {
      ...updates,
      updatedAt: new Date()
    });
    console.log('Store details updated successfully');
  } catch (error) {
    console.error('Error updating store details:', error);
    throw error;
  }
};

// TODO: Add other store-related functions like createStore, getStoreById, deleteStore if they don't exist

// Order Interface
export interface Order {
  id: string;
  userId: string;
  sellerId: string; 
  storeId: string;
  items: Array<{ productId: string; productName: string; quantity: number; price: number; image?: string; storeId: string }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded'; // Added 'refunded'
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };
  paymentMethod: string; 
  paymentResult?: any; 
  createdAt: Timestamp;
  updatedAt: Timestamp;
  trackingNumber?: string;
  notes?: string; 
}

// Order Functions
/**
 * Retrieves all orders for a specific seller, optionally filtered by status.
 * @param sellerId The ID of the seller.
 * @param status Optional order status to filter by.
 * @returns A promise that resolves to an array of orders.
 */
export const getOrdersBySeller = async (sellerId: string, status?: Order['status']): Promise<Order[]> => {
  try {
    let q;
    if (status) {
      q = query(ordersCollection, where('sellerId', '==', sellerId), where('status', '==', status), orderBy('createdAt', 'desc'));
    } else {
      q = query(ordersCollection, where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    return orders;
  } catch (error) {
    console.error('Error fetching orders by seller:', error);
    throw new Error('Failed to fetch orders by seller.');
  }
};

/**
 * Updates the status of an order.
 * @param orderId The ID of the order to update.
 * @param newStatus The new status of the order.
 * @returns A promise that resolves when the order status is updated.
 */
export const updateOrderStatus = async (orderId: string, newStatus: Order['status']): Promise<void> => {
  try {
    const orderDocRef = doc(ordersCollection, orderId);
    await updateDoc(orderDocRef, {
      status: newStatus,
      updatedAt: Timestamp.now(),
    });
    console.log(`Order ${orderId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status.');
  }
};

// TODO: Add other order-related functions like createOrder, getOrderById if they don't exist

// Add after the existing store functions
export const createStore = async (storeData: any): Promise<string> => {
  try {
    const docRef = await addDoc(storesCollection, storeData);
    console.log('Store created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    throw new Error('Failed to create store.');
  }
};

// Add to existing firestoreActions.ts
export const getProductsByProximity = async (
  userLat: number, 
  userLng: number, 
  radiusKm: number = 10
): Promise<Product[]> => {
  try {
    // Get all stores first
    const storesSnapshot = await getDocs(storesCollection);
    const nearbyStoreIds: string[] = [];
    
    storesSnapshot.docs.forEach(doc => {
      const store = doc.data();
      if (store.latitude && store.longitude) {
        const distance = calculateDistance(
          userLat, userLng, 
          store.latitude, store.longitude
        );
        if (distance <= radiusKm) {
          nearbyStoreIds.push(doc.id);
        }
      }
    });
    
    // Get products from nearby stores
    if (nearbyStoreIds.length === 0) return [];
    
    const q = query(
      productsCollection,
      where('storeId', 'in', nearbyStoreIds.slice(0, 10)), // Firestore 'in' limit
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching products by proximity:', error);
    throw new Error('Failed to fetch nearby products.');
  }
};

// shipping address interface
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

// order creation data interface
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderCreateData {
  buyerId: string;
  buyerName: string; 
  sellerId: string;
  storeId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: any;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'completed'; // Added 'completed'
  paymentMethod: string;
  shippingCost: number;
  taxAmount: number;
}

export interface Order extends OrderCreateData {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // status is inherited from OrderCreateData and now includes 'completed'
}

/**
 * Creates a new order in Firestore.
 * @param orderData The data for the new order.
 * @returns The ID of the newly created order.
 */
export const createOrder = async (orderData: OrderCreateData): Promise<string> => {
  try {
    const now = Timestamp.now();
    const orderToSave = {
      ...orderData,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(ordersCollection, orderToSave);
    console.log('Order created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order.');
  }
};

/**
 * Gets a single order by ID.
 * @param orderId The ID of the order to fetch.
 * @returns The order data or null if not found.
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDocRef = doc(ordersCollection, orderId);
    const docSnap = await getDoc(orderDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    console.log('No such order found!');
    return null;
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    throw new Error('Failed to fetch order details.');
  }
};

/**
 * Retrieves all orders for a specific buyer.
 * @param buyerId The ID of the buyer.
 * @returns A promise that resolves to an array of orders.
 */
export const getOrdersByBuyer = async (buyerId: string): Promise<Order[]> => {
  try {
    const q = query(
      ordersCollection, 
      where('buyerId', '==', buyerId), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error('Error fetching orders by buyer:', error);
    throw new Error('Failed to fetch orders by buyer.');
  }
};

/**
 * Updates product stock after order creation.
 * @param items Array of order items to update stock for.
 */
export const updateProductStock = async (items: Array<{ productId: string; quantity: number }>): Promise<void> => {
  try {
    const updatePromises = items.map(async (item) => {
      const productDoc = doc(productsCollection, item.productId);
      const productSnapshot = await getDoc(productDoc);
      
      if (productSnapshot.exists()) {
        const currentStock = productSnapshot.data().stockQuantity;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        await updateDoc(productDoc, {
          stockQuantity: newStock,
          updatedAt: Timestamp.now(),
        });
      }
    });
    
    await Promise.all(updatePromises);
    console.log('Product stock updated successfully');
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw new Error('Failed to update product stock');
  }
};

/**
 * Retrieves all active products from all stores.
 * @returns A promise that resolves to an array of all active products.
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw new Error('Failed to fetch all products.');
  }
};

/**
 * Retrieves all stores.
 * @returns A promise that resolves to an array of all stores.
 */
export const getAllStores = async (): Promise<Store[]> => {
  try {
    const q = query(storesCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const stores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
    return stores;
  } catch (error) {
    console.error('Error fetching all stores:', error);
    throw new Error('Failed to fetch all stores.');
  }
};

/**
 * Retrieves featured products (first 8 active products).
 * @returns A promise that resolves to an array of featured products.
 */
export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.slice(0, 8).map(doc => ({ id: doc.id, ...doc.data() } as Product));
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw new Error('Failed to fetch featured products.');
  }
};

export const getProductSuggestions = async (searchQuery: string): Promise<Product[]> => {
  if (!searchQuery.trim()) {
    return [];
  }

  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('name', '>=', searchQuery.toLowerCase()), 
    where('name', '<=', searchQuery.toLowerCase() + '\uf8ff'), 
    limit(10) 
  );

  try {
    const querySnapshot = await getDocs(q);
    const suggestions: Product[] = [];
    querySnapshot.forEach((doc) => {
      suggestions.push({ id: doc.id, ...doc.data() } as Product);
    });
    return suggestions;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    throw new Error('Failed to fetch product suggestions.'); // Or return [] depending on how you want to handle errors
  }
};
