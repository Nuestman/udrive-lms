import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Image, 
  Video, 
  FileText, 
  Music, 
  Download,
  Trash2,
  Eye,
  Copy,
  MoreVertical,
  FolderPlus,
  Tag
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadDate: string;
  tags: string[];
  usageCount: number;
  folder?: string;
}

interface MediaLibraryProps {
  onSelectFile?: (file: MediaFile) => void;
  allowMultiple?: boolean;
  fileTypes?: string[];
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectFile,
  allowMultiple = false,
  fileTypes = ['image', 'video', 'audio', 'document']
}) => {
  const [files, setFiles] = useState<MediaFile[]>([
    {
      id: '1',
      name: 'driving-lesson-hero.jpg',
      type: 'image',
      size: 2048000,
      url: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
      thumbnailUrl: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      uploadDate: '2024-03-10',
      tags: ['driving', 'lesson', 'hero'],
      usageCount: 5,
      folder: 'images'
    },
    {
      id: '2',
      name: 'traffic-rules-video.mp4',
      type: 'video',
      size: 15728640,
      url: '/videos/traffic-rules.mp4',
      thumbnailUrl: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      uploadDate: '2024-03-08',
      tags: ['traffic', 'rules', 'education'],
      usageCount: 12,
      folder: 'videos'
    },
    {
      id: '3',
      name: 'course-handbook.pdf',
      type: 'document',
      size: 5242880,
      url: '/documents/handbook.pdf',
      uploadDate: '2024-03-05',
      tags: ['handbook', 'course', 'reference'],
      usageCount: 8,
      folder: 'documents'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || file.type === selectedType;
    const matchesAllowedTypes = fileTypes.includes(file.type);
    
    return matchesSearch && matchesType && matchesAllowedTypes;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    uploadedFiles.forEach((file, index) => {
      const fileId = `upload-${Date.now()}-${index}`;
      
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            
            // Add file to library
            const newFile: MediaFile = {
              id: fileId,
              name: file.name,
              type: file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'document',
              size: file.size,
              url: URL.createObjectURL(file),
              uploadDate: new Date().toISOString().split('T')[0],
              tags: [],
              usageCount: 0
            };
            
            setFiles(prev => [newFile, ...prev]);
            
            // Remove from upload progress
            setUploadProgress(prev => {
              const { [fileId]: removed, ...rest } = prev;
              return rest;
            });
            
            return prev;
          }
          
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 200);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (file: MediaFile) => {
    if (allowMultiple) {
      setSelectedFiles(prev => 
        prev.includes(file.id) 
          ? prev.filter(id => id !== file.id)
          : [...prev, file.id]
      );
    } else {
      onSelectFile?.(file);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const copyFileUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredFiles.map((file) => (
        <div
          key={file.id}
          className={`relative group bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
            selectedFiles.includes(file.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
          }`}
          onClick={() => handleFileSelect(file)}
        >
          <div className="aspect-square p-3">
            {file.type === 'image' && file.thumbnailUrl ? (
              <img
                src={file.thumbnailUrl}
                alt={file.name}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                <div className="text-gray-400">
                  {getFileIcon(file.type)}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 pt-0">
            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            <p className="text-xs text-gray-400">Used {file.usageCount} times</p>
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyFileUrl(file.url);
                }}
                className="p-1 bg-white rounded shadow hover:bg-gray-50"
                title="Copy URL"
              >
                <Copy className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(file.url, '_blank');
                }}
                className="p-1 bg-white rounded shadow hover:bg-gray-50"
                title="View"
              >
                <Eye className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.id);
                }}
                className="p-1 bg-white rounded shadow hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Upload Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredFiles.map((file) => (
            <tr
              key={file.id}
              className={`hover:bg-gray-50 cursor-pointer ${
                selectedFiles.includes(file.id) ? 'bg-primary-50' : ''
              }`}
              onClick={() => handleFileSelect(file)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {file.type === 'image' && file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-gray-400">
                          {getFileIcon(file.type)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {file.tags.map(tag => `#${tag}`).join(' ')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {file.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatFileSize(file.size)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(file.uploadDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {file.usageCount} times
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyFileUrl(file.url);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
          <p className="text-gray-600">Manage your media files and assets</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Files
        </button>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Uploading Files</h3>
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="flex items-center">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-600">{progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Filter className="text-gray-400 mr-2" size={20} />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Upload your first file to get started.'
            }
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Files
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Selected files actions */}
      {allowMultiple && selectedFiles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => {
                const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
                selectedFileObjects.forEach(file => onSelectFile?.(file));
                setSelectedFiles([]);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Use Selected
            </button>
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;