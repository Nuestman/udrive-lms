import React from 'react';
import { 
  Code, 
  Database, 
  Globe, 
  Shield, 
  Zap, 
  Layers,
  ArrowRight,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

const SystemArchitecture: React.FC = () => {
  const architectureLayers = [
    {
      name: 'Frontend Layer',
      technology: 'React 18 with TypeScript',
      description: 'Modern, responsive user interface with real-time updates',
      components: [
        'Student Dashboard',
        'Quiz Engine', 
        'Lesson Viewer',
        'Admin Panel',
        'Progress UI',
        'Auth Components'
      ],
      features: [
        'Component-based architecture',
        'TypeScript for type safety',
        'Responsive design with Tailwind CSS',
        'Real-time progress updates',
        'Offline capability (planned)'
      ]
    },
    {
      name: 'Backend Layer',
      technology: 'Node.js with Express.js',
      description: 'RESTful API with comprehensive business logic',
      components: [
        'Authentication Service',
        'Progress Service',
        'Quiz Service',
        'Tenant Middleware',
        'File Storage Service',
        'API Routes'
      ],
      features: [
        'RESTful API design',
        'JWT-based authentication',
        'Multi-tenant architecture',
        'Service-oriented design',
        'Comprehensive error handling'
      ]
    },
    {
      name: 'Database Layer',
      technology: 'PostgreSQL (Supabase)',
      description: 'Relational database with optimized queries and indexing',
      components: [
        'Users & Profiles',
        'Courses & Modules',
        'Progress Data',
        'Quizzes & Lessons',
        'File References',
        'Tenant Data'
      ],
      features: [
        'Normalized relational design',
        'UUID primary keys',
        'Optimized indexing',
        'Row-level security',
        'Automatic backups'
      ]
    }
  ];

  const architecturalPatterns = [
    {
      name: 'Multi-Tenancy',
      description: 'Complete data isolation between organizations',
      benefits: [
        'Data security and privacy',
        'Scalable architecture',
        'Cost-effective hosting',
        'Independent configurations'
      ],
      implementation: 'Tenant ID filtering at database level with middleware enforcement'
    },
    {
      name: 'Unified Content Model',
      description: 'Lessons and quizzes treated as unified content types',
      benefits: [
        'Consistent user experience',
        'Simplified progress tracking',
        'Unified navigation',
        'Easier content management'
      ],
      implementation: 'Single progress table with content_type field for differentiation'
    },
    {
      name: 'Service-Oriented Architecture',
      description: 'Modular services for different business domains',
      benefits: [
        'Maintainable codebase',
        'Independent scaling',
        'Clear separation of concerns',
        'Easier testing'
      ],
      implementation: 'Separate service classes for each domain with dependency injection'
    },
    {
      name: 'Progressive Enhancement',
      description: 'Mobile-first design with offline capabilities',
      benefits: [
        'Better mobile experience',
        'Offline learning support',
        'Improved performance',
        'Accessibility compliance'
      ],
      implementation: 'Responsive design with service workers for offline functionality'
    }
  ];

  const securityMeasures = [
    {
      category: 'Authentication',
      measures: [
        'JWT tokens with secure cookies',
        'Password hashing with bcrypt',
        'Session management',
        'Rate limiting on auth endpoints'
      ]
    },
    {
      category: 'Authorization',
      measures: [
        'Role-based access control',
        'Tenant isolation middleware',
        'Resource-level permissions',
        'API endpoint protection'
      ]
    },
    {
      category: 'Data Protection',
      measures: [
        'Input validation and sanitization',
        'SQL injection prevention',
        'XSS protection',
        'CSRF protection'
      ]
    },
    {
      category: 'Infrastructure',
      measures: [
        'HTTPS enforcement',
        'Security headers with Helmet',
        'Environment variable protection',
        'Database connection encryption'
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">System Architecture</h1>
        <p className="text-lg text-gray-600">
          SunLMS follows a modern three-tier architecture with clear separation of concerns, 
          designed for scalability, maintainability, and security.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Architecture Overview</h2>
        <div className="relative">
          {/* Architecture Diagram */}
          <div className="space-y-4">
            {/* Frontend Layer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Frontend Layer</h3>
                  <p className="text-sm text-gray-600">React 18 with TypeScript</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 mr-2" />
                HTTP/API Calls
              </div>
            </div>

            {/* Backend Layer */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Code className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Backend Layer</h3>
                  <p className="text-sm text-gray-600">Node.js with Express.js</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ArrowRight className="w-4 h-4 mr-2" />
                Database Queries
              </div>
            </div>

            {/* Database Layer */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Database className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Database Layer</h3>
                  <p className="text-sm text-gray-600">PostgreSQL (Supabase)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Layers */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Layers</h2>
        <div className="space-y-8">
          {architectureLayers.map((layer, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Layers className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900">{layer.name}</h3>
                  <p className="text-gray-600">{layer.technology}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">{layer.description}</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Components</h4>
                  <ul className="space-y-2">
                    {layer.components.map((component, compIndex) => (
                      <li key={compIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{component}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {layer.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architectural Patterns */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Architectural Patterns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {architecturalPatterns.map((pattern, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{pattern.name}</h3>
              <p className="text-gray-600 mb-4">{pattern.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                <ul className="space-y-1">
                  {pattern.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Implementation</h4>
                <p className="text-sm text-gray-600">{pattern.implementation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Architecture */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Architecture</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Multi-Layer Security</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityMeasures.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                <ul className="space-y-2">
                  {category.measures.map((measure, measureIndex) => (
                    <li key={measureIndex} className="flex items-center text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Considerations */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance & Scalability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Frontend Performance</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Code splitting and lazy loading</li>
              <li>• Image optimization</li>
              <li>• Bundle optimization</li>
              <li>• Browser caching</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Database Performance</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Optimized indexing strategy</li>
              <li>• Query optimization</li>
              <li>• Connection pooling</li>
              <li>• Read replicas (planned)</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Scalability</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Stateless backend design</li>
              <li>• Horizontal scaling ready</li>
              <li>• CDN integration</li>
              <li>• Load balancing (planned)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemArchitecture;
