import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  XCircle,
  TrendingUp,
  Zap,
  Shield,
  Database,
  Users,
  BookOpen,
  Award
} from 'lucide-react';

const ImplementationProgressPage: React.FC = () => {
  const phases = [
    {
      title: "Phase 1: Core Infrastructure and Authentication",
      status: "complete",
      progress: 100,
      items: [
        "Multi-tenant database schema design",
        "Authentication system implementation",
        "Basic user management interface",
        "Role-based access control",
        "Development infrastructure setup",
        "CI/CD pipeline configuration",
        "Testing framework completion",
        "Logging and monitoring setup"
      ]
    },
    {
      title: "Phase 2: Content Management System",
      status: "complete",
      progress: 100,
      items: [
        "Block-based lesson editor",
        "Rich text editing capabilities",
        "Media embedding functionality",
        "Layout options implementation",
        "Content versioning system",
        "Media management system",
        "Advanced block types",
        "CDN integration for media delivery"
      ]
    },
    {
      title: "Phase 3: Learning Management System",
      status: "complete",
      progress: 100,
      items: [
        "Enhanced Student Dashboard",
        "Learning Path Navigation",
        "Assignment Submission System",
        "Advanced Progress Tracking",
        "Quiz engine implementation",
        "Certificate generation system",
        "Student management system",
        "Enrollment system"
      ]
    },
    {
      title: "Phase 4: Multi-Tenant Architecture",
      status: "complete",
      progress: 100,
      items: [
        "Tenant isolation implementation",
        "Super admin capabilities",
        "School management system",
        "Tenant-specific branding",
        "Data segregation",
        "Cross-tenant prevention"
      ]
    },
    {
      title: "Phase 5: Advanced Features",
      status: "in-progress",
      progress: 85,
      items: [
        "Real-time notifications (Socket.IO)",
        "Two-factor authentication",
        "Advanced analytics dashboard",
        "White-label customization",
        "API documentation",
        "Integration capabilities"
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'pending':
        return <XCircle className="w-6 h-6 text-gray-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const overallProgress = Math.round(
    phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Development Status</h1>
              <p className="text-gray-600 mt-1">Current implementation progress and feature status</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              Back to Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overall Progress Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Overall Progress</h2>
              <p className="text-gray-600">SunLMS Development Status</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary-600 mb-1">{overallProgress}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-primary-600 to-primary-700 h-4 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-900">
                  {phases.filter(p => p.status === 'complete').length} Complete
                </div>
                <div className="text-sm text-green-700">Phases finished</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-900">
                  {phases.filter(p => p.status === 'in-progress').length} In Progress
                </div>
                <div className="text-sm text-yellow-700">Active development</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">69+ Endpoints</div>
                <div className="text-sm text-blue-700">API ready</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-900">Production Ready</div>
                <div className="text-sm text-purple-700">Core features</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Cards */}
        <div className="space-y-6">
          {phases.map((phase, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className={`p-6 border-b-2 ${getStatusColor(phase.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(phase.status)}
                    <div>
                      <h3 className="text-xl font-bold">{phase.title}</h3>
                      <p className="text-sm mt-1 opacity-90">
                        {phase.status === 'complete' ? 'All features implemented' : 
                         phase.status === 'in-progress' ? 'Active development' : 
                         'Planned for future'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{phase.progress}%</div>
                    <div className="text-sm opacity-90">Complete</div>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/50 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      phase.status === 'complete' ? 'bg-green-600' :
                      phase.status === 'in-progress' ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`}
                    style={{ width: `${phase.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Completed Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phase.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start gap-4">
            <Zap className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold mb-3">What's Next?</h3>
              <p className="text-white/90 mb-4">
                We're actively working on advanced features including real-time notifications, 
                enhanced analytics, and white-label customization. The core platform is production-ready 
                and actively serving organizations across multiple industries.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                >
                  Try SunLMS
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to="/docs"
                  className="inline-flex items-center px-6 py-3 border-2 border-white/30 hover:border-white rounded-lg font-semibold transition-colors"
                >
                  View Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImplementationProgressPage;

