'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Alert } from '@/types/astro';

interface AlertBellProps {
  alerts: Alert[];
  onMarkAsRead?: (alertId: string) => void;
  onMarkAllAsRead?: () => void;
  onAlertClick?: (alert: Alert) => void;
  className?: string;
}

export const AlertBell: React.FC<AlertBellProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onAlertClick,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const severityColors = {
    info: '#0a84ff',
    warning: '#ff9500',
    important: '#ff3b30',
  };

  const severityBgColors = {
    info: '#0a84ff20',
    warning: '#ff950020',
    important: '#ff3b3020',
  };

  const handleAlertClick = (alert: Alert) => {
    if (!alert.isRead) {
      onMarkAsRead?.(alert.id);
    }
    onAlertClick?.(alert);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#0f1729] rounded-lg transition-colors"
      >
        <Bell size={24} className="text-[#e2e8f0]" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3b30] text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 bg-[#0f1729] border border-[#1e2d4a] rounded-lg shadow-2xl z-50 max-h-[500px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#1e2d4a] flex items-center justify-between">
                <h3 className="text-[#e2e8f0] font-semibold">
                  Notifications ({unreadCount} unread)
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-[#7c3aed] text-sm hover:text-[#c9a227] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Alerts list */}
              <div className="flex-1 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0a0a1a] flex items-center justify-center">
                      <Bell size={32} className="text-[#64748b]" />
                    </div>
                    <p className="text-[#64748b]">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1e2d4a]">
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onClick={() => handleAlertClick(alert)}
                        severityColor={severityColors[alert.severity]}
                        severityBgColor={severityBgColors[alert.severity]}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-[#1e2d4a] text-center">
                <button className="text-[#7c3aed] text-sm hover:text-[#c9a227] transition-colors flex items-center justify-center gap-1 mx-auto">
                  View all notifications
                  <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AlertCardProps {
  alert: Alert;
  onClick: () => void;
  severityColor: string;
  severityBgColor: string;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onClick,
  severityColor,
  severityBgColor,
}) => {
  const typeLabels = {
    transit: 'Transit',
    dasha_change: 'Dasha Change',
    eclipse: 'Eclipse',
    station: 'Station',
  };

  const timeAgo = getTimeAgo(alert.createdAt);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: '#0a0a1a' }}
      className={`w-full p-4 text-left transition-colors ${
        !alert.isRead ? 'bg-[#7c3aed10]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Severity indicator */}
        <div
          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
          style={{ backgroundColor: severityColor }}
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: severityBgColor,
                color: severityColor,
              }}
            >
              {typeLabels[alert.type]}
            </span>
            <span className="text-[#64748b] text-xs">{timeAgo}</span>
            {!alert.isRead && (
              <span className="w-2 h-2 bg-[#7c3aed] rounded-full ml-auto" />
            )}
          </div>

          {/* Title */}
          <h4 className="text-[#e2e8f0] font-semibold mb-1 text-sm">
            {alert.title}
          </h4>

          {/* Description */}
          <p className="text-[#64748b] text-xs line-clamp-2">
            {alert.description}
          </p>

          {/* Date */}
          <p className="text-[#64748b] text-xs mt-1">
            {new Date(alert.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
