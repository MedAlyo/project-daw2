import {
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User,
  updatePassword 
} from 'firebase/auth'; 
import { auth } from '@/lib/firebase/config';

/**
 * @param email 
 * @returns
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error; 
  }
};

/**
 * @param user
 * @returns
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
 * @param oobCode
 * @returns
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
 * @param oobCode
 * @param newPassword
 * @returns
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
 * @param newPassword
 * @returns
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