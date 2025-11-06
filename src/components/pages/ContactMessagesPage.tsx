// Contact Messages Admin Page - Email-style interface
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter,
  CheckCircle,
  Circle,
  Archive,
  Reply,
  Clock,
  User,
  MailOpen,
  ArrowLeft,
  Send,
  Trash2,
  RefreshCw
} from 'lucide-react';
import PageLayout from '../ui/PageLayout';
import { useToast } from '../../contexts/ToastContext';
import { format } from 'date-fns';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  is_read: boolean;
  created_at: string;
  replied_at?: string;
  replied_by?: string;
  replied_by_name?: string;
  replied_by_email?: string;
  reply_count?: number;
  replies?: ContactMessageReply[];
}

interface ContactMessageReply {
  id: string;
  contact_message_id: string;
  replied_by: string;
  reply_message: string;
  created_at: string;
  replied_by_name?: string;
  replied_by_email?: string;
}

interface ContactStats {
  total: number;
  new_count: number;
  read_count: number;
  replied_count: number;
  archived_count: number;
  unread_count: number;
}

const ContactMessagesPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isReadFilter, setIsReadFilter] = useState<string>('all');
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Get API URL - VITE_API_URL already includes /api
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [statusFilter, isReadFilter, searchTerm]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (isReadFilter !== 'all') params.append('is_read', isReadFilter === 'unread' ? 'false' : 'true');
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/contact/messages?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.data || []);
    } catch (err) {
      showError('Failed to load contact messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/contact/messages/stats`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessageDetails = async (messageId: string) => {
    try {
      const response = await fetch(`${API_URL}/contact/messages/${messageId}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch message details');

      const data = await response.json();
      const message = data.data;
      
      // Mark as read if not already read
      if (!message.is_read) {
        await markAsRead(messageId);
      }

      setSelectedMessage(message);
    } catch (err) {
      showError('Failed to load message details');
      console.error(err);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`${API_URL}/contact/messages/${messageId}/read`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true, status: msg.status === 'new' ? 'read' : msg.status } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, is_read: true, status: prev.status === 'new' ? 'read' : prev.status } : null);
      }

      fetchStats();
    } catch (err) {
      showError('Failed to mark message as read');
      console.error(err);
    }
  };

  const updateStatus = async (messageId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/contact/messages/${messageId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status } : null);
      }

      success('Status updated successfully');
      fetchStats();
    } catch (err) {
      showError('Failed to update status');
      console.error(err);
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const response = await fetch(`${API_URL}/contact/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply_message: replyText }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      const data = await response.json();
      
      // Refresh message details
      await fetchMessageDetails(selectedMessage.id);
      
      setReplyText('');
      setReplying(false);
      success('Reply sent successfully');
      fetchStats();
    } catch (err) {
      showError('Failed to send reply');
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleMessageClick = (message: ContactMessage) => {
    fetchMessageDetails(message.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-gray-100 text-gray-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout
      title="Contact Messages"
      breadcrumbs={[{ label: 'Contact Messages' }]}
    >
      <div className="h-[calc(100vh-200px)] flex flex-col">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">{stats.new_count}</div>
              <div className="text-sm text-blue-600">New</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.unread_count}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.read_count}</div>
              <div className="text-sm text-gray-600">Read</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-900">{stats.replied_count}</div>
              <div className="text-sm text-green-600">Replied</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.archived_count}</div>
              <div className="text-sm text-gray-600">Archived</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={isReadFilter}
            onChange={(e) => setIsReadFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Main Content - Email Style Layout */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Message List */}
          <div className={`${selectedMessage ? 'hidden md:block' : 'block'} w-full md:w-1/3 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden`}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No messages found</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMessage?.id === message.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                    } ${!message.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!message.is_read ? (
                          <Circle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-gray-900 truncate">{message.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {format(new Date(message.created_at), 'MMM d')}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1 truncate">{message.subject}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{message.message}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(message.status)}`}>
                        {message.status}
                      </span>
                      {message.reply_count > 0 && (
                        <span className="text-xs text-gray-500">({message.reply_count} replies)</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail View */}
          {selectedMessage && (
            <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedMessage.subject}</h2>
                    <div className="text-sm text-gray-600 mt-1">
                      From: {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMessage.status}
                    onChange={(e) => updateStatus(selectedMessage.id, e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{selectedMessage.name}</div>
                        <div className="text-sm text-gray-600">{selectedMessage.email}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(selectedMessage.created_at), 'PPpp')}
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Replies */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {selectedMessage.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                              <Mail className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {reply.replied_by_name || 'Admin'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {reply.replied_by_email}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(reply.created_at), 'PPpp')}
                          </div>
                        </div>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap">{reply.reply_message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replying ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={sendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {sendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        onClick={() => {
                          setReplying(false);
                          setReplyText('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplying(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedMessage && (
            <div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-lg border border-gray-200">
              <div className="text-center text-gray-500">
                <MailOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Select a message to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactMessagesPage;


