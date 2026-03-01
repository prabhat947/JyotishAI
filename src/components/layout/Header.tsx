"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AlertBell } from "@/components/notifications/AlertBell";
import type { Alert } from "@/types/astro";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Build breadcrumb from pathname
  const buildBreadcrumb = () => {
    if (!pathname) return '';
    const segments = pathname.split('/').filter(Boolean);
    return segments
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' / ');
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/alerts");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(
          data.map((a: any) => ({
            id: a.id,
            profileId: a.profile_id,
            type: a.alert_type as Alert["type"],
            title: a.title,
            description: a.content,
            date: new Date(a.trigger_date),
            isRead: a.is_read ?? false,
            severity: a.alert_type === "eclipse" || a.alert_type === "nodal_transit"
              ? "important"
              : a.alert_type === "station"
              ? "warning"
              : "info",
            createdAt: new Date(a.created_at),
          }))
        );
      }
    } catch {
      // Silently fail — alerts are not critical
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Poll every 60 seconds for new alerts
    const interval = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
    // Persist to API
    try {
      await fetch("/api/v1/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, is_read: true }),
      });
    } catch {
      // Revert on failure
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = alerts.filter((a) => !a.isRead).map((a) => a.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    // Persist each to API
    for (const id of unreadIds) {
      try {
        await fetch("/api/v1/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId: id, is_read: true }),
        });
      } catch {
        // Continue with rest
      }
    }
  };

  return (
    <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-6 glass">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
          {buildBreadcrumb()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <AlertBell
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>
    </header>
  );
}
