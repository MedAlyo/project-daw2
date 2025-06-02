// lib/firebase/firestoreActions.ts
import { db } from '@/lib/firebase/config'; // Import your initialized Firestore instance
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
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // <-- ADDED: Firebase Storage imports
import { calculateDistance } from '@/lib/utils/location'; // <-- ADDED: Import calculateDistance

const productsCollection = collection(db, 'products');
const usersCollection = collection(db, 'users');
const storesCollection = collection(db, 'stores');
const ordersCollection = collection(db, 'orders');

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'buyer' | 'seller'; // Example roles
  storeId?: string; // Optional: if the user is a seller
  createdAt: Timestamp;
  // Add other profile fields as needed
}

interface ProductData {
  sellerId: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  // stock: number; // Changed from stock
  stockQuantity: number; // Changed to stockQuantity
  status: 'active' | 'draft';
  // imageUrl?: string; // Changed from imageUrl
  images?: string[]; // Changed to images (array of strings, optional)
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
    // Add createdAt and updatedAt timestamps
    const now = Timestamp.now();
    const dataToSave: ProductData = {
      sellerId: sellerUid, 
      storeId: storeId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
      status: productData.status,
      images: productData.images || [], // Ensure images is an array, default to empty if not provided
      createdAt: now,
      updatedAt: now,
    };

    // Add the document to the 'products' collection
    const docRef = await addDoc(productsCollection, dataToSave); // Changed to save dataToSave
    console.log('Product added with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding product: ', e);
    throw new Error('Failed to add product.');
  }
}

/**
 * Retrieves a single product by its ID from Firestore.
 * @param productId The ID of the product to retrieve.
 * @returns A promise that resolves to the product data or null if not found.
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDocRef = doc(productsCollection, productId);
    const productDocSnap = await getDoc(productDocRef);

    if (productDocSnap.exists()) {
      return { id: productDocSnap.id, ...productDocSnap.data() } as Product;
    } else {
      console.log('No such product!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw new Error('Failed to fetch product.');
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

// Store Interface (Assuming a basic structure)
export interface Store {
  id: string;
  ownerId: string; // This is the sellerId
  name: string;
  location: string; // Added location field
  description?: string;
  // Add other store-related fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Added StoreData interface for updates
export interface StoreData {
  name?: string;
  location?: string;
  description?: string;
  // include other fields that can be updated
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
 * Updates an existing store in Firestore.
 * @param storeId The ID of the store to update.
 * @param updatedData An object containing the fields to update.
 * @returns A promise that resolves when the store is updated.
 */
export const updateStoreDetails = async (storeId: string, updatedData: Partial<StoreData>): Promise<void> => {
  try {
    const storeDocRef = doc(storesCollection, storeId);
    await updateDoc(storeDocRef, {
      ...updatedData,
      updatedAt: Timestamp.now(), // Always update the updatedAt timestamp
    });
    console.log(`Store with ID: ${storeId} updated successfully.`);
  } catch (error) {
    console.error('Error updating store:', error);
    throw new Error('Failed to update store.');
  }
};

// TODO: Add other store-related functions like createStore, getStoreById, deleteStore if they don't exist

// Order Interface
export interface Order {
  id: string;
  buyerId: string;
  buyerName?: string; // Added buyerName (optional for now)
  sellerId: string;
  storeId: string;
  items: Array<{ productId: string; quantity: number; price: number }>; // Array of items in the order
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: object; // Or a more specific address interface
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Add other order-related fields
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
 * @param status The new status of the order.
 * @returns A promise that resolves when the order status is updated.
 */
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  try {
    const orderDocRef = doc(ordersCollection, orderId);
    await updateDoc(orderDocRef, {
      status: status,
      updatedAt: Timestamp.now(),
    });
    console.log(`Order with ID: ${orderId} status updated to ${status}.`);
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
      if (store.location && store.location.lat && store.location.lng) {
        const distance = calculateDistance(
          userLat, userLng, 
          store.location.lat, store.location.lng
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
