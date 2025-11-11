import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && profile) {
      // Wait for token to be available with retry mechanism
      const connectSocket = async () => {
        let token = localStorage.getItem('token');
        let retryCount = 0;
        const maxRetries = 10;
        
        // Wait for token to be available (with retries)
        while (!token && retryCount < maxRetries) {
          console.log(`Waiting for token... attempt ${retryCount + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 200));
          token = localStorage.getItem('token');
          retryCount++;
        }
        
        if (!token) {
          console.error('No authentication token found after retries, attempting cookie-based Socket.IO connection');
        } else {
          console.log('Token found for socket connection:', token.substring(0, 20) + '...');
        }

        // Remove /api from the URL for Socket.IO connection
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
        setConnectionStatus('connecting');
        
        const socketOptions: any = {
          withCredentials: true,
          transports: ['polling', 'websocket'],
          timeout: 10000,
          forceNew: true
        };
        
        // Always send token if available
        if (token) {
          socketOptions.auth = { 
            token, 
            userId: user.id,
            role: user.role 
          };
        }
        
        console.log('Connecting to socket with options:', {
          baseUrl,
          hasToken: !!token,
          withCredentials: socketOptions.withCredentials,
          transports: socketOptions.transports
        });
        
        const newSocket = io(baseUrl, socketOptions);

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
        setError(null);
          setConnectionStatus('connected');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from notification server:', reason);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if disconnected due to server issues
        if (reason === 'io server disconnect') {
          console.log('Server disconnected, attempting to reconnect...');
          setTimeout(() => {
            if (user && profile) {
              connectSocket();
            }
          }, 2000);
        }
      });

      newSocket.on('connect_error', async (err) => {
        console.error('Socket connection error:', err);
        setConnectionStatus('disconnected');
        
        // Handle different types of errors
        if (err.message.includes('Authentication error')) {
          console.error('Socket authentication failed:', err.message);
          
          // If token is invalid/expired, try to refresh it
          if (err.message.includes('Invalid token') || err.message.includes('expired')) {
            console.log('Token appears to be invalid/expired, attempting to refresh...');
            // Try to get a fresh token by making an API call
            try {
              const response = await fetch('/api/auth/me', {
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.token) {
                  localStorage.setItem('token', data.token);
                  console.log('Token refreshed, retrying socket connection...');
                  // Retry connection after a short delay
                  setTimeout(() => {
                    if (user && profile) {
                      connectSocket();
                    }
                  }, 1000);
                  return;
                }
              }
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
            }
          }
          
          // Don't show error to user for auth failures, but log for debugging
          setError(null);
        } else if (err.message.includes('timeout')) {
          console.error('Socket connection timeout');
          setError('Connection timeout - please check your network');
        } else {
          console.error('Socket connection failed:', err.message);
          setError('Failed to connect to notification server');
        }
      });

      // Listen for new notifications
      newSocket.on('notification', (notification: Notification) => {
        // Debug: Check for invalid dates in socket notifications
        const date = new Date(notification.createdAt);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in socket notification:', notification.createdAt, notification);
        }
        const normalizedNotification: Notification = {
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
        };
        setNotifications(prev => [normalizedNotification, ...prev]);

        if (
          normalizedNotification.data &&
          typeof normalizedNotification.data === 'object' &&
          (normalizedNotification.data as Record<string, unknown>).eventType === 'review_submitted'
        ) {
          toast.info(normalizedNotification.title || 'New review submitted');
        }
        
        // Show browser notification if enabled and permission granted
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

      // Listen for notification updates
      newSocket.on('notification_updated', (updatedNotification: Notification) => {
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        );
      });

      // Listen for notification deletion
      newSocket.on('notification_deleted', (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      });

      setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      };

      // Connect immediately (token waiting is handled inside connectSocket)
      connectSocket();
      
      return () => {
        // Cleanup handled by socket disconnect
      };
    } else {
      // Clean up socket if user logs out
      if (socket) {
        console.log('User logged out, disconnecting socket');
        socket.disconnect();
        setSocket(null);
      }
      setConnectionStatus('disconnected');
    }
  }, [user, profile, userSettings?.notifications?.pushNotifications]);

  // Request notification permission
  useEffect(() => {
    if (userSettings?.notifications?.pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [userSettings?.notifications?.pushNotifications]);

  // Load notifications from API
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await get<{ success: boolean; data: Notification[] }>('/notifications');
      
      if (data.success) {
        const notifications = (data.data || []).map((notification: Notification) => ({
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
        // Debug: Check for invalid dates in loaded notifications
        notifications.forEach((notification, index) => {
          const date = new Date(notification.createdAt);
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date in notification ${index}:`, notification.createdAt, notification);
          }
        });
        setNotifications(notifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

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
    console.log('🧪 Testing socket connection...');
    console.log('Current user:', user);
    console.log('Current profile:', profile);
    console.log('Token in localStorage:', !!localStorage.getItem('token'));
    console.log('Current connection status:', connectionStatus);
    
    if (user && profile) {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🧪 Testing token validation...');
        try {
          const response = await fetch('/api/test-token', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log('🧪 Token validation result:', data);
        } catch (error) {
          console.error('🧪 Token validation failed:', error);
        }
      }
      
      console.log('Attempting manual socket connection test...');
      // Trigger a reconnection
      if (socket) {
        socket.disconnect();
      }
      // The useEffect will handle reconnection
    } else {
      console.log('Cannot test socket connection - user not authenticated');
    }
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
