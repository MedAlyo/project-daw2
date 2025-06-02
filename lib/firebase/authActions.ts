// lib/firebase/authActions.ts
import {
  getAuth, // Not needed here if auth instance is passed or imported
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User,
  updatePassword // <-- Import updatePassword
} from 'firebase/auth'; // Direct import from firebase/auth
import { auth } from '@/lib/firebase/config'; // Import your initialized auth instance

/**
 * Sends a password reset email to the given email address.
 * @param email The user's email address.
 * @returns Promise<void>
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    // You might want to add logging or success handling here
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error; // Re-throw to be caught by the calling component
  }
};

/**
 * Sends an email verification link to the currently signed-in user.
 * Assumes the user is already signed in.
 * @param user The Firebase user object.
 * @returns Promise<void>
 */
export const sendVerificationEmail = async (user: User | null): Promise<void> => {
  if (!user) {
    throw new Error('No user is currently signed in to send verification email.');
  }
  try {
    await sendEmailVerification(user);
    console.log('Verification email sent to:', user.email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Verifies the password reset code from the email link.
 * @param oobCode The out-of-band code from the URL.
 * @returns Promise<string> The email of the user if the code is valid.
 */
export const verifyResetCode = async (oobCode: string): Promise<string> => {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    console.log('Password reset code verified for email:', email);
    return email;
  } catch (error) {
    console.error('Error verifying password reset code:', error);
    throw error;
  }
};

/**
 * Completes the password reset process with a new password.
 * @param oobCode The out-of-band code from the URL.
 * @param newPassword The new password.
 * @returns Promise<void>
 */
export const resetUserPassword = async (oobCode: string, newPassword: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    console.log('Password has been reset successfully.');
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Updates the password for the currently signed-in user.
 * @param newPassword The new password.
 * @returns Promise<void>
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in to update password.');
  }
  try {
    await updatePassword(user, newPassword);
    console.log('Password updated successfully for user:', user.email);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Note: 2FA with email is more complex and not a standard Firebase Auth feature for email/password.
// It typically involves generating a one-time code, sending it via a separate email mechanism (e.g., Firebase Functions + SendGrid),
// and then verifying it. We'll create a placeholder page for now.