import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, InsertProfile } from '../schema';
import { apiRequest, getQueryFn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleRateLimitError } from '@/lib/rate-limit-utils';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  logoutMutation: ReturnType<typeof useMutation<void, Error, void>>;
  updateProfileMutation: ReturnType<typeof useMutation<User, Error, InsertProfile>>;
  loginMutation: ReturnType<typeof useMutation<User, Error, { username: string; password: string }>>;
  adminLoginWithGoogleIdMutation: ReturnType<typeof useMutation<User, Error, { googleId: string; email: string }>>;
  refetchUser: () => void;
  // OAuth methods
  loginWithGoogle: () => void;
  // loginWithGitHub: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(getApiUrl("/auth/me"), {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch(getApiUrl("/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["user"], userData);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      // Handle rate limit errors
      if (!handleRateLimitError(error, 'login')) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const adminLoginWithGoogleIdMutation = useMutation({
    mutationFn: async (credentials: { googleId: string; email: string }) => {
      const res = await fetch(getApiUrl("/admin-login-google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Admin login failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["user"], userData);
      toast({
        title: "Admin login successful",
        description: "Welcome to admin panel!",
      });
    },
    onError: (error: Error) => {
      // Handle rate limit errors
      if (!handleRateLimitError(error, 'login')) {
        toast({
          title: "Admin login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: InsertProfile) => {
      const res = await fetch(getApiUrl("/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Profile update failed");
      }
      return await res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(["user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(getApiUrl("/logout"), {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // OAuth login methods
  const loginWithGoogle = () => {
    window.location.href = getApiUrl('/auth/google');
  };
  // const loginWithGitHub = () => {
  //   window.location.href = getApiUrl('/auth/github');
  // };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        logoutMutation,
        updateProfileMutation,
        loginMutation,
        adminLoginWithGoogleIdMutation,
        refetchUser: refetch,
        loginWithGoogle,
        // loginWithGitHub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
