"use client";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  HomeIcon,
  LucideProps,
  Settings,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Interface defining the structure of navigation link objects
// Ensures type safety and consistent shape for dashboard navigation items
interface NavigationProps {
  id: number;           // Unique identifier for the link
  name: string;         // Display name of the navigation item
  href: string;         // URL path for the navigation link
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;  // Type definition for Lucide React icons
}

// Static array of dashboard navigation links
// Centralizes navigation configuration for easy maintenance
export const dashboardLinks: NavigationProps[] = [
  {
    id: 0,
    name: "Event Types",    // First dashboard section
    href: "/dashboard",     // Base dashboard route
    icon: HomeIcon,         // Associated icon from Lucide React
  },
  {
    id: 1,
    name: "Meetings",       // Meetings section
    href: "/dashboard/meetings",
    icon: Users2,
  },
  {
    id: 2,
    name: "Availability",   // Availability management section
    href: "/dashboard/availability",
    icon: CalendarCheck,
  },
  {
    id: 3,
    name: "Settings",       // User settings section
    href: "/dashboard/settings",
    icon: Settings,
  },
];

// DashboardLinks Component: Renders dynamic navigation menu
export function DashboardLinks() {
  // Hook to get the current pathname for active link styling
  const pathname = usePathname();

  return (
    <>
      {/* Map through dashboardLinks to create dynamic navigation menu */}
      {dashboardLinks.map((link) => (
        <Link
          key={link.id}              // Unique key for React list rendering
          href={link.href}            // Navigation destination
          className={cn(
            // Conditional styling based on current pathname
            pathname === link.href
              ? "text-primary bg-primary/10"    // Active link styling
              : "text-muted-foreground hover:text-foreground", 
            // Shared link styling for consistent appearance
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
          )}
        >
          {/* Render link icon with consistent sizing */}
          <link.icon className="size-4" />
          
          {/* Display link name */}
          {link.name}
        </Link>
      ))}
    </>
  );
}