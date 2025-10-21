// Edit School Modal - Super Admin Only
import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSchools } from '../../hooks/useSchools';
import { useToast } from '../../contexts/ToastContext';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: any;
}

const EditSchoolModal: React.FC<EditSchoolModalProps> = ({ isOpen, onClose, school }) => {
  const { updateSchool } = useSchools();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with school data
  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        subdomain: school.subdomain || '',
        contact_email: school.contact_email || '',
        contact_phone: school.contact_phone || '',
        address: school.address || ''
      });
    }
  }, [school]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name || !formData.subdomain) {
      setError('School name and subdomain are required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Update school details
      await updateSchool(school.id, formData);
      
      // If logo file is selected, upload it
      if (logoFile) {
        try {
          const formDataWithLogo = new FormData();
          formDataWithLogo.append('thumbnail', logoFile);
          
          const uploadUrl = `${import.meta.env.VITE_API_URL}/media/tenant-logo/${school.id}`;
          console.log('📤 Uploading logo to:', uploadUrl);
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            credentials: 'include', // ✅ This sends the auth cookie!
            body: formDataWithLogo
          });
          
          console.log('📥 Response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Logo upload failed:', errorData);
            toast.warning(`School updated, but logo upload failed: ${errorData.message || 'Unknown error'}`);
          } else {
            const result = await response.json();
            console.log('✅ Logo uploaded successfully:', result);
            toast.success('School and logo updated successfully!');
          }
        } catch (error) {
          console.error('❌ Logo upload error:', error);
          toast.warning('School updated, but logo upload failed. Please try again.');
        }
      } else {
        toast.success('School updated successfully!');
      }
      
      setLogoFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update school');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit School</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Logo
            </label>
            <div className="relative w-full h-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-gray-400 transition-colors">
              {logoFile ? (
                <div className="relative w-full h-full">
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-4"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoFile(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : school.logo_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={school.logo_url}
                    alt="Current logo"
                    className="w-full h-full object-contain p-4"
                  />
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <span className="text-white text-sm">Click to change</span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-gray-400"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium">Click to upload logo</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 5MB)</span>
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Elite Driving School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomain *
            </label>
            <div className="flex items-center">
              <input
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                required
                pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="elite-driving"
              />
              <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                .sunlms.com
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="info@elitedriving.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchoolModal;

