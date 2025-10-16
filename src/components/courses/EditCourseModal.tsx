// Edit Course Modal
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';
import { useToast } from '../../contexts/ToastContext';
import type { Course } from '../../types/database.types';

interface EditCourseModalProps {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({ isOpen, course, onClose }) => {
  const { updateCourse } = useCourses();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    duration_weeks: course.duration_weeks?.toString() || '',
    price: course.price?.toString() || '',
    status: course.status
  });

  // Update form when course changes
  useEffect(() => {
    setFormData({
      title: course.title,
      description: course.description || '',
      duration_weeks: course.duration_weeks?.toString() || '',
      price: course.price?.toString() || '',
      status: course.status
    });
    setThumbnailFile(null);
  }, [course]);

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setThumbnailFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }

    setLoading(true);

    try {
      // Update course details
      await updateCourse(course.id, {
        title: formData.title,
        description: formData.description || undefined,
        duration_weeks: formData.duration_weeks ? parseInt(formData.duration_weeks) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        status: formData.status
      });

      // If thumbnail is selected, upload it
      if (thumbnailFile) {
        try {
          const formDataWithThumbnail = new FormData();
          formDataWithThumbnail.append('thumbnail', thumbnailFile);
          
          const uploadUrl = `${import.meta.env.VITE_API_URL}/media/course-thumbnail/${course.id}`;
          const response = await fetch(uploadUrl, {
            method: 'POST',
            credentials: 'include',
            body: formDataWithThumbnail
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Thumbnail upload failed:', errorData);
            toast.warning(`Course updated, but thumbnail upload failed: ${errorData.message || 'Unknown error'}`);
          } else {
            toast.success('Course and thumbnail updated successfully!');
          }
        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          toast.warning('Course updated, but thumbnail upload failed');
        }
      } else {
        toast.success('Course updated successfully!');
      }

      // Success - close modal
      onClose();
    } catch (err: any) {
      console.error('Update course error:', err);
      setError(err.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Course
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Thumbnail
                </label>
                <div className="relative w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-primary-400 transition-colors">
                  {thumbnailFile ? (
                    <div className="relative w-full h-full">
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="New thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setThumbnailFile(null)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : course.thumbnail_url ? (
                    <div className="relative w-full h-full">
                      <img
                        src={course.thumbnail_url}
                        alt="Current thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => thumbnailInputRef.current?.click()}
                      >
                        <span className="text-white text-sm font-medium">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 mb-2" />
                      <span className="text-sm font-medium">Click to upload thumbnail</span>
                      <span className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 10MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Duration and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (weeks)
                  </label>
                  <input
                    id="edit-duration"
                    type="number"
                    min="1"
                    max="52"
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;

