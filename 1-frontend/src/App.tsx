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

import AboutPage from "@/pages/about-page";
import AboutProjectPage from "@/pages/about-project";
import TermsPage from "@/pages/terms-page";
import PrivacyPage from "@/pages/privacy-page";
import ContactPage from "@/pages/contact-page";
import AdminLoginPage from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import ManageCourses from "@/pages/admin/manage-courses";
import CourseVideosPage from "@/pages/course-videos";
import CourseLearnPage from "@/pages/course-learn";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import { AdminRouteProtection } from "./lib/admin-route-protection";

import AdminCommentsPage from "@/pages/admin/comments";
import AdminUsersPage from "@/pages/admin/users";
import ApiTester from "@/pages/admin/api-tester";
import AdminRateLimiting from "@/pages/admin/rate-limiting";
import WistiaTestPage from "@/pages/admin/wistia-test";

import UserProfilePage from "@/pages/user-profile";
import RateLimitingDebug from "./pages/admin/rate-limiting-debug";
import RedisAdminPage from "@/pages/admin/redis-admin";


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

      <Route path="/about" component={AboutPage} />
      <Route path="/about-project" component={AboutProjectPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      
      {/* Admin route protection - redirect to home if not logged in */}
      <Route path="/admin">
        <AdminRouteProtection />
      </Route>
      
      <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/courses" component={ManageCourses} />
      <AdminProtectedRoute path="/admin/comments" component={AdminCommentsPage} />
      <AdminProtectedRoute path="/admin/users" component={AdminUsersPage} />

      <AdminProtectedRoute path="/admin/api-tester" component={ApiTester} />
      <AdminProtectedRoute path="/admin/wistia-test" component={WistiaTestPage} />
      <AdminProtectedRoute path="/admin/rate-limiting" component={AdminRateLimiting} />
      <AdminProtectedRoute path="/admin/rate-limiting/debug" component={RateLimitingDebug} />
      <AdminProtectedRoute path="/admin/redis-admin" component={RedisAdminPage} />

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
