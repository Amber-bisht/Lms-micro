import React from "react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FaGoogle /* , FaGithub */ } from "react-icons/fa";
import { Code } from "lucide-react";

export default function AuthPage() {
  const { user, loginWithGoogle /* , loginWithGitHub */ } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 flex">
        <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto">
          {/* Form Column */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-2">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome to LMS
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Sign in with your social account to access your learning journey
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12"
                    onClick={loginWithGoogle}
                  >
                    <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
                    Continue with Google
                  </Button>
                  {/* <Button 
                    type="button"
                    variant="outline" 
                    className="w-full h-12"
                    onClick={loginWithGitHub}
                  >
                    <FaGithub className="mr-2 h-5 w-5" />
                    Continue with GitHub
                  </Button> */}
                </div>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">
                      Secure OAuth authentication
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>No password required. Your account is securely managed by your chosen provider.</p>
                </div>
              </div>
              
              <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link href="/terms">
                  <a className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </a>
                </Link>{" "}
                and{" "}
                <Link href="/privacy">
                  <a className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </a>
                </Link>
                .
              </p>
            </div>
          </div>
          
          {/* Hero Column */}
          <div className="hidden md:block w-1/2 bg-muted p-10">
            <div className="h-full flex flex-col justify-center">
              <h1 className="text-4xl font-bold tracking-tight">
                LMS
              </h1>
              <p className="text-muted-foreground mt-4 text-lg max-w-md text-balance">
                Learn to code and unlock your future with our comprehensive courses. 
                From web development to data science, we have everything you need to launch your 
                programming career.
              </p>
              <ul className="mt-8 space-y-3">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Expert-led video courses</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Hands-on coding exercises</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Project-based learning</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Certificate of completion</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
