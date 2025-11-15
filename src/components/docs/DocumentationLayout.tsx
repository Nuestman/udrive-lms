import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Book, 
  Code, 
  Database, 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  GraduationCap, 
  BarChart, 
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Import all documentation components
import DocumentationOverview from './DocumentationOverview';
import QuickStartGuide from './QuickStartGuide';
import SystemArchitecture from './SystemArchitecture';
import ApiReference from './ApiReference';
import DevelopmentSetup from './DevelopmentSetup';
import LessonMediaDocs from './LessonMediaDocs';
import PlaceholderPage from './PlaceholderPage';

interface DocumentationLayoutProps {
  children?: React.ReactNode;
}

const DocumentationLayout: React.FC<DocumentationLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');
  const location = useLocation();
  const navigate = useNavigate();
  const { section: routeSection } = useParams<{ section?: string }>();

  useEffect(() => {
    if (routeSection && routeSection !== currentSection) {
      setCurrentSection(routeSection);
      return;
    }
    if (!routeSection && currentSection !== 'overview') {
      setCurrentSection('overview');
    }
  }, [routeSection, currentSection]);

  const documentationSections = [
    {
      title: 'Getting Started',
      icon: <Book className="w-4 h-4" />,
      items: [
        { title: 'Overview', section: 'overview', exact: true },
        { title: 'Quick Start', section: 'quick-start' },
        { title: 'Development Setup', section: 'development-setup' },
        { title: 'Deployment Guide', section: 'deployment' }
      ]
    },
    {
      title: 'System Architecture',
      icon: <Code className="w-4 h-4" />,
      items: [
        { title: 'System Architecture', section: 'architecture' },
        { title: 'Technical Stack', section: 'technical-stack' },
        { title: 'Database Schema', section: 'database-schema' },
        { title: 'Security', section: 'security' }
      ]
    },
    {
      title: 'API Documentation',
      icon: <FileText className="w-4 h-4" />,
      items: [
        { title: 'API Reference', section: 'api-reference' },
        { title: 'Authentication', section: 'authentication' },
        { title: 'Endpoints', section: 'endpoints' },
        { title: 'Error Codes', section: 'error-codes' }
      ]
    },
    {
      title: 'User Guides',
      icon: <Users className="w-4 h-4" />,
      items: [
        { title: 'Student Guide', section: 'student-guide' },
        { title: 'Instructor Guide', section: 'instructor-guide' },
        { title: 'Admin Guide', section: 'admin-guide' },
        { title: 'Troubleshooting', section: 'troubleshooting' }
      ]
    },
    {
      title: 'Features',
      icon: <GraduationCap className="w-4 h-4" />,
      items: [
        { title: 'Student Module', section: 'student-module' },
        { title: 'Quiz Engine', section: 'quiz-engine' },
        { title: 'Progress Management', section: 'progress-management' },
        { title: 'Certificate System', section: 'certificates' },
        { title: 'Lesson Media Pipeline', section: 'lesson-media' }
      ]
    },
    {
      title: 'Business',
      icon: <BarChart className="w-4 h-4" />,
      items: [
        { title: 'Business Model', section: 'business-model' },
        { title: 'Implementation Guide', section: 'implementation' },
        { title: 'Migration Guide', section: 'migration' }
      ]
    }
  ];

  const isActiveSection = (section: string) => {
    return currentSection === section;
  };

  const handleSectionChange = (section: string) => {
    const path = section === 'overview' ? '/docs' : `/docs/${section}`;
    if (location.pathname !== path) {
      navigate(path, { replace: false });
    }
    setCurrentSection(section);
    setSidebarOpen(false);
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'overview':
        return <DocumentationOverview />;
      case 'quick-start':
        return <QuickStartGuide />;
      case 'architecture':
        return <SystemArchitecture />;
      case 'api-reference':
        return <ApiReference />;
      case 'development-setup':
        return <DevelopmentSetup />;
      case 'deployment':
        return <PlaceholderPage 
          title="Deployment Guide" 
          description="Complete guide to deploying SunLMS in production environments"
          icon={<Database className="w-8 h-8" />}
        />;
      case 'technical-stack':
        return <PlaceholderPage 
          title="Technical Stack" 
          description="Detailed overview of all technologies and frameworks used in SunLMS"
          icon={<Code className="w-8 h-8" />}
        />;
      case 'database-schema':
        return <PlaceholderPage 
          title="Database Schema" 
          description="Complete database structure, relationships, and data models"
          icon={<Database className="w-8 h-8" />}
        />;
      case 'security':
        return <PlaceholderPage 
          title="Security" 
          description="Security implementation, best practices, and compliance guidelines"
          icon={<Shield className="w-8 h-8" />}
        />;
      case 'authentication':
        return <PlaceholderPage 
          title="Authentication" 
          description="Authentication system, JWT implementation, and user management"
          icon={<Shield className="w-8 h-8" />}
        />;
      case 'endpoints':
        return <PlaceholderPage 
          title="API Endpoints" 
          description="Detailed documentation of all API endpoints and their usage"
          icon={<FileText className="w-8 h-8" />}
        />;
      case 'error-codes':
        return <PlaceholderPage 
          title="Error Codes" 
          description="Complete reference of error codes and troubleshooting guides"
          icon={<FileText className="w-8 h-8" />}
        />;
      case 'student-guide':
        return <PlaceholderPage 
          title="Student Guide" 
          description="Comprehensive guide for students using SunLMS"
          icon={<GraduationCap className="w-8 h-8" />}
        />;
      case 'instructor-guide':
        return <PlaceholderPage 
          title="Instructor Guide" 
          description="Complete guide for instructors creating and managing courses"
          icon={<Users className="w-8 h-8" />}
        />;
      case 'admin-guide':
        return <PlaceholderPage 
          title="Admin Guide" 
          description="Administrative guide for managing users, courses, and system settings"
          icon={<Settings className="w-8 h-8" />}
        />;
      case 'troubleshooting':
        return <PlaceholderPage 
          title="Troubleshooting" 
          description="Common issues, solutions, and debugging guides"
          icon={<Settings className="w-8 h-8" />}
        />;
      case 'student-module':
        return <PlaceholderPage 
          title="Student Module" 
          description="Detailed documentation of the student learning experience"
          icon={<GraduationCap className="w-8 h-8" />}
        />;
      case 'quiz-engine':
        return <PlaceholderPage 
          title="Quiz Engine" 
          description="Quiz creation, management, and assessment features"
          icon={<Book className="w-8 h-8" />}
        />;
      case 'progress-management':
        return <PlaceholderPage 
          title="Progress Management" 
          description="Student progress tracking and analytics system"
          icon={<BarChart className="w-8 h-8" />}
        />;
      case 'certificates':
        return <PlaceholderPage 
          title="Certificate System" 
          description="Digital certificate generation and verification system"
          icon={<GraduationCap className="w-8 h-8" />}
        />;
      case 'lesson-media':
        return <LessonMediaDocs />;
      case 'business-model':
        return <PlaceholderPage 
          title="Business Model" 
          description="Business strategy, pricing, and market positioning"
          icon={<BarChart className="w-8 h-8" />}
        />;
      case 'implementation':
        return <PlaceholderPage 
          title="Implementation Guide" 
          description="Step-by-step implementation guide for organizations"
          icon={<Settings className="w-8 h-8" />}
        />;
      case 'migration':
        return <PlaceholderPage 
          title="Migration Guide" 
          description="Guide for migrating from other LMS platforms"
          icon={<Database className="w-8 h-8" />}
        />;
      default:
        return <DocumentationOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-80 lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">SunLMS Docs</h1>
              <p className="text-sm text-gray-500">Documentation</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {documentationSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex items-center mb-3">
                  <div className="text-primary-600 mr-2">
                    {section.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {section.title}
                  </h3>
                </div>
                <ul className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <button
                        onClick={() => handleSectionChange(item.section)}
                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors text-left ${
                          isActiveSection(item.section)
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="w-3 h-3 mr-2" />
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* External Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/your-org/sunlms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MessageCircle className="w-3 h-3 mr-2" />
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 mr-3"
                  title="Open sidebar"
                  aria-label="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {documentationSections
                      .flatMap(section => section.items)
                      .find(item => item.section === currentSection)?.title || 'Documentation'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    SunLMS Learning Management System
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  ← Back to App
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-6 py-8 w-full">
          {children || renderCurrentSection()}
        </main>
      </div>
    </div>
  );
};

export default DocumentationLayout;
