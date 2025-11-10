import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Trash2, Check, CheckCheck, Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter notifications based on current filter and search term
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);
    
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const getNotificationStyles = (type: string, read: boolean) => {
    if (read) {
      return {
        headerBg: 'bg-gray-100',
        headerText: 'text-gray-700',
        border: 'border-gray-200',
        messageText: 'text-gray-600'
      };
    }

    switch (type) {
      case 'success':
        return {
          headerBg: 'bg-green-50',
          headerText: 'text-green-700',
          border: 'border-green-200',
          messageText: 'text-gray-800'
        };
      case 'warning':
        return {
          headerBg: 'bg-yellow-50',
          headerText: 'text-yellow-700',
          border: 'border-yellow-200',
          messageText: 'text-gray-800'
        };
      case 'error':
        return {
          headerBg: 'bg-red-50',
          headerText: 'text-red-700',
          border: 'border-red-200',
          messageText: 'text-gray-800'
        };
      case 'info':
      default:
        return {
          headerBg: 'bg-primary-50',
          headerText: 'text-primary-700',
          border: 'border-primary-200',
          messageText: 'text-gray-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors sm:w-auto w-full"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Mark All Read</span>
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors sm:w-auto w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Filter notifications"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No notifications found' : 'No notifications yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : 'You\'ll see notifications here when they arrive.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const styles = getNotificationStyles(notification.type, notification.read);
              const timestamp = (() => {
                try {
                  const date = new Date(notification.createdAt);
                  if (isNaN(date.getTime())) {
                    return 'Invalid date';
                  }
                  return formatDistanceToNow(date, { addSuffix: true });
                } catch (error) {
                  return 'Invalid date';
                }
              })();

              return (
                <div
                  key={notification.id}
                  className={`bg-white border ${styles.border} rounded-lg shadow-sm transition-all hover:shadow-md overflow-hidden`}
                >
                  <div className={`flex gap-3 sm:flex-row sm:items-center justify-between px-4 py-3 sm:px-6 bg-green-50 ${styles.headerBg}`}>
                    <div>
                      <h3 className={`text-lg font-semibold ${styles.headerText}`}>
                        {notification.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className={`p-2 text-gray-500 hover:text-green-600 transition-colors rounded-md bg-white/90 hover:bg-white/70 border ${styles.border} hover:border-green-400`}
                          title="Mark as read"
                          aria-label="Mark notification as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className={`p-2 text-gray-500 hover:text-red-600 transition-colors rounded-md bg-white/90 hover:bg-white/70 border ${styles.border} hover:border-red-600`}
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-4 sm:px-6 space-y-3">
                    <p className={`text-sm sm:text-base ${styles.messageText}`}>
                      {notification.message}
                    </p>

                    {notification.link && (
                      <a
                        href={notification.link}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center"
                      >
                        View Details →
                      </a>
                    )}

                    <p className="text-sm text-gray-400">
                      {timestamp}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
