"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, WifiOff } from "lucide-react";
import { apiClient } from "@/lib/api";

// Export UserProfile type for external use
export interface UserProfile {
  uid: number;
  email: string | null;
  name: string | null;
  role: "client" | "freelancer" | null;
  rating?: number;
}

interface AuthContextType {
  user: any | null | undefined;
  userProfile: UserProfile | null | undefined;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      apiClient.setToken(token);
      const response = await apiClient.getUserProfile();
      
      if (response.error) {
        // Token might be expired, clear it
        apiClient.clearToken();
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setError('Session expired. Please log in again.');
      } else if (response.data) {
        setUser(response.data.user);
        setUserProfile({
          uid: response.data.profile.uid,
          email: response.data.profile.email,
          name: response.data.profile.name,
          role: response.data.profile.role,
          rating: response.data.profile.rating,
        });
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to verify authentication status');
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(email, password);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }

      if (response.data) {
        setUser(response.data.user);
        setUserProfile({
          uid: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
        });
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
          } finally {
      setLoading(false);
          }
      };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(userData);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }

      if (response.data) {
        setUser(response.data.user);
        setUserProfile({
          uid: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
        });
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
        try {
      await apiClient.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);
  }
  };

  // Display a full-page loader during initial authentication check
  if (loading && user === undefined) {
     return (
       <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999]">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
   }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        logout,
        login,
        register,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
