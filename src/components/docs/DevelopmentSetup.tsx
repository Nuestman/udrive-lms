import React from 'react';
import { 
  Code, 
  Database, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Terminal,
  FileText,
  Globe
} from 'lucide-react';

const DevelopmentSetup: React.FC = () => {
  const prerequisites = [
    {
      name: 'Node.js 18+',
      description: 'JavaScript runtime for development',
      icon: <Code className="w-5 h-5" />,
      status: 'required'
    },
    {
      name: 'PostgreSQL 15+',
      description: 'Database system for data storage',
      icon: <Database className="w-5 h-5" />,
      status: 'required'
    },
    {
      name: 'Git',
      description: 'Version control system',
      icon: <Terminal className="w-5 h-5" />,
      status: 'required'
    },
    {
      name: 'VS Code',
      description: 'Recommended code editor',
      icon: <FileText className="w-5 h-5" />,
      status: 'recommended'
    }
  ];

  const setupSteps = [
    {
      step: 1,
      title: 'Clone the Repository',
      description: 'Get the latest code from the repository',
      command: 'git clone https://github.com/your-org/sunlms.git',
      details: [
        'Navigate to your development directory',
        'Clone the repository using Git',
        'Change into the project directory'
      ]
    },
    {
      step: 2,
      title: 'Install Dependencies',
      description: 'Install all required packages',
      command: 'npm install',
      details: [
        'Install frontend dependencies',
        'Install backend dependencies',
        'Verify all packages are installed correctly'
      ]
    },
    {
      step: 3,
      title: 'Set Up Environment Variables',
      description: 'Configure your development environment',
      command: 'cp .env.example .env.local',
      details: [
        'Copy environment template',
        'Configure database connection',
        'Set JWT secrets',
        'Configure file storage tokens'
      ]
    },
    {
      step: 4,
      title: 'Initialize Database',
      description: 'Set up your local database',
      command: 'psql -U postgres -f database/schema.sql',
      details: [
        'Create database and user',
        'Run schema migrations',
        'Seed with sample data (optional)',
        'Verify database connection'
      ]
    },
    {
      step: 5,
      title: 'Start Development Servers',
      description: 'Launch the application',
      command: 'npm run dev',
      details: [
        'Start backend server (port 3001)',
        'Start frontend development server (port 5173)',
        'Verify both servers are running',
        'Open application in browser'
      ]
    }
  ];

  const environmentVariables = [
    {
      category: 'Frontend (.env.local)',
      variables: [
        { name: 'VITE_API_BASE_URL', description: 'Backend API URL', example: 'http://localhost:3001/api' },
        { name: 'VITE_APP_NAME', description: 'Application name', example: 'SunLMS' },
        { name: 'VITE_BLOB_READ_WRITE_TOKEN', description: 'File storage token', example: 'vercel_blob_token' }
      ]
    },
    {
      category: 'Backend (.env)',
      variables: [
        { name: 'DATABASE_URL', description: 'PostgreSQL connection string', example: 'postgresql://user:pass@localhost:5432/sunlms' },
        { name: 'JWT_SECRET', description: 'JWT signing secret', example: 'your-super-secret-key' },
        { name: 'JWT_EXPIRES_IN', description: 'JWT expiration time', example: '24h' },
        { name: 'BLOB_READ_WRITE_TOKEN', description: 'File storage token', example: 'vercel_blob_token' },
        { name: 'PORT', description: 'Server port', example: '3001' }
      ]
    }
  ];

  const developmentCommands = [
    {
      category: 'Frontend',
      commands: [
        { command: 'npm run dev', description: 'Start development server' },
        { command: 'npm run build', description: 'Build for production' },
        { command: 'npm run preview', description: 'Preview production build' },
        { command: 'npm run lint', description: 'Run ESLint' },
        { command: 'npm run type-check', description: 'Run TypeScript checks' }
      ]
    },
    {
      category: 'Backend',
      commands: [
        { command: 'npm run dev', description: 'Start development server with nodemon' },
        { command: 'npm start', description: 'Start production server' },
        { command: 'npm run lint', description: 'Run ESLint' },
        { command: 'npm test', description: 'Run tests (when implemented)' }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Development Setup</h1>
        <p className="text-lg text-gray-600">
          Complete guide to setting up your local development environment for SunLMS.
        </p>
      </div>

      {/* Prerequisites */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Prerequisites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prerequisites.map((prereq, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <div className="text-primary-600">
                    {prereq.icon}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="font-semibold text-gray-900">{prereq.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      prereq.status === 'required' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {prereq.status}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{prereq.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Steps */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Steps</h2>
        <div className="space-y-8">
          {setupSteps.map((step, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-lg font-bold mr-4">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Terminal</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(step.command)}
                        className="text-gray-400 hover:text-gray-200 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <code className="text-sm font-mono">{step.command}</code>
                  </div>
                  
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

      {/* Environment Variables */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Environment Variables</h2>
        <div className="space-y-6">
          {environmentVariables.map((category, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h3>
              <div className="space-y-3">
                {category.variables.map((variable, varIndex) => (
                  <div key={varIndex} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-primary-600">{variable.name}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(variable.name)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{variable.description}</p>
                    <div className="bg-gray-50 rounded p-2">
                      <code className="text-xs text-gray-700">{variable.example}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Development Commands */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Development Commands</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {developmentCommands.map((category, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h3>
              <div className="space-y-3">
                {category.commands.map((cmd, cmdIndex) => (
                  <div key={cmdIndex} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-gray-900">{cmd.command}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(cmd.command)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">{cmd.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-8">
        <div className="text-center">
          <Globe className="w-8 h-8 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Develop?</h2>
          <p className="text-gray-600 mb-6">
            Now that your development environment is set up, explore the codebase and start building amazing features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/your-org/sunlms"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Terminal className="w-5 h-5 mr-2" />
              View on GitHub
            </a>
            <a
              href="/docs/api-reference"
              className="inline-flex items-center px-6 py-3 border border-primary-300 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              API Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentSetup;
