import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { VideoPlayerProvider } from "@/contexts/VideoPlayerContext";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AuthSuccessPage from "@/pages/auth-success";
import ProfileCompletion from "@/pages/profile-completion";
import ProfilePage from "@/pages/profile-page";
import ProfileEditPage from "@/pages/profile-edit";
import CourseDetail from "@/pages/course-detail";

import AdminVideos from "@/pages/admin/videos";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCourses from "@/pages/admin/courses-video-integration";
import CourseVideosPage from "@/pages/course-videos";
import CourseLearnPage from "@/pages/course-learn";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AdminRouteProtection } from "./lib/admin-route-protection";

import UserProfilePage from "@/pages/user-profile";


function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/success" component={AuthSuccessPage} />
      <ProtectedRoute path="/profile/complete" component={ProfileCompletion} />
      <ProtectedRoute path="/profile/edit" component={ProfileEditPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/course/:courseSlug" component={CourseDetail} />
      <Route path="/course/:courseSlug/play" component={CourseVideosPage} />
      
      {/* Admin route protection - redirect to home if not logged in */}
      <Route path="/admin">
        <AdminRouteProtection />
      </Route>
      
      <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/videos" component={AdminVideos} />
      <AdminProtectedRoute path="/admin/courses" component={AdminCourses} />

      <ProtectedRoute path="/course-videos" component={CourseVideosPage} />

      <Route path="/user/:username" component={UserProfilePage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get dehydrated state from SSR
  const dehydratedState = (window as any).__DEHYDRATED_STATE__;

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <ThemeProvider defaultTheme="light" storageKey="lms-theme">
          <AuthProvider>
            <VideoPlayerProvider>
              <Router />
              <Toaster />
            </VideoPlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

export default App;
