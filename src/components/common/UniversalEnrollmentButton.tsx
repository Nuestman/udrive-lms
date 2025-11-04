import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Award, BookOpen } from 'lucide-react';
import { enrollmentsApi, coursesApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface UniversalEnrollmentButtonProps {
  courseId: string;
  courseTitle: string;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
  enrollmentStatus?: string;
  onEnrollmentChange?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const UniversalEnrollmentButton: React.FC<UniversalEnrollmentButtonProps> = ({
  courseId,
  courseTitle,
  isEnrolled = false,
  enrollmentProgress = 0,
  enrollmentStatus = 'active',
  onEnrollmentChange,
  className = '',
  variant = 'primary',
  size = 'md',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleEnroll = async () => {
    if (isEnrolled) {
      showToast('You are already enrolled in this course', 'info');
      return;
    }

    setIsLoading(true);
    try {
      await enrollmentsApi.create({ course_id: courseId });
      showToast(`Successfully enrolled in "${courseTitle}"`, 'success');
      onEnrollmentChange?.();
    } catch (error: any) {
      console.error('Enrollment error:', error);
      showToast(error.message || 'Failed to enroll in course', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCourse = async () => {
    try {
      // Get course modules and navigate to first lesson
      const modulesRes = await coursesApi.getById(courseId);
      if (modulesRes.success && modulesRes.data.modules?.length > 0) {
        const firstModule = modulesRes.data.modules[0];
        if (firstModule.lessons?.length > 0) {
          const firstLesson = firstModule.lessons[0];
          const slug = (firstLesson.title || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
          
          // Navigate based on user role
          const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
          navigate(`${basePath}/courses/${courseId}/lessons/${slug}-${firstLesson.id}`);
          return;
        }
      }
      
      // Fallback to course overview
      const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
      navigate(`${basePath}/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error navigating to course:', error);
      showToast('Failed to navigate to course', 'error');
    }
  };

  const handleViewCertificate = () => {
    // Navigate to certificates page
    const basePath = user?.role === 'student' ? '/student' : `/${user?.role === 'school_admin' ? 'school' : user?.role === 'super_admin' ? 'admin' : user?.role}`;
    navigate(`${basePath}/certificates`);
  };

  const getButtonText = () => {
    if (isLoading) return 'Enrolling...';
    
    if (isEnrolled) {
      if (enrollmentStatus === 'completed') {
        return 'View Certificate';
      } else if (enrollmentProgress > 0) {
        return 'Continue Learning';
      } else {
        return 'Start Course';
      }
    }
    
    // Different text based on user role for enrollment
    switch (user?.role) {
      case 'instructor':
        return 'Take Course';
      case 'school_admin':
      case 'super_admin':
        return 'Enroll as Student';
      default:
        return 'Enroll';
    }
  };

  const getButtonAction = () => {
    if (isEnrolled) {
      if (enrollmentStatus === 'completed') {
        return handleViewCertificate;
      } else {
        return handleStartCourse;
      }
    }
    return handleEnroll;
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    let variantClasses = '';
    
    if (isEnrolled) {
      if (enrollmentStatus === 'completed') {
        variantClasses = variant === 'outline' 
          ? 'border-2 border-yellow-600 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500'
          : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500';
      } else {
        variantClasses = variant === 'outline'
          ? 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500'
          : 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500';
      }
    } else {
      variantClasses = variant === 'outline'
        ? 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500'
        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses} ${className}`;
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    if (isEnrolled) {
      if (enrollmentStatus === 'completed') {
        return <Award className="w-4 h-4 mr-2" />;
      } else {
        return <Play className="w-4 h-4 mr-2" />;
      }
    }
    
    return <BookOpen className="w-4 h-4 mr-2" />;
  };

  return (
    <button
      onClick={getButtonAction()}
      disabled={isLoading}
      className={getButtonClasses()}
      title={isEnrolled ? (enrollmentStatus === 'completed' ? 'View certificate' : 'Start or continue course') : `Enroll in ${courseTitle}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </button>
  );
};

export default UniversalEnrollmentButton;
