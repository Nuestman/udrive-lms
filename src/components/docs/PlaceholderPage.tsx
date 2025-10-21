import React from 'react';
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
  Construction
} from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description, 
  icon, 
  comingSoon = true 
}) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            {icon}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      {/* Coming Soon Banner */}
      {comingSoon && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <Construction className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Coming Soon</h3>
              <p className="text-yellow-700">
                This documentation section is currently under development. 
                We're working hard to bring you comprehensive guides and resources.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Comprehensive Guides</h3>
              <p className="text-gray-600 text-sm">
                Step-by-step instructions and detailed explanations
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Code className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Code Examples</h3>
              <p className="text-gray-600 text-sm">
                Practical examples and code snippets
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Practices</h3>
              <p className="text-gray-600 text-sm">
                Industry best practices and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Resources */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/docs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
          >
            <Book className="w-5 h-5 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Documentation Overview</h3>
              <p className="text-sm text-gray-600">Get started with our comprehensive guide</p>
            </div>
          </a>
          <a
            href="/docs/quick-start"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
          >
            <Settings className="w-5 h-5 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Quick Start Guide</h3>
              <p className="text-sm text-gray-600">Get up and running quickly</p>
            </div>
          </a>
          <a
            href="/docs/api-reference"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
          >
            <FileText className="w-5 h-5 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">API Reference</h3>
              <p className="text-sm text-gray-600">Complete API documentation</p>
            </div>
          </a>
          <a
            href="/help"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Help & Support</h3>
              <p className="text-sm text-gray-600">Get help from our support team</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
