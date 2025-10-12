import React from 'react';
import PageLayout from '../ui/PageLayout';
import { HelpCircle, Book, MessageCircle, Mail, Phone, FileText } from 'lucide-react';

const HelpPage: React.FC = () => {
  const breadcrumbs = [
    { label: 'Help & Support' }
  ];

  const helpSections = [
    {
      icon: <Book className="w-6 h-6" />,
      title: 'User Guide',
      description: 'Comprehensive documentation and tutorials',
      items: [
        'Getting Started Guide',
        'Course Management',
        'Student Enrollment',
        'Certificate Generation',
        'Analytics & Reporting'
      ]
    },
    {
      icon: <HelpCircle className="w-6 h-6" />,
      title: 'Frequently Asked Questions',
      description: 'Quick answers to common questions',
      items: [
        'How do I create a new course?',
        'How do I enroll students?',
        'How do I generate certificates?',
        'How do I track student progress?',
        'How do I export reports?'
      ]
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Technical Documentation',
      description: 'API documentation and technical resources',
      items: [
        'API Reference',
        'Integration Guide',
        'System Requirements',
        'Security Guidelines',
        'Troubleshooting'
      ]
    }
  ];

  const contactOptions = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@udrive.com',
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

  return (
    <PageLayout
      title="Help & Support"
      description="Find answers, documentation, and get support for UDrive LMS"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-8">
        {/* Quick Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Help Articles</h3>
          <div className="relative">
            <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="What can we help you with?"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {helpSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <div className="text-primary-600">
                    {section.icon}
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-900">All systems operational</span>
            </div>
            <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">
              View status page →
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpPage;