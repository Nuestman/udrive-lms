import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { useWhiteLabel } from '../../contexts/WhiteLabelContext';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Home,
  TrendingUp,
  UserCheck,
  GraduationCap,
  User,
  Mail
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
  const [unreadContactMessages, setUnreadContactMessages] = useState(0);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const location = routerLocation.pathname; // current path
  const mainRef = useRef<HTMLDivElement>(null);

  // Reset scroll position of the main scroll container on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [routerLocation.pathname, routerLocation.search, routerLocation.hash]);

  // Fetch unread contact messages count for super admin only (system-level)
  useEffect(() => {
    if (role === 'super_admin') {
      const fetchUnreadCount = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await fetch(`${API_URL}/contact/messages/stats`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setUnreadContactMessages(data.data?.unread_count || 0);
          }
        } catch (error) {
          console.error('Failed to fetch contact messages count:', error);
        }
      };
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const getNavItems = () => {
    const commonItems = [
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
            icon: <GraduationCap size={20} />, 
            label: 'Instructors', 
            href: '/admin/instructors',
            isActive: location === '/admin/instructors'
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
          { 
            icon: <Mail size={20} />, 
            label: 'Contact Messages', 
            href: '/admin/contact-messages',
            isActive: location === '/admin/contact-messages',
            badge: unreadContactMessages > 0 ? unreadContactMessages : undefined
          },
          { 
            icon: <User size={20} />, 
            label: 'My Profile', 
            href: '/admin/profile',
            isActive: location === '/admin/profile'
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
            icon: <GraduationCap size={20} />, 
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
          { 
            icon: <User size={20} />, 
            label: 'My Profile', 
            href: '/school/profile',
            isActive: location === '/school/profile'
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
          { 
            icon: <User size={20} />, 
            label: 'My Profile', 
            href: '/instructor/profile',
            isActive: location === '/instructor/profile'
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
          { 
            icon: <User size={20} />, 
            label: 'My Profile', 
            href: '/student/profile',
            isActive: location === '/student/profile'
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
        title={(useWhiteLabel().getBrandingConfig().companyName) || "SunLMS"} 
        userProfile={{
          name: getUserName(),
          avatar: profile?.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(getUserName()) + "&background=B98C1B&color=fff",
          role: profile?.active_role || profile?.role || role,
          active_role: profile?.active_role,
          primary_role: profile?.primary_role || profile?.role
        }}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar 
          navItems={getNavItems()} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
        <main
          ref={mainRef}
          className="relative flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6 md:ml-20 transition-[margin-left] duration-300 ease-out"
        >
          {children}
        </main>
      </div>
      <Footer 
        companyName="SunLMS" 
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