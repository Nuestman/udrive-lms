import React from 'react';
import PageLayout from '../ui/PageLayout';

const TermsPage: React.FC = () => {
  return (
    <PageLayout
      title="Terms of Service"
      breadcrumbs={[{ label: 'Terms of Service' }]}
    >
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl">
        <div className="prose prose-primary max-w-none">
          <p className="text-gray-600 text-lg mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using SunLMS, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to access and use SunLMS for personal, educational, and professional purposes as a registered user of a participating organization.
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>You may not modify or copy the materials</li>
            <li>You may not use the materials for any commercial purpose</li>
            <li>You may not attempt to reverse engineer any software</li>
            <li>You may not remove any copyright or proprietary notations</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
          <p className="text-gray-700 mb-4">
            You are responsible for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Prohibited Activities</h2>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Violate any laws or regulations</li>
            <li>Share your account with others</li>
            <li>Upload malicious code or viruses</li>
            <li>Interfere with the platform's operation</li>
            <li>Attempt to gain unauthorized access</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            SunLMS shall not be liable for any damages arising from the use or inability to use the service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Contact Information</h2>
          <p className="text-gray-700">
            For questions about these Terms, contact us at:<br />
            <strong>Email:</strong> legal@sunlms.com
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default TermsPage;

