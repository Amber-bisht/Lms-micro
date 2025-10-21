import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function AdminRouteProtection() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If not logged in, redirect to home page
        navigate("/");
      } else if (user.isAdmin) {
        // If logged in and is admin, redirect to admin dashboard
        navigate("/admin/dashboard");
      } else {
        // If logged in but not admin, redirect to home page
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // This component should never render its content as it always redirects
  return null;
}
