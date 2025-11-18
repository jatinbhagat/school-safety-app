'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'incident' | 'assignment' | 'update' | 'resolved';
  timestamp: Date;
  read: boolean;
}

interface NotificationSimulatorProps {
  autoShow?: boolean;
  notification?: Omit<Notification, 'id' | 'timestamp' | 'read'>;
  onClose?: () => void;
  duration?: number; // Auto-hide duration in ms (0 = manual close only)
}

export function NotificationSimulator({
  autoShow = false,
  notification,
  onClose,
  duration = 5000,
}: NotificationSimulatorProps) {
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoShow && notification) {
      setVisible(true);

      // Auto-hide after duration if specified
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [autoShow, notification, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      setIsClosing(false);
      onClose?.();
    }, 300);
  };

  if (!visible || !notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'incident':
        return '🚨';
      case 'assignment':
        return '📋';
      case 'update':
        return '🔔';
      case 'resolved':
        return '✅';
      default:
        return '📬';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'incident':
        return 'border-red-500 bg-red-50';
      case 'assignment':
        return 'border-purple-500 bg-purple-50';
      case 'update':
        return 'border-blue-500 bg-blue-50';
      case 'resolved':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div
        className={`
          max-w-sm w-full shadow-lg rounded-lg border-l-4 ${getColor()}
          backdrop-blur-sm bg-opacity-95
        `}
      >
        {/* Notification Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getIcon()}</span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {notification.title}
                </h3>
                <p className="text-xs text-gray-500">
                  School Safety App • Just now
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-3">{notification.message}</p>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-md transition-colors"
            >
              View
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {duration > 0 && (
          <div className="h-1 bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{
                animation: `shrink ${duration}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Notification Bell with Badge - For displaying in header/navbar
 */
interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

export function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
    >
      <span className={`text-2xl ${isPulsing ? 'animate-bounce' : ''}`}>🔔</span>
      {count > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Notification List - For displaying in a dropdown/panel
 */
interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
}

export function NotificationList({
  notifications,
  onNotificationClick,
  onMarkAllRead,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-4xl mb-2">🔕</p>
        <p>No notifications</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return '🚨';
      case 'assignment':
        return '📋';
      case 'update':
        return '🔔';
      case 'resolved':
        return '✅';
      default:
        return '📬';
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => onNotificationClick?.(notification)}
            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
              !notification.read ? 'bg-purple-50' : ''
            }`}
          >
            <div className="flex gap-3">
              <span className="text-xl">{getIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <p
                    className={`text-sm font-medium text-gray-900 ${
                      !notification.read ? 'font-semibold' : ''
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
