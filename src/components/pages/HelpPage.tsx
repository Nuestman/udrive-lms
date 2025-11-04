import React, { useState } from 'react';
import PageLayout from '../ui/PageLayout';
import { 
  Book, 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText, 
  Code, 
  Database, 
  Shield, 
  Users, 
  GraduationCap, 
  Settings, 
  Search,
  ChevronRight,
  CheckCircle,
  Clock
} from 'lucide-react';

const DocumentationPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const breadcrumbs = [
    { label: 'Documentation' }
  ];

  const documentationSections = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: <Book className="w-5 h-5" />,
      description: 'Introduction to SunLMS and its capabilities',
      content: {
        title: 'SunLMS Documentation',
        subtitle: 'LMS/CMS-as-a-Service Platform',
        description: 'SunLMS is a modern, full-stack learning management system and content management system built with React, Node.js, and PostgreSQL. The system is designed as a generic LMS/CMS-as-a-Service platform with multi-tenancy in mind, supporting multiple organizations across various industries with complete data isolation.',
        features: [
          'Multi-tenant architecture with complete data isolation',
          'Unified progress tracking for lessons and quizzes',
          'Role-based access control (Super Admin, School Admin, Instructor, Student)',
          'Modern React frontend with TypeScript',
          'RESTful API with comprehensive authentication',
          'File storage integration with Vercel Blob',
          'Certificate generation and management',
          'Real-time progress tracking and analytics'
        ]
      }
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      icon: <Code className="w-5 h-5" />,
      description: 'Technical architecture and system design',
      content: {
        title: 'System Architecture',
        description: 'SunLMS follows a modern three-tier architecture with clear separation of concerns.',
        layers: [
          {
            name: 'Frontend Layer',
            technology: 'React 18 with TypeScript',
            components: ['Student Dashboard', 'Quiz Engine', 'Lesson Viewer', 'Admin Panel', 'Progress UI', 'Auth Components']
          },
          {
            name: 'Backend Layer',
            technology: 'Node.js with Express.js',
            components: ['Authentication', 'Progress Service', 'Quiz Service', 'Tenant Middleware', 'File Storage', 'API Routes']
          },
          {
            name: 'Database Layer',
            technology: 'PostgreSQL (Supabase)',
            components: ['Users & Profiles', 'Courses & Modules', 'Progress Data', 'Quizzes & Lessons', 'File References', 'Tenant Data']
          }
        ],
        patterns: [
          'Multi-Tenancy with tenant isolation',
          'Unified Content Model for lessons and quizzes',
          'Service-Oriented Architecture',
          'Progressive Enhancement'
        ]
      }
    },
    {
      id: 'tech-stack',
      title: 'Technical Stack',
      icon: <Database className="w-5 h-5" />,
      description: 'Technologies and frameworks used',
      content: {
        title: 'Technical Stack',
        frontend: {
          framework: 'React 18 with TypeScript',
          ui: 'Tailwind CSS with custom components',
          icons: 'Lucide React',
          routing: 'React Router',
          state: 'React Hooks and Context API'
        },
        backend: {
          runtime: 'Node.js with Express.js',
          database: 'PostgreSQL (Supabase)',
          auth: 'JWT with secure cookies',
          storage: 'Vercel Blob for file management'
        },
        infrastructure: {
          hosting: 'Vercel for frontend, Supabase for database',
          deployment: 'Automatic deployments from Git',
          monitoring: 'Built-in error tracking and logging'
        }
      }
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: <FileText className="w-5 h-5" />,
      description: 'Complete API documentation and endpoints',
      content: {
        title: 'API Reference',
        baseUrl: 'https://sunlms.com/api (Production) | http://localhost:3001/api (Development)',
        authentication: 'JWT Token in Authorization header: Bearer <token>',
        endpoints: [
          { method: 'POST', path: '/auth/login', description: 'Authenticate user and return JWT token' },
          { method: 'GET', path: '/courses', description: 'Get list of courses with optional filtering' },
          { method: 'GET', path: '/courses/:id', description: 'Get course details with modules' },
          { method: 'GET', path: '/lessons/:id', description: 'Get lesson content' },
          { method: 'GET', path: '/quizzes/:id', description: 'Get quiz details with questions' },
          { method: 'POST', path: '/progress/lesson/:contentId/complete', description: 'Mark content as complete' },
          { method: 'GET', path: '/progress/student/:studentId', description: 'Get student progress overview' }
        ],
        responseFormat: {
          success: '{ "success": true, "data": {...}, "message": "..." }',
          error: '{ "success": false, "error": "...", "code": "ERROR_CODE" }'
        }
      }
    },
    {
      id: 'user-guides',
      title: 'User Guides',
      icon: <Users className="w-5 h-5" />,
      description: 'Guides for different user roles',
      content: {
        title: 'User Guides',
        roles: [
          {
            role: 'Student',
            description: 'Learning content access and progress tracking',
            features: ['Course enrollment', 'Lesson viewing', 'Quiz taking', 'Progress tracking', 'Certificate viewing']
          },
          {
            role: 'Instructor',
            description: 'Course creation and content management',
            features: ['Course creation', 'Lesson editing', 'Quiz management', 'Student progress monitoring', 'Certificate generation']
          },
          {
            role: 'School Admin',
            description: 'School-wide management and oversight',
            features: ['User management', 'Course oversight', 'Analytics and reporting', 'Certificate management', 'System configuration']
          },
          {
            role: 'Super Admin',
            description: 'System-wide administration',
            features: ['Multi-tenant management', 'System analytics', 'User management across tenants', 'System configuration', 'Global reporting']
          }
        ]
      }
    },
    {
      id: 'development',
      title: 'Development Setup',
      icon: <Settings className="w-5 h-5" />,
      description: 'Local development environment setup',
      content: {
        title: 'Development Setup',
        prerequisites: ['Node.js 18+', 'PostgreSQL 15+', 'Git', 'VS Code (recommended)'],
        steps: [
          'Clone the repository',
          'Install dependencies (npm install)',
          'Set up environment variables',
          'Initialize database with schema.sql',
          'Run seed data (optional)',
          'Start development servers'
        ],
        commands: {
          frontend: 'npm run dev (starts on http://localhost:5173)',
          backend: 'cd server && npm run dev (starts on http://localhost:3001)'
        },
        environment: {
          frontend: '.env.local with VITE_API_BASE_URL and VITE_BLOB_READ_WRITE_TOKEN',
          backend: '.env with DATABASE_URL, JWT_SECRET, and BLOB_READ_WRITE_TOKEN'
        }
      }
    }
  ];

  const quickStartGuides = [
    {
      title: 'For Students',
      description: 'Get started with learning',
      icon: <GraduationCap className="w-6 h-6" />,
      steps: ['Create account', 'Browse courses', 'Enroll in courses', 'Complete lessons and quizzes', 'Track progress', 'View certificates']
    },
    {
      title: 'For Developers',
      description: 'Set up development environment',
      icon: <Code className="w-6 h-6" />,
      steps: ['Clone repository', 'Install dependencies', 'Configure environment', 'Set up database', 'Start servers', 'Begin development']
    },
    {
      title: 'For Administrators',
      description: 'Manage your organization',
      icon: <Shield className="w-6 h-6" />,
      steps: ['Access admin dashboard', 'Manage users', 'Oversee courses', 'Monitor progress', 'Generate reports', 'Configure settings']
    }
  ];

  const systemStatus = [
    { component: 'Authentication System', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { component: 'Student Module', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { component: 'Quiz Engine', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { component: 'Progress Management', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { component: 'Admin System', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
    { component: 'File Storage', status: 'operational', icon: <CheckCircle className="w-4 h-4 text-green-500" /> }
  ];

  const contactOptions = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@sunlms.com',
      availability: '24/7 response within 24 hours'
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Available in dashboard',
      availability: 'Mon-Fri, 9 AM - 6 PM EST'
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: 'Phone Support',
      description: 'Speak directly with support',
      contact: '+1 (555) 123-4567',
      availability: 'Mon-Fri, 9 AM - 6 PM EST'
    }
  ];

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSection = documentationSections.find(s => s.id === activeSection);

  return (
    <PageLayout
      title="Documentation"
      description="Comprehensive documentation for SunLMS - your complete learning management system"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-8">
        {/* Quick Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Documentation</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Quick Start Guides */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Start Guides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickStartGuides.map((guide, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <div className="text-primary-600">
                      {guide.icon}
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{guide.title}</h4>
                    <p className="text-gray-600 text-sm">{guide.description}</p>
                  </div>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-center text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Documentation Sections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`p-1 rounded ${
                    activeSection === section.id ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <div className={`${
                      activeSection === section.id ? 'text-primary-600' : 'text-gray-600'
                    }`}>
                      {section.icon}
                    </div>
                  </div>
                  <h4 className={`font-medium ml-2 ${
                    activeSection === section.id ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    {section.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">{section.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Current Section Content */}
        {currentSection && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-primary-100 rounded-lg">
                <div className="text-primary-600">
                  {currentSection.icon}
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xl font-semibold text-gray-900">{currentSection.content.title}</h3>
                <p className="text-gray-600">{currentSection.description}</p>
              </div>
            </div>

            <div className="prose max-w-none">
              {currentSection.id === 'overview' && (
                <div>
                  <p className="text-gray-700 mb-6">{currentSection.content.description}</p>
                  <h4 className="font-semibold text-gray-900 mb-4">Key Features</h4>
                  <ul className="space-y-2">
                    {'features' in currentSection.content && currentSection.content.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentSection.id === 'architecture' && (
                <div>
                  <p className="text-gray-700 mb-6">{currentSection.content.description}</p>
                  <h4 className="font-semibold text-gray-900 mb-4">System Layers</h4>
                  <div className="space-y-4">
                    {'layers' in currentSection.content && currentSection.content.layers?.map((layer, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{layer.name}</h5>
                        <p className="text-sm text-gray-600 mb-3">{layer.technology}</p>
                        <div className="flex flex-wrap gap-2">
                          {layer.components.map((component, compIndex) => (
                            <span key={compIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {component}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-4 mt-6">Architectural Patterns</h4>
                  <ul className="space-y-2">
                    {'patterns' in currentSection.content && currentSection.content.patterns?.map((pattern, index) => (
                      <li key={index} className="flex items-start">
                        <ChevronRight className="w-4 h-4 text-primary-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentSection.id === 'tech-stack' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Frontend</h4>
                      <ul className="space-y-2 text-sm">
                        {'frontend' in currentSection.content && currentSection.content.frontend && (
                          <>
                            <li><strong>Framework:</strong> {currentSection.content.frontend.framework}</li>
                            <li><strong>UI:</strong> {currentSection.content.frontend.ui}</li>
                            <li><strong>Icons:</strong> {currentSection.content.frontend.icons}</li>
                            <li><strong>Routing:</strong> {currentSection.content.frontend.routing}</li>
                            <li><strong>State:</strong> {currentSection.content.frontend.state}</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Backend</h4>
                      <ul className="space-y-2 text-sm">
                        {'backend' in currentSection.content && currentSection.content.backend && (
                          <>
                            <li><strong>Runtime:</strong> {currentSection.content.backend.runtime}</li>
                            <li><strong>Database:</strong> {currentSection.content.backend.database}</li>
                            <li><strong>Auth:</strong> {currentSection.content.backend.auth}</li>
                            <li><strong>Storage:</strong> {currentSection.content.backend.storage}</li>
                          </>
                        )}
                      </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Infrastructure</h4>
                      <ul className="space-y-2 text-sm">
                        {'infrastructure' in currentSection.content && currentSection.content.infrastructure && (
                          <>
                            <li><strong>Hosting:</strong> {currentSection.content.infrastructure.hosting}</li>
                            <li><strong>Deployment:</strong> {currentSection.content.infrastructure.deployment}</li>
                            <li><strong>Monitoring:</strong> {currentSection.content.infrastructure.monitoring}</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {currentSection.id === 'api' && (
                <div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2"><strong>Base URL:</strong> {'baseUrl' in currentSection.content ? currentSection.content.baseUrl : ''}</p>
                    <p className="text-sm text-gray-600"><strong>Authentication:</strong> {'authentication' in currentSection.content ? currentSection.content.authentication : ''}</p>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-4">Key Endpoints</h4>
                  <div className="space-y-3">
                    {'endpoints' in currentSection.content && currentSection.content.endpoints?.map((endpoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-primary-100 text-primary-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="ml-3 text-sm font-mono text-gray-700">{endpoint.path}</code>
                        </div>
                        <p className="text-sm text-gray-600">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-4 mt-6">Response Format</h4>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Success Response:</p>
                      <code className="text-xs text-gray-600">{'responseFormat' in currentSection.content && currentSection.content.responseFormat ? currentSection.content.responseFormat.success : ''}</code>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Error Response:</p>
                      <code className="text-xs text-gray-600">{'responseFormat' in currentSection.content && currentSection.content.responseFormat ? currentSection.content.responseFormat.error : ''}</code>
                    </div>
                  </div>
                </div>
              )}

              {currentSection.id === 'user-guides' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {'roles' in currentSection.content && currentSection.content.roles?.map((role, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{role.role}</h4>
                        <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                        <ul className="space-y-1">
                          {role.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSection.id === 'development' && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Prerequisites</h4>
                  <ul className="space-y-2 mb-6">
                    {'prerequisites' in currentSection.content && currentSection.content.prerequisites?.map((prereq, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                  <h4 className="font-semibold text-gray-900 mb-4">Setup Steps</h4>
                  <ol className="space-y-2 mb-6">
                    {'steps' in currentSection.content && currentSection.content.steps?.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <h4 className="font-semibold text-gray-900 mb-4">Development Commands</h4>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Frontend:</p>
                      <code className="text-sm text-gray-600">{'commands' in currentSection.content && currentSection.content.commands ? currentSection.content.commands.frontend : ''}</code>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Backend:</p>
                      <code className="text-sm text-gray-600">{'commands' in currentSection.content && currentSection.content.commands ? currentSection.content.commands.backend : ''}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemStatus.map((status, index) => (
              <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
                {status.icon}
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{status.component}</p>
                  <p className="text-sm text-green-600 capitalize">{status.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactOptions.map((option, index) => (
              <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <div className="text-primary-600">
                      {option.icon}
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{option.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{option.description}</p>
                <p className="font-medium text-primary-600 mb-1">{option.contact}</p>
                <p className="text-xs text-gray-500">{option.availability}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Updates</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="p-1 bg-primary-100 rounded">
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-gray-900">Version 2.0.0 - Unified Learning System</h4>
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
                <h4 className="font-medium text-gray-900">Performance Improvements</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Optimized database queries and progress calculations for better performance.
                </p>
                <p className="text-xs text-gray-500 mt-2">November 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DocumentationPage;