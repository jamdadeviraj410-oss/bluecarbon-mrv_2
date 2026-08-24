/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '../utils/constants';
import {
  loginUser,
  signUpUser,
  logoutUser,
  resetPassword as sendPasswordReset,
  subscribeToAuthChanges,
  getCurrentUser,
  updateUserProfile,
} from '../services/authService';

import { IS_UI_PREVIEW_MODE, PREVIEW_USER } from '../config/uiPreviewMode';

const AuthContext = createContext(null);

export const AUTH_STATUS = {
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  PROFILE_PENDING: 'PROFILE_PENDING',
  PROFILE_INVALID: 'PROFILE_INVALID',
  ERROR: 'ERROR',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(IS_UI_PREVIEW_MODE ? PREVIEW_USER : null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(IS_UI_PREVIEW_MODE ? false : true);
  const [authStatus, setAuthStatus] = useState(IS_UI_PREVIEW_MODE ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.INITIALIZING);

  // Helper to format user object for app consumption
  // STRICT: Never fall back to NCCR_ADMIN or any administrative role
  const formatAuthUser = (supabaseUser, profile) => {
    if (!supabaseUser) return null;

    const metadata = supabaseUser.user_metadata || {};
    // Canonical role resolution: explicit DB profile role > metadata role > null
    const rawRole = profile?.role || metadata.role || null;
    const role = (rawRole && Object.values(ROLES).includes(rawRole)) ? rawRole : (rawRole ? rawRole : null);
    const orgName = profile?.organization?.name || metadata.organization || null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: profile?.full_name || metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || 'User',
      role,
      organization: orgName,
      organizationId: profile?.organization_id || metadata.organization_id || null,
      phone: profile?.phone || metadata.phone || null,
      avatar: profile?.avatar_url || null,
      profile,
      isRoleAssigned: Boolean(role),
    };
  };

  // Restore session on mount & subscribe to changes
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const current = await getCurrentUser();
        if (isMounted) {
          if (current) {
            const formatted = formatAuthUser(current, current.profile);
            setUser(formatted);
            setAuthStatus(formatted.role ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.PROFILE_PENDING);
          } else {
            setUser(null);
            setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (isMounted) {
          setUser(null);
          setAuthStatus(AUTH_STATUS.ERROR);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const { data: authListener } = subscribeToAuthChanges((_event, currentSession, profile) => {
      if (!isMounted) return;

      setSession(currentSession);
      if (currentSession?.user) {
        const formatted = formatAuthUser(currentSession.user, profile);
        setUser(formatted);
        setAuthStatus(formatted.role ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.PROFILE_PENDING);
      } else {
        setUser(null);
        setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const { user: authUser, profile, session: authSession } = await loginUser(email, password);
      const appUser = formatAuthUser(authUser, profile);
      setUser(appUser);
      setSession(authSession);
      setAuthStatus(appUser.role ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.PROFILE_PENDING);
      return appUser;
    } catch (err) {
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const { user: authUser, profile, session: authSession } = await signUpUser(data);
      if (authUser) {
        const appUser = formatAuthUser(authUser, profile);
        setUser(appUser);
        setSession(authSession);
        setAuthStatus(appUser.role ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.PROFILE_PENDING);
        return { user: appUser, session: authSession, requiresConfirmation: !authSession };
      }
      return { user: null, session: null, requiresConfirmation: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setSession(null);
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
      setSession(null);
      setAuthStatus(AUTH_STATUS.UNAUTHENTICATED);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    return await sendPasswordReset(email);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.id) return;
    const updatedProfile = await updateUserProfile(user.id, updates);
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: updatedProfile.full_name || prev.name,
        phone: updatedProfile.phone || prev.phone,
        avatar: updatedProfile.avatar_url || prev.avatar,
        profile: updatedProfile,
      };
    });
    return updatedProfile;
  }, [user]);

  const value = {
    user,
    session,
    role: user?.role || null,
    isAuthenticated: Boolean(user && user.role),
    isProfilePending: Boolean(user && !user.role),
    isLoading,
    authStatus,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
