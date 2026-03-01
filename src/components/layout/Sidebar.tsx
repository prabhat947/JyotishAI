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
  X,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transits", href: "/transits", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
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

  const handleNavClick = () => {
    if (mobile && onClose) onClose();
  };

  const navContent = (
    <>
      <div className="p-6">
        <Link href="/dashboard" onClick={handleNavClick}>
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
              onClick={handleNavClick}
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
                  onClick={handleNavClick}
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
          onClick={() => {
            handleLogout();
            handleNavClick();
          }}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  // Mobile drawer
  if (mobile) {
    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40"
        />
        {/* Drawer */}
        <motion.div
          initial={{ x: -288 }}
          animate={{ x: 0 }}
          exit={{ x: -288 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-y-0 left-0 w-72 glass border-r border-border flex flex-col z-50"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {navContent}
        </motion.div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="w-64 glass border-r border-border flex-col hidden md:flex">
      {navContent}
    </div>
  );
}
