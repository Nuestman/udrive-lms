import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout, Sidebar, Header, Footer } from '../ui/Layout';
import { 
  BookOpen, 
  Users, 
  BarChart, 
  Settings, 
  Briefcase, 
  FileText, 
  Award, 
  HelpCircle,
  FileCode,
  FileStack,
  Home,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: 'super_admin' | 'school_admin' | 'instructor' | 'student';
  currentPath?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  role = 'school_admin',
  currentPath = '/'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname; // Get current path

  const getNavItems = () => {
    const commonItems = [
      { 
        icon: <FileCode size={20} />, 
        label: 'Technical Implementation', 
        href: '/docs/technical-implementation',
        isActive: currentPath === '/docs/technical-implementation'
      },
      { 
        icon: <FileStack size={20} />, 
        label: 'Core Features', 
        href: '/docs/core-features',
        isActive: currentPath === '/docs/core-features'
      },
      { 
        icon: <HelpCircle size={20} />, 
        label: 'Help & Support', 
        href: '/help',
        isActive: currentPath === '/help'
      },
    ];

    switch (role) {
      case 'super_admin':
        return [
          { 
            icon: <Home size={20} />, 
            label: 'Dashboard', 
            href: '/admin/dashboard',
            isActive: location === '/admin/dashboard'
          },
          { 
            icon: <Briefcase size={20} />, 
            label: 'Schools', 
            href: '/admin/schools',
            isActive: location === '/admin/schools'
          },
          { 
            icon: <BookOpen size={20} />, 
            label: 'All Courses', 
            href: '/school/courses',
            isActive: location.startsWith('/school/courses')
          },
          { 
            icon: <Users size={20} />, 
            label: 'All Students', 
            href: '/school/students',
            isActive: location === '/school/students'
          },
          { 
            icon: <UserCheck size={20} />, 
            label: 'All Enrollments', 
            href: '/school/enrollments',
            isActive: location === '/school/enrollments'
          },
          { 
            icon: <Users size={20} />, 
            label: 'All Instructors', 
            href: '/school/instructors',
            isActive: location === '/school/instructors'
          },
          { 
            icon: <Award size={20} />, 
            label: 'Certificates', 
            href: '/school/certificates',
            isActive: location === '/school/certificates'
          },
          { 
            icon: <Users size={20} />, 
            label: 'System Users', 
            href: '/admin/users',
            isActive: location === '/admin/users'
          },
          { 
            icon: <BarChart size={20} />, 
            label: 'System Analytics', 
            href: '/admin/analytics',
            isActive: location === '/admin/analytics'
          },
          { 
            icon: <Settings size={20} />, 
            label: 'System Settings', 
            href: '/admin/settings',
            isActive: location === '/admin/settings'
          },
          ...commonItems
        ];
      
      case 'school_admin':
        return [
          { 
            icon: <Home size={20} />, 
            label: 'Dashboard', 
            href: '/school/dashboard',
            isActive: location === '/school/dashboard'
          },
          { 
            icon: <BookOpen size={20} />, 
            label: 'Courses', 
            href: '/school/courses',
            isActive: location.startsWith('/school/courses')
          },
          { 
            icon: <Users size={20} />, 
            label: 'Students', 
            href: '/school/students',
            isActive: location === '/school/students'
          },
          { 
            icon: <UserCheck size={20} />, 
            label: 'Enrollments', 
            href: '/school/enrollments',
            isActive: location === '/school/enrollments'
          },
          { 
            icon: <Users size={20} />, 
            label: 'Instructors', 
            href: '/school/instructors',
            isActive: location === '/school/instructors'
          },
          { 
            icon: <Award size={20} />, 
            label: 'Certificates', 
            href: '/school/certificates',
            isActive: location === '/school/certificates'
          },
          { 
            icon: <BarChart size={20} />, 
            label: 'Analytics', 
            href: '/school/analytics',
            isActive: location === '/school/analytics'
          },
          { 
            icon: <Settings size={20} />, 
            label: 'Settings', 
            href: '/school/settings',
            isActive: location === '/school/settings'
          },
          ...commonItems
        ];
      
      case 'instructor':
        return [
          { 
            icon: <Home size={20} />, 
            label: 'Dashboard', 
            href: '/instructor/dashboard',
            isActive: location === '/instructor/dashboard'
          },
          { 
            icon: <BookOpen size={20} />, 
            label: 'My Courses', 
            href: '/instructor/courses',
            isActive: location.startsWith('/instructor/courses')
          },
          { 
            icon: <FileText size={20} />, 
            label: 'Lessons', 
            href: '/instructor/lessons',
            isActive: location === '/instructor/lessons'
          },
          { 
            icon: <Users size={20} />, 
            label: 'Students', 
            href: '/instructor/students',
            isActive: location === '/instructor/students'
          },
          { 
            icon: <BarChart size={20} />, 
            label: 'Progress', 
            href: '/instructor/progress',
            isActive: location === '/instructor/progress'
          },
          ...commonItems
        ];
      
      case 'student':
        return [
          { 
            icon: <Home size={20} />, 
            label: 'Dashboard', 
            href: '/student/dashboard',
            isActive: location === '/student/dashboard'
          },
          { 
            icon: <BookOpen size={20} />, 
            label: 'My Courses', 
            href: '/student/courses',
            isActive: location.startsWith('/student/courses')
          },
          { 
            icon: <TrendingUp size={20} />, 
            label: 'My Progress', 
            href: '/student/progress',
            isActive: location === '/student/progress'
          },
          { 
            icon: <Award size={20} />, 
            label: 'Certificates', 
            href: '/student/certificates',
            isActive: location === '/student/certificates'
          },
          ...commonItems
        ];
      
      default:
        return commonItems;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user's full name or email
  const getUserName = () => {
    if (!profile) return 'User';
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email;
  };

  return (
    <Layout>
      <Header 
        title="UDrive" 
        userProfile={{
          name: getUserName(),
          avatar: profile?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(getUserName()) + "&background=0D8ABC&color=fff",
          role: profile?.role || role
        }}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          navItems={getNavItems()} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
      <Footer 
        companyName="UDrive LMS" 
        links={[
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Contact", href: "/contact" }
        ]} 
      />
    </Layout>
  );
};

export default DashboardLayout;