import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, MoreVertical, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../ui/ConfirmationModal';

interface Certificate {
  id: string;
  student_name: string;
  course_name: string;
  school_name?: string;
  certificate_number: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
  verification_code?: string;
  enrollment_id?: string;
}

interface CertificateStats {
  total_certificates: number;
  active_certificates: number;
  revoked_certificates: number;
  certificates_last_30_days: number;
  certificates_last_7_days: number;
}

const CertificateManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    certificateId: string | null;
    action: 'revoke' | 'activate' | null;
    notes: string;
    submitting: boolean;
  }>({ isOpen: false, certificateId: null, action: null, notes: '', submitting: false });

  const commonRevokeReasons = [
    'Academic integrity violation',
    'Identity mismatch',
    'Fraudulent activity detected',
    'Administrative error',
    'Course completion invalidated',
  ];

  const commonActivateNotes = [
    'Manual approval by admin',
    'Verified by instructor',
    'Documentation verified',
  ];
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; certificateId: string | null }>({
    isOpen: false,
    certificateId: null
  });

  useEffect(() => {
    fetchCertificates();
    fetchStats();
  }, []);

  // Refetch certificates when search or filter changes
  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      fetchCertificates();
    }
  }, [searchTerm, statusFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '100');

      const response = await api.get(`/api/certificates?${params.toString()}`);
      
      // Handle different response structures
      if (response && response.success) {
        setCertificates(response.data || []);
      } else if (response && response.data) {
        setCertificates(response.data || []);
      } else {
        setCertificates([]);
        setError('Failed to load certificates');
      }
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/api/certificates/stats');
      
      // Handle different response structures
      if (response && response.success) {
        setStats(response.data || null);
      } else if (response && response.data) {
        setStats(response.data || null);
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCertificates();
  };

  const submitStatusChange = async () => {
    if (!statusModal.certificateId || !statusModal.action) return;
    try {
      setStatusModal((s) => ({ ...s, submitting: true }));
      await api.put(`/api/certificates/${statusModal.certificateId}/status`, {
        status: statusModal.action === 'revoke' ? 'revoked' : 'active',
        notes: statusModal.notes?.trim() || (statusModal.action === 'revoke' ? 'Certificate revoked' : 'Certificate activated')
      });
      success(`Certificate ${statusModal.action === 'revoke' ? 'revoked' : 'activated'} successfully`);
      setStatusModal({ isOpen: false, certificateId: null, action: null, notes: '', submitting: false });
      fetchCertificates();
      fetchStats();
    } catch (err: any) {
      console.error('Error updating certificate status:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update certificate status';
      setError(errorMessage);
      showError(errorMessage);
      setStatusModal((s) => ({ ...s, submitting: false }));
    }
  };

  const handleViewCertificate = async (certificate: Certificate) => {
    try {
      // Fetch full certificate details to get enrollment_id
      const response = await api.get(`/api/certificates/${certificate.id}`);
      
      if (response.success && response.data) {
        const certData = response.data;
        
        // Navigate to certificate view page using enrollment_id (works for all roles)
        if (certData.enrollment_id) {
          // Use the student route - CertificateViewPage works for all roles
          navigate(`/student/certificates/${certData.enrollment_id}`);
        } else {
          showError('Certificate enrollment information not available');
        }
      } else {
        showError('Failed to load certificate details');
      }
    } catch (err: any) {
      console.error('Error viewing certificate:', err);
      showError(err.response?.data?.error || err.message || 'Failed to load certificate');
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      // Fetch full certificate details to get the correct verification code
      const response = await api.get(`/api/certificates/${certificate.id}`);
      
      if (response.success && response.data) {
        const certData = response.data;
        
        // Use the verification code from the full certificate data
        if (certData.verification_code) {
          // Open certificate verification page in new tab for download/printing
          // The verification page can be printed or saved as PDF
          // URL encode the verification code to handle special characters
          const encodedCode = encodeURIComponent(certData.verification_code);
          window.open(`/verify/${encodedCode}`, '_blank');
        } else if (certData.enrollment_id) {
          // Fallback: navigate to certificate view page which has download functionality
          navigate(`/student/certificates/${certData.enrollment_id}`);
        } else {
          showError('Certificate verification information not available');
        }
      } else {
        showError('Failed to load certificate details');
      }
    } catch (err: any) {
      console.error('Error downloading certificate:', err);
      showError(err.response?.data?.error || err.message || 'Failed to download certificate');
    }
  };

  const handleDeleteCertificate = (certificateId: string) => {
    setDeleteModal({ isOpen: true, certificateId });
  };

  const confirmDeleteCertificate = async () => {
    if (!deleteModal.certificateId) return;

    try {
      await api.delete(`/api/certificates/${deleteModal.certificateId}`);
      
      success('Certificate deleted successfully');
      
      // Refresh certificates and stats
      fetchCertificates();
      fetchStats();
      setDeleteModal({ isOpen: false, certificateId: null });
    } catch (err: any) {
      console.error('Error deleting certificate:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete certificate';
      setError(errorMessage);
      showError(errorMessage);
      setDeleteModal({ isOpen: false, certificateId: null });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCertificates.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const certificateId of selectedCertificates) {
        try {
          if (action === 'revoke') {
            await api.put(`/api/certificates/${certificateId}/status`, {
              status: 'revoked',
              notes: 'Bulk action: Certificate revoked'
            });
            successCount++;
          }
        } catch (err: any) {
          console.error(`Error processing certificate ${certificateId}:`, err);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        success(`Successfully ${action === 'revoke' ? 'revoked' : 'updated'} ${successCount} certificate(s)`);
      }
      
      if (errorCount > 0) {
        showError(`Failed to ${action === 'revoke' ? 'revoke' : 'update'} ${errorCount} certificate(s)`);
      }
      
      setSelectedCertificates([]);
      fetchCertificates();
      fetchStats();
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to perform bulk action';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'revoked':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'expired':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status (Revoke/Activate) Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {statusModal.action === 'revoke' ? 'Revoke Certificate' : 'Activate Certificate'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {statusModal.action === 'revoke'
                  ? 'Please provide a reason for revoking this certificate.'
                  : 'Optionally provide approval notes for activation.'}
              </p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {statusModal.action === 'revoke' ? 'Revocation Reason' : 'Activation Notes'}
              </label>
              {statusModal.action === 'revoke' ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {commonRevokeReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setStatusModal((s) => ({ ...s, notes: reason }))}
                      className="px-2.5 py-1 text-xs rounded-full border border-red-200 text-red-700 hover:bg-red-50"
                      title={reason}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-3 flex flex-wrap gap-2">
                  {commonActivateNotes.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setStatusModal((s) => ({ ...s, notes: note }))}
                      className="px-2.5 py-1 text-xs rounded-full border border-green-200 text-green-700 hover:bg-green-50"
                      title={note}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={statusModal.notes}
                onChange={(e) => setStatusModal((s) => ({ ...s, notes: e.target.value }))}
                placeholder={statusModal.action === 'revoke' ? 'e.g., Academic integrity concerns' : 'e.g., Manual approval by admin'}
                className="w-full min-h-[100px] border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setStatusModal({ isOpen: false, certificateId: null, action: null, notes: '', submitting: false })}
                disabled={statusModal.submitting}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusChange}
                disabled={statusModal.submitting || (statusModal.action === 'revoke' && !statusModal.notes.trim())}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {statusModal.submitting ? 'Saving...' : (statusModal.action === 'revoke' ? 'Revoke' : 'Activate')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, certificateId: null })}
        onConfirm={confirmDeleteCertificate}
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600">Manage and track all certificates</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-8"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-semibold">{stats.total_certificates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-semibold">{stats.active_certificates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Revoked</p>
                <p className="text-2xl font-semibold">{stats.revoked_certificates}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Last 30 Days</p>
                <p className="text-2xl font-semibold">{stats.certificates_last_30_days}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-accent-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Last 7 Days</p>
                <p className="text-2xl font-semibold">{stats.certificates_last_7_days}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Stats Unavailable</h3>
              <p className="text-sm text-yellow-700 mt-1">Unable to load certificate statistics</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              title="Filter by certificate status"
              aria-label="Filter by certificate status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="expired">Expired</option>
            </select>
            
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCertificates.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedCertificates.length} certificate(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('revoke')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Revoke Selected
                </button>
                <button
                  onClick={() => setSelectedCertificates([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCertificates.length === certificates.length && certificates.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCertificates(certificates.map(c => c.id));
                      } else {
                        setSelectedCertificates([]);
                      }
                    }}
                    className="rounded border-gray-300"
                    title="Select all certificates"
                    aria-label="Select all certificates"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading certificates...</p>
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No certificates found</p>
                  </td>
                </tr>
              ) : (
                certificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.includes(certificate.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCertificates([...selectedCertificates, certificate.id]);
                          } else {
                            setSelectedCertificates(selectedCertificates.filter(id => id !== certificate.id));
                          }
                        }}
                        className="rounded border-gray-300"
                        title={`Select certificate for ${certificate.student_name}`}
                        aria-label={`Select certificate for ${certificate.student_name}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.student_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {certificate.course_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {certificate.certificate_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(certificate.status)}>
                        {certificate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(certificate.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewCertificate(certificate)}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="View Certificate"
                          aria-label="View Certificate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadCertificate(certificate)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Download Certificate"
                          aria-label="Download Certificate"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {certificate.status === 'active' ? (
                          <button
                            onClick={() => setStatusModal({ isOpen: true, certificateId: certificate.id, action: 'revoke', notes: '', submitting: false })}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Revoke Certificate"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusModal({ isOpen: true, certificateId: certificate.id, action: 'activate', notes: '', submitting: false })}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Activate Certificate"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCertificate(certificate.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Certificate"
                          aria-label="Delete Certificate"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CertificateManagementPage;
