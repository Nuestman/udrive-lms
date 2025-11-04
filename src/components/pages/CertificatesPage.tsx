import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../ui/PageLayout';
import { Award, Download, Eye, Search, Filter, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface CertificatesPageProps {
  role: 'school_admin' | 'instructor' | 'student';
}

interface Certificate {
  id: string;
  student_name: string;
  course_name: string;
  school_name: string;
  certificate_number: string;
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
  verification_code: string;
  enrollment_id: string;
}

const CertificatesPage: React.FC<CertificatesPageProps> = ({ role }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const breadcrumbs = [
    { label: 'Certificates' }
  ];

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      let response: any;
      if (role === 'student') {
        // Students can only see their own certificates
        response = await api.get(`/certificates/student/${user?.id}`);
      } else {
        // Admins and instructors see all certificates in their tenant
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        params.append('limit', '100');

        response = await api.get(`/certificates?${params.toString()}`);
      }

      if (response && response.success) {
        setCertificates(response.data || []);
      } else {
        setCertificates([]);
        if (role !== 'student') setError(response?.error || 'Failed to load certificates');
      }
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      // For students, suppress the error UI and fallback to empty state
      if (role === 'student') {
        setCertificates([]);
        setError(null);
      } else {
        setError(err.response?.data?.error || 'Failed to load certificates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (role !== 'student') {
      fetchCertificates();
    }
  };

  const handleViewCertificate = (certificate: Certificate) => {
    if (role === 'student') {
      // Navigate to the certificate view page
      navigate(`/student/certificates/${certificate.enrollment_id}`);
    } else {
      // For admins, show certificate details (could open a modal or navigate)
      console.log('View certificate:', certificate);
    }
  };

  const handleDownloadCertificate = (certificate: Certificate) => {
    // This would generate and download the PDF
    console.log('Download certificate:', certificate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'revoked':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <PageLayout
      title="Certificates"
      description={
        role === 'student' 
          ? 'View and download your earned certificates'
          : 'Manage and issue course completion certificates'
      }
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Error State (hidden for students to avoid noisy UX) */}
        {role !== 'student' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error Loading Certificates</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters - Only show for admins/instructors */}
        {role !== 'student' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Filter className="text-gray-400 mr-2" size={20} />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    title="Filter by certificate status"
                    aria-label="Filter by certificate status"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Found</h3>
            <p className="text-gray-600">
              {role === 'student' 
                ? "You haven't earned any certificates yet. Complete courses to earn certificates!"
                : "No certificates have been issued yet."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                    {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{certificate.course_name}</h3>
                {role !== 'student' && (
                  <p className="text-gray-600 mb-2">Student: {certificate.student_name}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Issued: {new Date(certificate.issued_at).toLocaleDateString()}
                  </div>
                  <div>Certificate ID: {certificate.certificate_number}</div>
                  {certificate.school_name && (
                    <div>School: {certificate.school_name}</div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewCertificate(certificate)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Eye size={16} className="mr-2" />
                    View
                  </button>
                  {certificate.status === 'active' && (
                    <button 
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
                    >
                      <Download size={16} className="mr-2" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Statistics */}
        {role !== 'student' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {certificates.length}
                </div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certificates.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {certificates.filter(c => c.status === 'expired').length}
                </div>
                <div className="text-sm text-gray-500">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {certificates.filter(c => c.status === 'revoked').length}
                </div>
                <div className="text-sm text-gray-500">Revoked</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default CertificatesPage;