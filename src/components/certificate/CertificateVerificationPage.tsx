import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import api from '../../lib/api';

interface VerificationResult {
  id: string;
  certificate_number: string;
  student_name: string;
  course_name: string;
  school_name: string;
  issued_at: string;
  status: string;
  is_valid: boolean;
}

const CertificateVerificationPage: React.FC = () => {
  const { verificationCode } = useParams<{ verificationCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (verificationCode) {
      verifyCertificate();
    }
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Decode the verification code in case it's URL encoded
      const decodedCode = decodeURIComponent(verificationCode || '');
      console.log('Verifying certificate with code:', decodedCode);
      
      const response = await api.get(`/api/certificates/verify/${encodeURIComponent(decodedCode)}`);
      
      if (response && response.success && response.data) {
        setCertificate(response.data);
        setError(null);
      } else if (response && response.data) {
        // Handle case where data is directly in response.data
        setCertificate(response.data);
        setError(null);
      } else {
        setError('Certificate not found or invalid');
      }
    } catch (err: any) {
      console.error('Error verifying certificate:', err);
      console.error('Verification code used:', verificationCode);
      setError(err.response?.data?.error || err.message || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isValid: boolean, status: string) => {
    if (!isValid || status === 'revoked') {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }
    if (status === 'expired') {
      return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
    }
    return <CheckCircle className="h-16 w-16 text-green-500" />;
  };

  const getStatusMessage = (isValid: boolean, status: string) => {
    if (!isValid || status === 'revoked') {
      return {
        title: 'Certificate Not Valid',
        message: 'This certificate has been revoked or is invalid.',
        color: 'text-red-800',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
    if (status === 'expired') {
      return {
        title: 'Certificate Expired',
        message: 'This certificate has expired.',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
    return {
      title: 'Certificate Valid',
      message: 'This certificate is authentic and valid.',
      color: 'text-green-800',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Certificate Verification</h1>
          <p className="text-xl text-gray-600">Verify the authenticity of a certificate</p>
        </div>

        {/* Verification Result */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {error ? (
            /* Error State */
            <div className="p-12 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-red-800 mb-2">Verification Failed</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="text-sm text-gray-500">
                <p>Please check the verification code and try again.</p>
                <p>If you continue to have issues, contact the issuing institution.</p>
              </div>
            </div>
          ) : certificate ? (
            /* Certificate Found */
            <div>
              {/* Status Header */}
              <div className={`p-8 text-center border-b ${getStatusMessage(certificate.is_valid, certificate.status).borderColor}`}>
                <div className="flex justify-center mb-4">
                  {getStatusIcon(certificate.is_valid, certificate.status)}
                </div>
                <h2 className={`text-2xl font-semibold ${getStatusMessage(certificate.is_valid, certificate.status).color} mb-2`}>
                  {getStatusMessage(certificate.is_valid, certificate.status).title}
                </h2>
                <p className={`${getStatusMessage(certificate.is_valid, certificate.status).color}`}>
                  {getStatusMessage(certificate.is_valid, certificate.status).message}
                </p>
              </div>

              {/* Certificate Details */}
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Certificate Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
                    <p className="font-mono text-lg font-semibold">{certificate.certificate_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Verification Code</p>
                    <p className="font-mono text-sm">{verificationCode}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Student Name</p>
                    <p className="text-lg font-medium">{certificate.student_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Course</p>
                    <p className="text-lg font-medium">{certificate.course_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Issuing Institution</p>
                    <p className="text-lg font-medium">{certificate.school_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Issued Date</p>
                    <p className="text-lg font-medium">
                      {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>
                      This verification was performed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No Certificate */
            <div className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Certificate Found</h2>
              <p className="text-gray-600">Unable to verify the certificate with the provided code.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact the issuing institution for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
