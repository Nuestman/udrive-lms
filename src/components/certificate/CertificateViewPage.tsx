import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import CertificateGenerator from './CertificateGenerator';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface CertificateData {
  id: string;
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  schoolName: string;
  instructorName: string;
  status: 'active' | 'revoked' | 'expired';
  issuedAt: string;
  verificationCode: string;
}

const CertificateViewPage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // kept for future role-based controls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    fetchCertificateData();
  }, [enrollmentId]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      
      // First, check if the enrollment is completed
      const enrollmentResponse: any = await api.get(`/enrollments/${enrollmentId}`);
      const enrollmentData = enrollmentResponse?.data || enrollmentResponse?.data?.data || enrollmentResponse;
      
      setEnrollment(enrollmentData);

      // Check if certificate exists
      const certResponse: any = await api.get(`/certificates/enrollment/${enrollmentId}`);
      const certificates = certResponse?.data || certResponse?.data?.data || [];
      
      if (certificates.length === 0) {
        // Certificate doesn't exist yet, but course is completed
        setError(null);
      } else {
        // Certificate exists, format the data
        const cert = certificates[0];
        setCertificate({
          id: cert.id,
          studentName: cert.student_name,
          courseName: cert.course_name,
          completionDate: new Date(cert.issued_at).toLocaleDateString(),
          certificateId: cert.certificate_number,
          schoolName: cert.school_name,
          instructorName: cert.instructor_name,
          status: cert.status,
          issuedAt: cert.issued_at,
          verificationCode: cert.verification_code
        });
        setEnrollment(enrollmentData);
      }
    } catch (err: any) {
      console.error('Error fetching certificate data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load certificate data');
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    try {
      setLoading(true);
      const response = await api.post('/certificates/generate', {
        enrollment_id: enrollmentId
      });
      
      const newCert = response.data.data;
      setCertificate({
        id: newCert.id,
        studentName: newCert.student_name,
        courseName: newCert.course_name,
        completionDate: new Date(newCert.issued_at).toLocaleDateString(),
        certificateId: newCert.certificate_number,
        schoolName: newCert.school_name,
        instructorName: newCert.instructor_name,
        status: newCert.status,
        issuedAt: newCert.issued_at,
        verificationCode: newCert.verification_code
      });
      setError(null);
    } catch (err: any) {
      console.error('Error generating certificate:', err);
      setError(err.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'revoked':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'revoked':
        return 'Revoked';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Certificate</h1>
          <p className="text-gray-600 mt-2">
            {enrollment?.course_title} - {enrollment?.status === 'completed' ? 'Completed' : 'In Progress'}
          </p>
        </div>

        {/* Error/Info State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Certificate Not Available</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate action when eligible but no certificate */}
        {(!certificate && (enrollment?.status === 'completed' || (enrollment?.progress_percentage ?? 0) >= 100)) && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">You're eligible for a certificate</h3>
                <p className="text-yellow-700 mt-1">Generate your certificate now.</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={generateCertificate}
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Certificate'}
              </button>
            </div>
          </div>
        )}

        {/* Certificate Display */}
        {certificate && (
          <div className="space-y-6">
            {/* Certificate Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(certificate.status)}
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Certificate Status</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium">{getStatusText(certificate.status)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="font-mono text-sm">{certificate.certificateId}</p>
                </div>
              </div>
            </div>

            {/* Certificate Generator */}
            <CertificateGenerator
              data={{
                studentName: certificate.studentName,
                courseName: certificate.courseName,
                completionDate: certificate.completionDate,
                certificateId: certificate.certificateId,
                schoolName: certificate.schoolName,
                instructorName: certificate.instructorName
              }}
              onGenerate={(pdfUrl) => {
                console.log('Certificate generated:', pdfUrl);
              }}
            />

            {/* Certificate Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-medium">{certificate.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Course Name</p>
                  <p className="font-medium">{certificate.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School</p>
                  <p className="font-medium">{certificate.schoolName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-medium">{certificate.instructorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issued Date</p>
                  <p className="font-medium">{certificate.completionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Code</p>
                  <p className="font-mono text-sm">{certificate.verificationCode}</p>
                </div>
              </div>
            </div>

            {/* Verification Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Verify Certificate</h3>
              <p className="text-blue-800 mb-3">
                Share this verification link to allow others to verify the authenticity of this certificate:
              </p>
              <div className="bg-white rounded border p-3">
                <code className="text-sm break-all">
                  {window.location.origin}/verify/{certificate.verificationCode}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateViewPage;
