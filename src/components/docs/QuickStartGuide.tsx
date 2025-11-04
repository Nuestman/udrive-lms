import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Users, 
  GraduationCap, 
  Shield, 
  Code, 
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Settings,
  Play
} from 'lucide-react';

const QuickStartGuide: React.FC = () => {
  const userTypes = [
    {
      title: 'Students',
      description: 'Get started with learning on SunLMS',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'bg-primary-100 text-primary-600',
      steps: [
        {
          title: 'Create Your Account',
          description: 'Sign up with your email and create a secure password',
          details: [
            'Visit the registration page',
            'Enter your email and password',
            'Complete your profile information',
            'Verify your email address'
          ]
        },
        {
          title: 'Browse Available Courses',
          description: 'Explore courses available in your organization',
          details: [
            'View course catalog',
            'Read course descriptions',
            'Check prerequisites',
            'Review course duration'
          ]
        },
        {
          title: 'Enroll in Courses',
          description: 'Join courses that interest you',
          details: [
            'Click "Enroll" on desired courses',
            'Confirm enrollment',
            'Access course materials',
            'Start learning immediately'
          ]
        },
        {
          title: 'Track Your Progress',
          description: 'Monitor your learning journey',
          details: [
            'View progress dashboard',
            'Complete lessons and quizzes',
            'Earn certificates',
            'Track achievements'
          ]
        }
      ]
    },
    {
      title: 'Instructors',
      description: 'Create and manage educational content',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-100 text-green-600',
      steps: [
        {
          title: 'Set Up Your Course',
          description: 'Create your first course structure',
          details: [
            'Define course objectives',
            'Create course outline',
            'Set up modules and lessons',
            'Configure course settings'
          ]
        },
        {
          title: 'Create Learning Content',
          description: 'Build engaging lessons and materials',
          details: [
            'Write lesson content',
            'Add multimedia elements',
            'Create interactive quizzes',
            'Upload supporting materials'
          ]
        },
        {
          title: 'Manage Students',
          description: 'Oversee student progress and engagement',
          details: [
            'Monitor student enrollment',
            'Track progress and completion',
            'Provide feedback and support',
            'Generate progress reports'
          ]
        },
        {
          title: 'Generate Certificates',
          description: 'Award certificates for course completion',
          details: [
            'Set completion criteria',
            'Design certificate templates',
            'Automate certificate generation',
            'Track certificate issuance'
          ]
        }
      ]
    },
    {
      title: 'Administrators',
      description: 'Manage your organization and users',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-primary-100 text-primary-600',
      steps: [
        {
          title: 'User Management',
          description: 'Manage users and their roles',
          details: [
            'Create user accounts',
            'Assign roles and permissions',
            'Manage user profiles',
            'Handle user requests'
          ]
        },
        {
          title: 'System Configuration',
          description: 'Configure system settings and preferences',
          details: [
            'Set organization details',
            'Configure system preferences',
            'Manage integrations',
            'Set up notifications'
          ]
        },
        {
          title: 'Analytics & Reporting',
          description: 'Monitor system usage and performance',
          details: [
            'View usage analytics',
            'Generate progress reports',
            'Monitor system health',
            'Export data for analysis'
          ]
        },
        {
          title: 'Content Oversight',
          description: 'Oversee courses and educational content',
          details: [
            'Review course quality',
            'Approve new courses',
            'Monitor content compliance',
            'Manage course catalog'
          ]
        }
      ]
    },
    {
      title: 'Developers',
      description: 'Set up development environment and integrate',
      icon: <Code className="w-6 h-6" />,
      color: 'bg-accent-100 text-accent-600',
      steps: [
        {
          title: 'Environment Setup',
          description: 'Prepare your development environment',
          details: [
            'Install Node.js 18+',
            'Set up PostgreSQL database',
            'Clone the repository',
            'Install dependencies'
          ]
        },
        {
          title: 'Configuration',
          description: 'Configure environment variables and settings',
          details: [
            'Set up environment files',
            'Configure database connection',
            'Set JWT secrets',
            'Configure file storage'
          ]
        },
        {
          title: 'Start Development',
          description: 'Launch development servers',
          details: [
            'Start backend server',
            'Start frontend development server',
            'Run database migrations',
            'Verify setup'
          ]
        },
        {
          title: 'API Integration',
          description: 'Integrate with SunLMS API',
          details: [
            'Review API documentation',
            'Implement authentication',
            'Make API calls',
            'Handle responses and errors'
          ]
        }
      ]
    }
  ];

  const commonTasks = [
    {
      title: 'First Login',
      description: 'Access your account for the first time',
      icon: <Play className="w-5 h-5" />,
      steps: [
        'Navigate to the login page',
        'Enter your credentials',
        'Complete any required setup',
        'Explore your dashboard'
      ]
    },
    {
      title: 'Profile Setup',
      description: 'Complete your user profile',
      icon: <Settings className="w-5 h-5" />,
      steps: [
        'Upload profile picture',
        'Add personal information',
        'Set preferences',
        'Configure notifications'
      ]
    },
    {
      title: 'Navigation',
      description: 'Learn to navigate the system',
      icon: <BookOpen className="w-5 h-5" />,
      steps: [
        'Explore main navigation',
        'Use search functionality',
        'Access help resources',
        'Customize dashboard'
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quick Start Guide</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Get up and running with SunLMS in minutes. Choose your role below to see tailored 
          instructions for getting started quickly and effectively.
        </p>
      </div>

      {/* User Type Selection */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userTypes.map((userType, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg ${userType.color}`}>
                  {userType.icon}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{userType.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{userType.description}</p>
              <div className="text-primary-600 text-sm font-medium">
                {userType.steps.length} steps to get started
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Steps for Each User Type */}
      <div className="space-y-12">
        {userTypes.map((userType, userTypeIndex) => (
          <div key={userTypeIndex} className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center mb-8">
              <div className={`p-3 rounded-lg ${userType.color}`}>
                {userType.icon}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{userType.title} Quick Start</h2>
                <p className="text-gray-600">{userType.description}</p>
              </div>
            </div>

            <div className="space-y-8">
              {userType.steps.map((step, stepIndex) => (
                <div key={stepIndex} className="border-l-4 border-primary-200 pl-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                      {stepIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Common Tasks */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commonTasks.map((task, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <div className="text-gray-600">
                    {task.icon}
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{task.description}</p>
              <ul className="space-y-2">
                {task.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-center text-sm">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      {stepIndex + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Now that you know the basics, explore our comprehensive documentation for detailed guides and advanced features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/docs/development-setup"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Code className="w-5 h-5 mr-2" />
              Development Setup
            </Link>
            <Link
              to="/docs/api-reference"
              className="inline-flex items-center px-6 py-3 border border-primary-300 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              API Documentation
            </Link>
            <Link
              to="/docs/troubleshooting"
              className="inline-flex items-center px-6 py-3 border border-primary-300 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Settings className="w-5 h-5 mr-2" />
              Troubleshooting
            </Link>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need More Help?</h3>
          <p className="text-gray-600 mb-4">
            If you're still having trouble getting started, our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@sunlms.com"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Contact Support
            </a>
            <Link
              to="/docs/troubleshooting"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Troubleshooting Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;
