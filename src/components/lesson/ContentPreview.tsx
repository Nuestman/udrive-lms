import React, { useState } from 'react';
import { Eye, EyeOff, Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';
import BlockEditor from './BlockEditor';

interface ContentPreviewProps {
  content: any[];
  title?: string;
  onClose?: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  title = "Content Preview",
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);

  const getViewportClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'max-w-full';
    }
  };

  const getViewportIcon = () => {
    switch (viewMode) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            
            {/* Viewport Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'desktop' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'tablet' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'mobile' 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Preview
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh Preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close Preview"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full overflow-y-auto bg-gray-50 p-4">
              <div className={`transition-all duration-300 ${getViewportClass()}`}>
                <div className="bg-white rounded-lg shadow-sm min-h-full">
                  {/* Viewport Indicator */}
                  <div className="flex items-center justify-center py-2 bg-gray-100 border-b border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      {getViewportIcon()}
                      <span className="ml-2 capitalize">{viewMode} View</span>
                      {viewMode === 'mobile' && <span className="ml-2 text-xs">(375px)</span>}
                      {viewMode === 'tablet' && <span className="ml-2 text-xs">(768px)</span>}
                      {viewMode === 'desktop' && <span className="ml-2 text-xs">(1200px+)</span>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <BlockEditor 
                      initialContent={content} 
                      readOnly={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Hidden</h3>
                <p className="text-gray-500">Click "Show Preview" to view the content</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Content blocks: {content.length}</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Responsive preview</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPreview;