import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';
import { get, put, del } from '../lib/api';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  icon?: string;
  data?: Record<string, unknown>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  testSocketConnection: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const { userSettings } = useSettings();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<Date | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Polling interval in milliseconds (30 seconds)
  const POLLING_INTERVAL = 30000;

  // Load notifications from API
  const loadNotifications = async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      setConnectionStatus('connected');
      
      const data = await get<{ success: boolean; data: Notification[] }>('/notifications');
      
      if (data.success) {
        const loadedNotifications = (data.data || []).map((notification: Notification) => ({
          ...notification,
          data: notification.data && typeof notification.data === 'string'
            ? (() => {
                try {
                  return JSON.parse(notification.data as unknown as string);
                } catch (parseError) {
                  console.warn('Failed to parse notification data payload:', parseError);
                  return {};
                }
              })()
            : notification.data || {},
        }));

        // Check for new notifications (not in current list)
        const currentIds = new Set(notifications.map(n => n.id));
        const newNotifications = loadedNotifications.filter(n => !currentIds.has(n.id));
        
        // Show toast for new notifications
        newNotifications.forEach(notification => {
          if (
            notification.data &&
            typeof notification.data === 'object' &&
            (notification.data as Record<string, unknown>).eventType === 'review_submitted'
          ) {
            toast.info(notification.title || 'New review submitted');
          } else {
            toast.info(notification.title || 'New notification');
          }
          
          // Show browser notification if enabled
          if (userSettings?.notifications?.pushNotifications && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/sun-lms-logo-compact.png',
                tag: notification.id
              });
            }
          }
        });

        setNotifications(loadedNotifications);
        lastCheckRef.current = new Date();
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
      setConnectionStatus('disconnected');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Start polling for notifications
  useEffect(() => {
    if (user && profile) {
      setConnectionStatus('connecting');
      
      // Load immediately
      loadNotifications(true);
      
      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        loadNotifications(false); // Don't show loading spinner on polling
      }, POLLING_INTERVAL);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setConnectionStatus('disconnected');
      };
    } else {
      // Clean up when user logs out
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setNotifications([]);
      setConnectionStatus('disconnected');
    }
  }, [user, profile]);

  // Request notification permission
  useEffect(() => {
    if (userSettings?.notifications?.pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [userSettings?.notifications?.pushNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await put('/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await del(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await del('/notifications/clear-all');
      
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const testSocketConnection = async () => {
    // No-op for polling-based notifications
    console.log('Polling-based notifications - connection test not applicable');
    await loadNotifications(true);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    testSocketConnection,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
