// Edit Student Modal
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { studentsApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface EditStudentModalProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSuccess }) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    phone: student.phone || '',
    address: student.address_line1 || '',
    is_active: student.is_active
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await studentsApi.update(student.id, formData);
      success(`Student ${formData.first_name} ${formData.last_name} updated successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update student';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors" 
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input 
                id="first_name" 
                type="text" 
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input 
                id="last_name" 
                type="text" 
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input 
              id="email" 
              type="email" 
              value={student.email} 
              disabled 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input 
              id="phone" 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input 
              id="address" 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          {/* Show current avatar if exists */}
          {student.avatar_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Profile Picture</label>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                <img src={student.avatar_url} alt="Student avatar" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The student can update this via Settings → Profile after logging in
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="is_active" 
              name="is_active" 
              checked={formData.is_active} 
              onChange={handleChange} 
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active Student
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;


