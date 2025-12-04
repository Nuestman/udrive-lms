// SCORM Courses Page - Manage SCORM packages and create courses from them
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Package, Plus, FileText, Clock, CheckCircle2, X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PageLayout from '../ui/PageLayout';
import api from '../../lib/api';
import ConfirmationModal from '../ui/ConfirmationModal';
import { formatDistanceToNow } from 'date-fns';

const ScormCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [creatingCourse, setCreatingCourse] = useState<string | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<any | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.scorm.listPackages();
      if (response.success) {
        setPackages(response.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch SCORM packages:', err);
      showToast(err.message || 'Failed to load SCORM packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        showToast('Please select a .zip file', 'error');
        return;
      }
      setScormFile(file);
    }
  };

  const handleUpload = async () => {
    if (!scormFile) {
      showToast('Please select a SCORM package file', 'error');
      return;
    }

    try {
      setUploading(true);
      const response = await api.scorm.uploadPackage(scormFile);
      if (response.success) {
        showToast('SCORM package uploaded successfully', 'success');
        setShowUploadModal(false);
        setScormFile(null);
        await fetchPackages();
      }
    } catch (err: any) {
      console.error('SCORM upload failed:', err);
      showToast(err.message || 'Failed to upload SCORM package', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCourse = async (pkg: any) => {
    try {
      setCreatingCourse(pkg.id);
      const response = await api.scorm.createCourseFromPackage(pkg.id, {
        title: pkg.title,
        status: 'draft',
      });

      if (response.success) {
        showToast('Course created from SCORM package successfully', 'success');
        // Navigate to the new course
        navigate(`/courses/${response.data.course.id}`);
      }
    } catch (err: any) {
      console.error('Failed to create course from package:', err);
      showToast(err.message || 'Failed to create course', 'error');
    } finally {
      setCreatingCourse(null);
    }
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;

    try {
      const response = await api.scorm.deletePackage(packageToDelete.id);
      if (response.success) {
        showToast('SCORM package deleted successfully', 'success');
        setPackageToDelete(null);
        await fetchPackages(); // Refresh list
      } else {
        throw new Error('Failed to delete package');
      }
    } catch (err: any) {
      console.error('Failed to delete SCORM package:', err);
      showToast(err.message || 'Failed to delete package', 'error');
    }
  };

  return (
    <>
      <PageLayout
        title="SCORM Courses"
        breadcrumbs={[
          { label: 'Courses', href: '/school/courses' },
          { label: 'SCORM Courses' },
        ]}
        actions={
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            <Upload size={20} className="mr-2" />
            Upload SCORM Package
          </button>
        }
      >
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Upload SCORM Package</h2>
                <button
                  onClick={() => {
                    if (!uploading) {
                      setShowUploadModal(false);
                      setScormFile(null);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SCORM Package (.zip)
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={uploading}
                  />
                  {scormFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {scormFile.name} ({(scormFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      if (!uploading) {
                        setShowUploadModal(false);
                        setScormFile(null);
                      }
                    }}
                    disabled={uploading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!scormFile || uploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading SCORM packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SCORM packages yet</h3>
            <p className="text-gray-600 mb-6">
              Upload a SCORM 1.2 package (.zip) to create courses from it.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Upload size={18} className="mr-2" />
              Upload Your First Package
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {pkg.version || 'SCORM 1.2'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {pkg.created_at && (
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2" />
                      Uploaded {formatDistanceToNow(new Date(pkg.created_at), { addSuffix: true })}
                    </div>
                  )}
                  {pkg.course_id ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 size={14} className="mr-2" />
                      Course created
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <AlertCircle size={14} className="mr-2" />
                      No course yet
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!pkg.course_id ? (
                    <button
                      onClick={() => handleCreateCourse(pkg)}
                      disabled={creatingCourse === pkg.id}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {creatingCourse === pkg.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Create Course
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!pkg.course_id) {
                          showToast('No course linked to this SCORM package. Please create a course first.', 'error');
                          return;
                        }
                        try {
                          // Verify course exists before navigating
                          const response = await api.get(`/courses/${pkg.course_id}`);
                          if (response.success && response.data) {
                            navigate(`/school/courses/${pkg.course_id}`);
                          } else {
                            showToast('Course not found. It may have been deleted.', 'error');
                          }
                        } catch (err: any) {
                          console.error('Error loading course:', err);
                          const errorMessage = err?.message || err?.error || 'Failed to load course';
                          showToast(errorMessage, 'error');
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <FileText size={16} className="mr-2" />
                      View Course
                    </button>
                  )}
                  <button
                    onClick={() => setPackageToDelete(pkg)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    title="Delete package"
                    aria-label={`Delete package ${pkg.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageLayout>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!packageToDelete}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDeletePackage}
        title="Delete SCORM Package?"
        message={
          packageToDelete
            ? `Are you sure you want to delete the package "${packageToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default ScormCoursesPage;


