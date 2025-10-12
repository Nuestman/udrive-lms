import React from 'react';
import PageLayout from '../ui/PageLayout';

const PrivacyPage: React.FC = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      breadcrumbs={[{ label: 'Privacy Policy' }]}
    >
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl">
        <div className="prose prose-primary max-w-none">
          <p className="text-gray-600 text-lg mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            UDrive LMS collects information to provide better services to our users. We collect:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Personal information (name, email, phone number)</li>
            <li>Course enrollment and progress data</li>
            <li>Quiz and assessment results</li>
            <li>Usage data and analytics</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Provide and maintain our services</li>
            <li>Track your learning progress</li>
            <li>Generate certificates upon course completion</li>
            <li>Send you important updates and notifications</li>
            <li>Improve our platform and services</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement industry-standard security measures to protect your personal information:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Passwords are encrypted using bcrypt hashing</li>
            <li>JWT tokens for secure authentication</li>
            <li>HTTPS encryption for data in transit</li>
            <li>Regular security audits and updates</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
          <p className="text-gray-700 mb-4">
            We do not sell or share your personal information with third parties except:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>With your driving school administrators and instructors</li>
            <li>When required by law</li>
            <li>To protect our rights and safety</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Access your personal data</li>
            <li>Request corrections to your data</li>
            <li>Request deletion of your account</li>
            <li>Opt-out of non-essential communications</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> privacy@udrive.com<br />
            <strong>Address:</strong> UDrive LMS, Education Division
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;

