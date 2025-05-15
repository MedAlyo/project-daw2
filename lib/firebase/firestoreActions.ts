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
  updateDoc,
  deleteDoc,
  Timestamp, // Import Timestamp if you want to use Firestore Timestamps
  setDoc // Import setDoc to create a document with a specific ID
} from 'firebase/firestore';

// Define the path to your collections
const productsCollection = collection(db, 'products');
const usersCollection = collection(db, 'users'); // Collection for user profiles

// Define the Product interface (should match the one in your components)
// Using Timestamp for date fields is generally better practice with Firestore
interface ProductData {
  sellerId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string; // Optional image URL
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface for a product document retrieved from Firestore, including its ID
interface Product extends ProductData {
    id: string; // Add id for fetched products
}

// Define the UserProfile interface
interface UserProfile {
  uid: string; // Firebase Auth User ID
  displayName: string; // Username
  role: 'buyer' | 'seller'; // User's role
  createdAt: Timestamp;
}


/**
 * Adds a new product to Firestore.
 * @param productData The product data to add (excluding createdAt/updatedAt).
 * @returns Promise<string> The ID of the newly created document.
 */
export const addProduct = async (productData: Omit<ProductData, 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Add createdAt and updatedAt timestamps
    const now = Timestamp.now();
    const dataToSave: ProductData = {
      ...productData,
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
    // Get a reference to the specific document
    const docRef = doc(db, 'products', productId);

    // Add or update the updatedAt timestamp
    const dataToUpdate = {
      ...productData,
      updatedAt: Timestamp.now(),
    };

    // Update the document
    await updateDoc(docRef, dataToUpdate);

    console.log("Product updated successfully:", productId);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
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