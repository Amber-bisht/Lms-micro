import React from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center bg-black">
        <img 
          src="https://i.ytimg.com/vi/6QfJURAhBZo/maxresdefault.jpg" 
          alt="404 - Page Not Found"
          className="w-1/2 h-auto object-contain"
        />
      </main>
      <SiteFooter />
    </div>
  );
}
