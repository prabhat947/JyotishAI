"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Home,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  MessageSquare,
  Globe,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transits", href: "/transits", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient();

  // Extract profile ID from URL params if present
  const profileId = params?.id as string | undefined;
  const isOnProfilePage = pathname?.startsWith("/profile/") && profileId;

  const profileNavigation = profileId
    ? [
        { name: "Charts", href: `/profile/${profileId}`, icon: BarChart3 },
        { name: "Reports", href: `/profile/${profileId}/reports`, icon: FileText },
        { name: "AI Chat", href: `/profile/${profileId}/chat`, icon: MessageSquare },
        { name: "Transits", href: "/transits", icon: Globe },
      ]
    : [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <div className="w-64 glass border-r border-border flex flex-col">
      <div className="p-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-primary">JyotishAI</h1>
          <p className="text-xs text-muted-foreground mt-1">Vedic Astrology</p>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {/* Main navigation */}
        {mainNavigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md mb-1
                transition-colors
                ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Profile-specific navigation */}
        {isOnProfilePage && (
          <>
            <div className="my-3 border-t border-border" />
            <p className="px-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Profile
            </p>
            {profileNavigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md mb-1
                    transition-colors
                    ${
                      active
                        ? "bg-secondary/10 text-secondary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
