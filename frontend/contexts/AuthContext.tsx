'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User } from '@/types/cms';
import {
  login as apiLogin,
  logout as apiLogout,
  setAuthToken,
  getBrands,
} from '@/services/cmsApiService';
import { apiClient } from '@/services/apiClient';
import type { ServerSession } from '@/lib/auth/serverSession';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectedBrandId: string | null;
  selectBrand: (brandId: string) => void;
  clearBrand: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  sessionFromServer,
}: {
  children: ReactNode;
  sessionFromServer: ServerSession;
}) {
  const [user, setUser] = useState<User | null>(() => sessionFromServer.user);
  const isLoading = false;

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedBrand = localStorage.getItem('mcms_brand');
    if (storedBrand) {
      setSelectedBrandId(storedBrand);
    }

    if (sessionFromServer.token && sessionFromServer.user) {
      setAuthToken(sessionFromServer.token);
      localStorage.setItem('auth_token', sessionFromServer.token);
      localStorage.setItem('mcms_user', JSON.stringify(sessionFromServer.user));
      document.cookie = `auth_token=${sessionFromServer.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      setUser(sessionFromServer.user);
      return;
    }

    setAuthToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mcms_user');
    document.cookie = 'auth_token=; path=/; max-age=0';
    setUser(null);
  }, [sessionFromServer.token, sessionFromServer.user?.id]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await apiLogin(email, password);

      if (result) {
        setUser(result.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mcms_user', JSON.stringify(result.user));
          document.cookie = `auth_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }

        if (result.user.brandIds.length > 0) {
          const brands = await getBrands();
          const accessibleBrand = brands.find((b) => result.user.brandIds.includes(b.id));
          if (accessibleBrand) {
            setSelectedBrandId(accessibleBrand.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('mcms_brand', accessibleBrand.id);
            }
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setSelectedBrandId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcms_user');
      localStorage.removeItem('mcms_brand');
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; max-age=0';
    }
  }, []);

  useEffect(() => {
    apiClient.onUnauthorized(() => {
      logout();
      if (typeof window !== 'undefined') {
        // Full navigation resets all in-memory React state; router alone would leave a stale client tree after 401.
        window.location.href = '/login';
      }
    });
  }, [logout]);

  const selectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mcms_brand', brandId);
    }
  }, []);

  const clearBrand = useCallback(() => {
    setSelectedBrandId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mcms_brand');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        selectedBrandId,
        selectBrand,
        clearBrand,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
