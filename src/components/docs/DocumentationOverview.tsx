import React from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  Video
} from 'lucide-react';

const DocumentationOverview: React.FC = () => {
  const quickStartSections = [
    {
      title: 'For Students',
      description: 'Get started with learning on SunLMS',
      icon: <GraduationCap className="w-6 h-6" />,
      path: '/docs/student-guide',
      steps: ['Create account', 'Browse courses', 'Enroll in courses', 'Track progress']
    },
    {
      title: 'For Instructors',
      description: 'Create and manage courses',
      icon: <Users className="w-6 h-6" />,
      path: '/docs/instructor-guide',
      steps: ['Set up courses', 'Create lessons', 'Build quizzes', 'Monitor students']
    },
    {
      title: 'For Administrators',
      description: 'Manage your organization',
      icon: <Shield className="w-6 h-6" />,
      path: '/docs/admin-guide',
      steps: ['User management', 'System configuration', 'Analytics', 'Reports']
    },
    {
      title: 'For Developers',
      description: 'Set up development environment',
      icon: <Code className="w-6 h-6" />,
      path: '/docs/development-setup',
      steps: ['Install dependencies', 'Configure database', 'Start servers', 'Begin coding']
    }
  ];

  const documentationCategories = [
    {
      title: 'Getting Started',
      description: 'Everything you need to know to get up and running',
      icon: <Book className="w-5 h-5" />,
      color: 'bg-primary-100 text-primary-600',
      items: [
        { title: 'Overview', path: '/docs', description: 'Introduction to SunLMS' },
        { title: 'Quick Start', path: '/docs/quick-start', description: 'Get started in minutes' },
        { title: 'Development Setup', path: '/docs/development-setup', description: 'Local development environment' },
        { title: 'Deployment Guide', path: '/docs/deployment', description: 'Production deployment' }
      ]
    },
    {
      title: 'System Architecture',
      description: 'Technical architecture and system design',
      icon: <Code className="w-5 h-5" />,
      color: 'bg-green-100 text-green-600',
      items: [
        { title: 'System Architecture', path: '/docs/architecture', description: 'Overall system design' },
        { title: 'Technical Stack', path: '/docs/technical-stack', description: 'Technologies and frameworks' },
        { title: 'Database Schema', path: '/docs/database-schema', description: 'Database structure' },
        { title: 'Security', path: '/docs/security', description: 'Security implementation' }
      ]
    },
    {
      title: 'API Documentation',
      description: 'Complete API reference and integration guides',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-primary-100 text-primary-600',
      items: [
        { title: 'API Reference', path: '/docs/api-reference', description: 'Complete API documentation' },
        { title: 'Authentication', path: '/docs/authentication', description: 'Authentication system' },
        { title: 'Endpoints', path: '/docs/endpoints', description: 'API endpoints' },
        { title: 'Error Codes', path: '/docs/error-codes', description: 'Error handling' }
      ]
    },
    {
      title: 'User Guides',
      description: 'Comprehensive guides for all user roles',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-accent-100 text-accent-600',
      items: [
        { title: 'Student Guide', path: '/docs/student-guide', description: 'Student user guide' },
        { title: 'Instructor Guide', path: '/docs/instructor-guide', description: 'Course creation guide' },
        { title: 'Admin Guide', path: '/docs/admin-guide', description: 'Administration guide' },
        { title: 'Troubleshooting', path: '/docs/troubleshooting', description: 'Common issues and solutions' }
      ]
    }
  ];

  const systemFeatures = [
    {
      title: 'Multi-Tenant Architecture',
      description: 'Complete data isolation between organizations',
      icon: <Shield className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'Unified Progress Tracking',
      description: 'Seamless tracking across lessons and quizzes',
      icon: <BarChart className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'Modern React Frontend',
      description: 'TypeScript-based with responsive design',
      icon: <Code className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'RESTful API',
      description: 'Comprehensive API with JWT authentication',
      icon: <FileText className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'File Storage Integration',
      description: 'Vercel Blob for media management',
      icon: <Database className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'Certificate Generation',
      description: 'Automated certificate creation and management',
      icon: <GraduationCap className="w-5 h-5" />,
      status: 'operational'
    },
    {
      title: 'Interactive Lesson Media',
      description: 'Office embeds + uploaded video playback with organized blob storage',
      icon: <Video className="w-5 h-5" />,
      status: 'new'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Book className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SunLMS Documentation
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Welcome to the comprehensive documentation for SunLMS - a modern, full-stack learning management system 
          designed as a generic LMS/CMS-as-a-Service platform with multi-tenancy support.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/docs/quick-start"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Zap className="w-5 h-5 mr-2" />
            Quick Start Guide
          </Link>
          <Link
            to="/docs/development-setup"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Code className="w-5 h-5 mr-2" />
            Development Setup
          </Link>
        </div>
      <div className="mt-6 max-w-3xl mx-auto bg-primary-50 border border-primary-200 rounded-xl p-5 text-left">
        <p className="text-sm font-semibold text-primary-800 uppercase tracking-wide mb-2">New</p>
        <p className="text-gray-700">
          We just shipped inline document and video playback for lessons. Learn how uploads, storage paths, and the new viewer work in the{' '}
          <Link to="/docs/lesson-media" className="text-primary-700 font-semibold hover:underline">
            Lesson Media Pipeline guide
          </Link>
          .
        </p>
      </div>
      </div>

      {/* Quick Start Sections */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStartSections.map((section, index) => (
            <Link
              key={index}
              to={section.path}
              className="group block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <div className="text-primary-600">
                    {section.icon}
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                    {section.title}
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{section.description}</p>
              <ul className="space-y-1 mb-4">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Documentation Categories */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentation Categories</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {documentationCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  {category.icon}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      to={item.path}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* System Features */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systemFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-green-600">
                    {feature.icon}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 font-medium uppercase tracking-wide">
                      {feature.status}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Updates</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="p-1 bg-primary-100 rounded">
              <Clock className="w-4 h-4 text-primary-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Version 2.0.0 - Unified Learning System</h3>
              <p className="text-sm text-gray-600 mt-1">
                Lessons and quizzes now use the same completion system with enhanced quiz engine and better user experience.
              </p>
              <p className="text-xs text-gray-500 mt-2">December 2024</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="p-1 bg-green-100 rounded">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Performance Improvements</h3>
              <p className="text-sm text-gray-600 mt-1">
                Optimized database queries and progress calculations for better performance.
              </p>
              <p className="text-xs text-gray-500 mt-2">November 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
        <div className="text-center">
          <MessageCircle className="w-8 h-8 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/docs/troubleshooting"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Troubleshooting Guide
            </Link>
            <a
              href="mailto:support@sunlms.com"
              className="inline-flex items-center px-4 py-2 border border-primary-300 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationOverview;
