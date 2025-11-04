import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  Shield, 
  Database, 
  Users, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

const ApiReference: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const apiEndpoints = [
    {
      category: 'Authentication',
      description: 'User authentication and authorization',
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Authenticate user and return JWT token',
          request: {
            body: {
              email: 'string',
              password: 'string'
            }
          },
          response: {
            success: {
              user: {
                id: 'uuid',
                email: 'string',
                role: 'string',
                tenant_id: 'uuid'
              },
              token: 'jwt_token'
            }
          }
        },
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account',
          request: {
            body: {
              email: 'string',
              password: 'string',
              role: 'string',
              tenant_id: 'uuid',
              first_name: 'string',
              last_name: 'string'
            }
          }
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current user information',
          response: {
            success: {
              id: 'uuid',
              email: 'string',
              role: 'string',
              profile: {
                first_name: 'string',
                last_name: 'string',
                avatar_url: 'string'
              }
            }
          }
        }
      ]
    },
    {
      category: 'Courses',
      description: 'Course management and retrieval',
      endpoints: [
        {
          method: 'GET',
          path: '/api/courses',
          description: 'Get list of courses with optional filtering',
          query: {
            status: 'string (optional)',
            search: 'string (optional)',
            page: 'number (optional)',
            limit: 'number (optional)'
          }
        },
        {
          method: 'POST',
          path: '/api/courses',
          description: 'Create a new course (instructor/admin only)',
          request: {
            body: {
              title: 'string',
              description: 'string',
              thumbnail_url: 'string (optional)'
            }
          }
        },
        {
          method: 'GET',
          path: '/api/courses/:id',
          description: 'Get course details with modules',
          response: {
            success: {
              id: 'uuid',
              title: 'string',
              description: 'string',
              modules: [
                {
                  id: 'uuid',
                  title: 'string',
                  order_index: 'number',
                  lessons: 'array',
                  quizzes: 'array'
                }
              ]
            }
          }
        }
      ]
    },
    {
      category: 'Progress',
      description: 'Student progress tracking',
      endpoints: [
        {
          method: 'GET',
          path: '/api/progress/student/:studentId',
          description: 'Get student overall progress',
          response: {
            success: {
              total_courses: 'number',
              completed_courses: 'number',
              total_progress: 'number',
              courses: [
                {
                  course_id: 'uuid',
                  title: 'string',
                  progress_percentage: 'number'
                }
              ]
            }
          }
        },
        {
          method: 'POST',
          path: '/api/progress/lesson/:contentId/complete',
          description: 'Mark content as complete (works for lessons and quizzes)',
          response: {
            success: {
              progress_record: {
                id: 'uuid',
                content_id: 'uuid',
                content_type: 'string',
                status: 'string',
                completed_at: 'timestamp'
              },
              enrollment_progress: {
                course_progress: 'number',
                module_completed: 'boolean',
                course_completed: 'boolean'
              }
            }
          }
        }
      ]
    },
    {
      category: 'Quizzes',
      description: 'Quiz management and attempts',
      endpoints: [
        {
          method: 'GET',
          path: '/api/quizzes/:id',
          description: 'Get quiz details with questions',
          response: {
            success: {
              id: 'uuid',
              title: 'string',
              description: 'string',
              time_limit_minutes: 'number',
              max_attempts: 'number',
              passing_score: 'number',
              questions: [
                {
                  id: 'uuid',
                  question_text: 'string',
                  question_type: 'string',
                  options: 'array',
                  correct_answer: 'string',
                  points: 'number'
                }
              ]
            }
          }
        },
        {
          method: 'POST',
          path: '/api/quizzes/:id/attempts',
          description: 'Submit quiz attempt',
          request: {
            body: {
              answers: {
                question_id: 'answer_value'
              }
            }
          },
          response: {
            success: {
              attempt_id: 'uuid',
              score: 'number',
              passed: 'boolean',
              time_taken_seconds: 'number'
            }
          }
        }
      ]
    }
  ];

  const errorCodes = [
    {
      category: 'Authentication Errors',
      codes: [
        { code: 'AUTH_REQUIRED', message: 'Authentication required', status: 401 },
        { code: 'AUTH_INVALID', message: 'Invalid authentication token', status: 401 },
        { code: 'AUTH_EXPIRED', message: 'Authentication token expired', status: 401 },
        { code: 'AUTH_INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions', status: 403 }
      ]
    },
    {
      category: 'Validation Errors',
      codes: [
        { code: 'VALIDATION_ERROR', message: 'Request validation failed', status: 400 },
        { code: 'REQUIRED_FIELD', message: 'Required field missing', status: 400 },
        { code: 'INVALID_FORMAT', message: 'Invalid data format', status: 400 },
        { code: 'DUPLICATE_ENTRY', message: 'Duplicate entry exists', status: 409 }
      ]
    },
    {
      category: 'Resource Errors',
      codes: [
        { code: 'RESOURCE_NOT_FOUND', message: 'Resource not found', status: 404 },
        { code: 'RESOURCE_ALREADY_EXISTS', message: 'Resource already exists', status: 409 },
        { code: 'RESOURCE_ACCESS_DENIED', message: 'Access denied to resource', status: 403 },
        { code: 'RESOURCE_CONFLICT', message: 'Resource conflict', status: 409 }
      ]
    },
    {
      category: 'System Errors',
      codes: [
        { code: 'INTERNAL_ERROR', message: 'Internal server error', status: 500 },
        { code: 'DATABASE_ERROR', message: 'Database operation failed', status: 500 },
        { code: 'FILE_UPLOAD_ERROR', message: 'File upload failed', status: 500 },
        { code: 'EXTERNAL_SERVICE_ERROR', message: 'External service error', status: 502 }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">API Reference</h1>
        <p className="text-lg text-gray-600">
          Complete API documentation for SunLMS with examples, authentication, and error handling.
        </p>
      </div>

      {/* Base Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Base Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Base URLs</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Production</span>
                <code className="text-sm text-gray-600">https://sunlms.com/api</code>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Development</span>
                <code className="text-sm text-gray-600">http://localhost:3001/api</code>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Authentication</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">Include JWT token in Authorization header:</p>
              <code className="text-sm text-gray-600">Authorization: Bearer &lt;jwt_token&gt;</code>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
        <div className="space-y-8">
          {apiEndpoints.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {category.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 
                          endpoint.method === 'POST' ? 'bg-primary-100 text-primary-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="ml-3 text-sm font-mono text-gray-700">{endpoint.path}</code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.path}`, `${category.category}-${endpointIndex}`)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy endpoint"
                        aria-label="Copy endpoint to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{endpoint.description}</p>
                    
                    {endpoint.query && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Query Parameters</h4>
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-sm text-gray-700">
                            {JSON.stringify(endpoint.query, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {endpoint.request && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Request Body</h4>
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-sm text-gray-700">
                            {JSON.stringify(endpoint.request.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {endpoint.response && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                        <div className="bg-gray-50 rounded p-3">
                          <pre className="text-sm text-gray-700">
                            {JSON.stringify(endpoint.response.success, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Codes */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Error Codes</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {errorCodes.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.codes.map((error, errorIndex) => (
                    <div key={errorIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono text-gray-900">{error.code}</code>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          error.status >= 500 ? 'bg-red-100 text-red-800' :
                          error.status >= 400 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {error.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limiting</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
            <p className="text-2xl font-bold text-gray-900">5 requests</p>
            <p className="text-sm text-gray-600">per minute</p>
          </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
            <Database className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">General API</h3>
            <p className="text-2xl font-bold text-gray-900">100 requests</p>
            <p className="text-sm text-gray-600">per minute</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">File Upload</h3>
            <p className="text-2xl font-bold text-gray-900">10 requests</p>
            <p className="text-sm text-gray-600">per minute</p>
          </div>
        </div>
      </div>

      {/* SDKs and Libraries */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">SDKs and Libraries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Code className="w-5 h-5 text-primary-500 mr-2" />
              <h3 className="font-semibold text-gray-900">JavaScript/TypeScript</h3>
            </div>
            <div className="space-y-2">
              <code className="block text-sm bg-gray-100 p-2 rounded">npm install @sunlms/api-client</code>
              <div className="text-sm text-gray-600">
                <pre className="bg-gray-50 p-3 rounded text-xs">
{`import { SunLMSAPI } from '@sunlms/api-client';

const api = new SunLMSAPI({
  baseURL: 'https://api.sunlms.com',
  token: 'your-jwt-token'
});

const courses = await api.courses.list();`}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Database className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Python</h3>
            </div>
            <div className="space-y-2">
              <code className="block text-sm bg-gray-100 p-2 rounded">pip install sunlms-api</code>
              <div className="text-sm text-gray-600">
                <pre className="bg-gray-50 p-3 rounded text-xs">
{`from sunlms import SunLMSAPI

api = SunLMSAPI(
    base_url='https://api.sunlms.com',
    token='your-jwt-token'
)

courses = api.courses.list()`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiReference;
