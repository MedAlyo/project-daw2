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

const productsCollection = collection(db, 'products');
const usersCollection = collection(db, 'users');
const storesCollection = collection(db, 'stores');
const ordersCollection = collection(db, 'orders');


interface ProductData {
  sellerId: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'draft';
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product extends ProductData { 
    id: string;
}

interface UserProfile {
  uid: string; // Firebase Auth User ID
  displayName: string; // Username
  role: 'buyer' | 'seller'; // User's role
  createdAt: Timestamp;
}

// Define the Order interface
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Store {
  id?: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  location: {
    lat: number;
    lng: number;
  };
  phone: string;
  email: string;
  logoUrl?: string;
  bannerUrl?: string;
  categories: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Adds a new product to Firestore.
 * @param sellerUid The ID of the seller.
 * @param storeId The ID of the store this product belongs to.
 * @param productData The product data to add (excluding createdAt/updatedAt).
 * @returns Promise<string> The ID of the newly created document.
 */
export const createProductListing = async (sellerUid: string, storeId: string, productData: Omit<Product, 'id' | 'sellerId' | 'storeId' | 'createdAt' | 'updatedAt' | 'imageUrl'>): Promise<string> => {
  try {
    // Add createdAt and updatedAt timestamps
    const now = Timestamp.now();
    const dataToSave: ProductData = {
      sellerId: sellerUid, 
      storeId: storeId, // <-- ADDED: Save the storeId
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      status: productData.status,
      // imageUrl: productData.imageUrl, // Uncomment if you plan to use imageUrl
      createdAt: now,
      updatedAt: now,
    };

    // Add the document to the 'products' collection
    const docRef = await addDoc(productsCollection, dataToSave);

    console.log("Product added with ID:", docRef.id);
    return docRef.id; // Return the ID of the new document
  } catch (error) {
    console.error("Error adding product:", error);
    throw error; // Re-throw the error for handling in the component
  }
};


/**
 * Gets all products for a specific seller.
 * @param sellerId The ID of the seller.
 * @returns Promise<Product[]> An array of products belonging to the seller.
 */
export const getProductsBySeller = async (sellerId: string): Promise<Product[]> => {
  try {
    // Create a query to filter products by sellerId
    const q = query(productsCollection, where("sellerId", "==", sellerId));

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Map the documents to Product objects, including the document ID
    const products: Product[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as ProductData // Cast data to ProductData interface
    }));

    console.log(`Fetched ${products.length} products for seller ${sellerId}`);
    return products;
  } catch (error) {
    console.error("Error getting products by seller:", error);
    throw error;
  }
};


/**
 * Gets a single product by its ID.
 * @param productId The ID of the product document.
 * @returns Promise<Product | null> The product data or null if not found.
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    // Get a reference to the specific document
    const docRef = doc(db, 'products', productId);

    // Get the document snapshot
    const docSnap = await getDoc(docRef);

    // Check if the document exists
    if (docSnap.exists()) {
      console.log("Product data:", docSnap.data());
      // Return the product data including the ID
      return {
        id: docSnap.id,
        ...docSnap.data() as ProductData
      };
    } else {
      // Document does not exist
      console.log("No such product document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting product by ID:", error);
    throw error;
  }
};


/**
 * Updates an existing product document.
 * @param productId The ID of the product document to update.
 * @param productData The updated product data (excluding sellerId, createdAt).
 * @returns Promise<void>
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<ProductData, 'sellerId' | 'createdAt'>>): Promise<void> => {
  try {
    console.log(`[firestoreActions] Attempting to update product. ID: ${productId}`, JSON.stringify(productData, null, 2)); // Enhanced log
    const docRef = doc(db, 'products', productId);

    // Ensure storeId is not accidentally removed if it's not in productData but should be preserved.
    // However, the current Omit type for productData in the function signature already excludes sellerId and createdAt.
    // If storeId is also meant to be immutable or handled differently, adjust the type and logic here.
    // For now, we assume productData contains all fields intended for update.

    const dataToUpdate = {
      ...productData,
      updatedAt: Timestamp.now(),
    };

    console.log('[firestoreActions] Data being sent to Firestore for update:', JSON.stringify(dataToUpdate, null, 2)); // New log

    await updateDoc(docRef, dataToUpdate);

    console.log("[firestoreActions] Product updated successfully:", productId);
  } catch (error: any) { // Catch as 'any' to access potential Firestore error properties
    console.error("[firestoreActions] Error updating product:", error);
    console.error(`[firestoreActions] Failed to update product. ID: ${productId}, Data:`, JSON.stringify(productData, null, 2));
    // Log specific Firestore error details if available
    if (error.code) {
      console.error(`[firestoreActions] Firestore Error Code: ${error.code}`);
    }
    if (error.message) {
      console.error(`[firestoreActions] Firestore Error Message: ${error.message}`);
    }
    console.error('[firestoreActions] Full Firestore error object:', JSON.stringify(error, null, 2)); // Log the full error object
    throw error; // Re-throw the original error
  }
};


/**
 * Deletes a product document.
 * @param productId The ID of the product document to delete.
 * @returns Promise<void>
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    // Get a reference to the specific document
    const docRef = doc(db, 'products', productId);

    // Delete the document
    await deleteDoc(docRef);

    console.log("Product deleted successfully:", productId);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

/**
 * Creates a user profile document in Firestore.
 * The document ID will be the user's Firebase Auth UID.
 * @param uid - The Firebase Auth User ID.
 * @param displayName - The user's chosen display name (username).
 * @param role - The user's chosen role ('buyer' or 'seller').
 * @returns Promise<void>
 */
export const createUserProfile = async (uid: string, displayName: string, role: 'buyer' | 'seller'): Promise<void> => {
  try {
    // Get a reference to the document using the user's UID as the document ID
    const userDocRef = doc(db, 'users', uid);

    // Data to save in the user profile document
    const profileData: UserProfile = {
      uid,
      displayName,
      role,
      createdAt: Timestamp.now(), // Add creation timestamp
    };

    // Use setDoc to create the document with the specified UID
    await setDoc(userDocRef, profileData);

    console.log(`User profile created for UID: ${uid} with role: ${role}`);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

/**
 * Fetches a user profile document by UID.
 * @param uid - The Firebase Auth User ID.
 * @returns Promise<UserProfile | null> The user profile data or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log("User profile data:", docSnap.data());
      return docSnap.data() as UserProfile;
    } else {
      console.log("No user profile document found for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Gets all stores for a specific owner.
 * @param ownerId The ID of the owner (seller).
 * @returns Promise<Store[]> An array of stores belonging to the owner.
 */
export const getStoresByOwner = async (ownerId: string): Promise<Store[]> => {
  try {
    const q = query(storesCollection, where("ownerId", "==", ownerId));
    const querySnapshot = await getDocs(q);
    const stores: Store[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Store, 'id'> // Cast data, id is from doc.id
    }));
    console.log(`Fetched ${stores.length} stores for owner ${ownerId}`);
    return stores;
  } catch (error) {
    console.error("Error getting stores by owner:", error);
    throw error;
  }
};

/**
 * Gets all orders for a specific seller, optionally filtered by status
 * @param sellerId The ID of the seller
 * @param status Optional status to filter orders (e.g., 'pending', 'processing')
 * @returns Promise<Order[]> An array of orders for the seller
 */
export const getOrdersBySeller = async (sellerId: string, status?: string): Promise<Order[]> => {
  try {
    let q;
    
    if (status) {
      // Query orders for this seller with the specified status
      q = query(
        ordersCollection,
        where('sellerId', '==', sellerId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Query all orders for this seller
      q = query(
        ordersCollection,
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Order, 'id'>
    }));

    console.log(`Fetched ${orders.length} orders for seller ${sellerId}${status ? ` with status ${status}` : ''}`);
    return orders;
  } catch (error) {
    console.error('Error getting orders by seller:', error);
    throw error;
  }
};

/**
 * Updates the status of an order
 * @param orderId The ID of the order to update
 * @param newStatus The new status to set
 * @returns Promise<void>
 */
export const updateOrderStatus = async (orderId: string, newStatus: Order['status']): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: Timestamp.now()
    });
    console.log(`Order ${orderId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const createStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, 'stores'), {
      ...storeData,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating store:', error);
    throw error;
  }
};

export const updateStore = async (storeId: string, storeData: Partial<Store>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'stores', storeId), {
      ...storeData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating store:', error);
    throw error;
  }
};