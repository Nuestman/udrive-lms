import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, GraduationCap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const RoleSwitcher: React.FC = () => {
  const { profile, switchRole } = useAuth();
  const { success, error: showError } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show for non-student users
  if (!profile || profile.primary_role === 'student' || !profile.primary_role) {
    return null;
  }

  const primaryRole = profile.primary_role || profile.role;
  const activeRole = profile.active_role || profile.role;
  const isStudentMode = activeRole === 'student';

  const roleLabels = {
    super_admin: 'Super Admin',
    school_admin: 'School Admin',
    instructor: 'Instructor',
    student: 'Student'
  };

  const handleRoleSwitch = async (targetRole: 'super_admin' | 'school_admin' | 'instructor' | 'student') => {
    try {
      await switchRole(targetRole);
      success(`Switched to ${roleLabels[targetRole]} mode`);
      setDropdownOpen(false);
    } catch (error: any) {
      showError(error.message || 'Failed to switch role');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Student Mode Badge/Button */}
      {isStudentMode ? (
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <GraduationCap size={16} />
          <span>Student Mode</span>
          <ChevronDown size={16} className={dropdownOpen ? 'rotate-180' : ''} />
        </button>
      ) : (
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          <User size={16} />
          <span>{roleLabels[primaryRole as keyof typeof roleLabels]}</span>
          <ChevronDown size={16} className={dropdownOpen ? 'rotate-180' : ''} />
        </button>
      )}

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Switch Role</p>
            </div>
            
            {/* Primary Role Option */}
            <button
              onClick={() => handleRoleSwitch(primaryRole as any)}
              className={`w-full text-left px-4 py-2 text-sm ${
                activeRole === primaryRole
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } transition-colors flex items-center gap-2`}
            >
              <User size={16} />
              <span>{roleLabels[primaryRole as keyof typeof roleLabels]}</span>
              {activeRole === primaryRole && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </button>

            {/* Student Role Option */}
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`w-full text-left px-4 py-2 text-sm ${
                isStudentMode
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } transition-colors flex items-center gap-2`}
            >
              <GraduationCap size={16} />
              <span>Student Mode</span>
              {isStudentMode && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;

