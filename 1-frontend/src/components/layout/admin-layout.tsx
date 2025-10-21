import React from "react";
import { Link, useLocation } from "wouter";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Bookmark,
  Bell,
  MessageCircle,
  Shield,
  BarChart,
  Users,
  Star,
  Link as LinkIcon,
  Eye,
  TrendingUp,
  Activity,
  Settings,
  PlusCircle,
  FileText,
  AlertTriangle,
  BookOpen,
  Database,
  Play,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const sidebarItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Dashboard overview and quick actions"
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderOpen,
    description: "Manage course categories"
  },
  {
    title: "Courses",
    href: "/admin/courses",
    icon: Bookmark,
    description: "Manage course content"
  },
  {
    title: "Rate Limiting",
    href: "/admin/rate-limiting",
    icon: Shield,
    description: "Manage blocked IPs"
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage user accounts"
  },

  {
    title: "Comments",
    href: "/admin/comments",
    icon: FileText,
    description: "Manage user comments"
  },
  {
    title: "API Tester",
    href: "/admin/api-tester",
    icon: Settings,
    description: "Test API endpoints directly"
  },
  {
    title: "Wistia Test",
    href: "/admin/wistia-test",
    icon: Play,
    description: "Test and configure Wistia video player"
  },
  {
    title: "Redis Admin",
    href: "/admin/redis-admin",
    icon: Database,
    description: "Manage Redis data and cache"
  }
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-80 bg-background border-r border-border hidden lg:block">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3",
                      isActive && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {title && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
} 