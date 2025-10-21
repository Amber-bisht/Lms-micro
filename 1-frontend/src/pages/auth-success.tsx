import React from "react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api";

export default function AuthSuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { refetchUser } = useAuth();

  const clearCookies = () => {
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  };

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptAuth = async (): Promise<boolean> => {
        try {
          console.log(`Attempting authentication check (attempt ${retryCount + 1})...`);
          
          // Check if the user is authenticated by calling the backend
          const response = await apiGet('/auth/me');

          console.log('Auth response status:', response.status);
          console.log('Auth response headers:', Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            const userData = await response.json();
            console.log('User data received:', userData);
            
            // Refetch user data in the auth context
            await refetchUser();
            
            // Redirect to homepage after successful authentication
            setTimeout(() => {
              navigate("/");
            }, 2000);
            return true;
          } else {
            console.error('OAuth success - user not authenticated:', response.status);
            return false;
          }
        } catch (err) {
          console.error("OAuth success error:", err);
          return false;
        }
      };

      // Try authentication with retries
      while (retryCount < maxRetries) {
        const success = await attemptAuth();
        if (success) {
          break;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Authentication failed, retrying in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }

      if (retryCount >= maxRetries) {
        setError("Authentication failed - user not logged in after multiple attempts");
      }
      
      setIsLoading(false);
    };

    handleOAuthSuccess();
  }, [navigate, refetchUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
            <p className="text-muted-foreground">Please wait while we log you in.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate("/auth")} className="w-full">
                Try Again
              </Button>
              <Button 
                onClick={clearCookies} 
                variant="outline" 
                className="w-full"
              >
                Clear Cookies & Try Again
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Welcome back! You have been successfully logged in.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the homepage...
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
} 