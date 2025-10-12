import React from 'react';
import PageLayout from '../ui/PageLayout';
import { Award, Download, Eye, Search, Filter, Calendar } from 'lucide-react';

interface CertificatesPageProps {
  role: 'school_admin' | 'instructor' | 'student';
}

const CertificatesPage: React.FC<CertificatesPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Certificates' }
  ];

  const sampleCertificates = [
    {
      id: '1',
      studentName: 'Sarah Johnson',
      courseName: 'Basic Driving Course',
      issueDate: '2024-03-15',
      certificateId: 'CERT-2024-0001',
      status: 'issued',
      downloadUrl: '#'
    },
    {
      id: '2',
      studentName: 'Michael Chen',
      courseName: 'Advanced Defensive Driving',
      issueDate: '2024-03-10',
      certificateId: 'CERT-2024-0002',
      status: 'issued',
      downloadUrl: '#'
    },
    {
      id: '3',
      studentName: 'Emily Rodriguez',
      courseName: 'Commercial Driver License Prep',
      issueDate: '2024-02-28',
      certificateId: 'CERT-2024-0003',
      status: 'revoked',
      downloadUrl: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Filter className="text-gray-400 mr-2" size={20} />
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option>All Status</option>
                  <option>Issued</option>
                  <option>Pending</option>
                  <option>Revoked</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCertificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                  {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{certificate.courseName}</h3>
              {role !== 'student' && (
                <p className="text-gray-600 mb-2">Student: {certificate.studentName}</p>
              )}
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                </div>
                <div>Certificate ID: {certificate.certificateId}</div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Eye size={16} className="mr-2" />
                  View
                </button>
                {certificate.status === 'issued' && (
                  <button className="flex-1 flex items-center justify-center px-3 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors">
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Certificate Statistics */}
        {role !== 'student' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sampleCertificates.filter(c => c.status === 'issued').length}
                </div>
                <div className="text-sm text-gray-500">Issued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {sampleCertificates.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sampleCertificates.filter(c => c.status === 'revoked').length}
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