// ─────────────────────────────────────────────────────────
// useAuth Hook — CutSugar
// ─────────────────────────────────────────────────────────
// Convenience hook that wraps the auth store and provides
// helper computed properties for navigation guards.
// ─────────────────────────────────────────────────────────

import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    user,
    isLoading,
    isInitialized,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    deleteAccount,
  } = useAuthStore();

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,

    // Auth actions
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    deleteAccount,

    // Computed helpers
    displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
    avatarUrl: user?.photoURL || null,
    providerLabel:
      user?.provider === 'google' ? 'Google' :
      user?.provider === 'apple' ? 'Apple' :
      user?.provider === 'email' ? 'Email' : '',
  };
}
