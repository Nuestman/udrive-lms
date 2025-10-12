import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  MessageCircle
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionTypes: ('text' | 'file' | 'video' | 'image')[];
  instructions: string;
  rubric?: {
    criteria: string;
    points: number;
    description: string;
  }[];
  status: 'not_submitted' | 'submitted' | 'graded' | 'late';
  submission?: {
    submittedAt: string;
    content: string;
    files: { name: string; url: string; type: string }[];
    score?: number;
    feedback?: string;
  };
}

interface AssignmentSubmissionProps {
  assignment: Assignment;
  onSubmit: (submission: any) => void;
  onSaveDraft?: (draft: any) => void;
}

const AssignmentSubmission: React.FC<AssignmentSubmissionProps> = ({
  assignment,
  onSubmit,
  onSaveDraft
}) => {
  const [submissionText, setSubmissionText] = useState(assignment.submission?.content || '');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

  const isOverdue = new Date() > new Date(assignment.dueDate);
  const timeUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const submission = {
        content: submissionText,
        files: uploadedFiles,
        submittedAt: new Date().toISOString()
      };
      
      await onSubmit(submission);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      content: submissionText,
      files: uploadedFiles,
      savedAt: new Date().toISOString()
    };
    
    onSaveDraft?.(draft);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'graded':
        return <CheckCircle className="w-4 h-4" />;
      case 'late':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600">{assignment.description}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
              {getStatusIcon(assignment.status)}
              <span className="ml-2 capitalize">{assignment.status.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Due Date:</span>
            <p className={`${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}
            </p>
            {!isOverdue && timeUntilDue > 0 && (
              <p className="text-gray-500">
                {timeUntilDue} day{timeUntilDue !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
          <div>
            <span className="font-medium text-gray-700">Max Score:</span>
            <p className="text-gray-900">{assignment.maxScore} points</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Submission Types:</span>
            <p className="text-gray-900 capitalize">
              {assignment.submissionTypes.join(', ')}
            </p>
          </div>
        </div>

        {isOverdue && assignment.status === 'not_submitted' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">This assignment is overdue</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
        <div className="prose prose-sm max-w-none text-gray-700">
          <p>{assignment.instructions}</p>
        </div>

        {assignment.rubric && (
          <div className="mt-4">
            <button
              onClick={() => setShowRubric(!showRubric)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {showRubric ? 'Hide' : 'Show'} Grading Rubric
            </button>
            
            {showRubric && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Criteria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Points
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignment.rubric.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.criteria}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.points}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Previous Submission (if exists) */}
      {assignment.submission && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Submission</h3>
          
          <div className="mb-4">
            <span className="text-sm text-gray-600">
              Submitted on: {new Date(assignment.submission.submittedAt).toLocaleString()}
            </span>
          </div>

          {assignment.submission.content && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Text Submission:</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{assignment.submission.content}</p>
              </div>
            </div>
          )}

          {assignment.submission.files.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Submitted Files:</h4>
              <div className="space-y-2">
                {assignment.submission.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getFileIcon(file.type)}
                      <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignment.submission.score !== undefined && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-900">Grade:</span>
                <span className="text-xl font-bold text-green-600">
                  {assignment.submission.score}/{assignment.maxScore}
                </span>
              </div>
            </div>
          )}

          {assignment.submission.feedback && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <MessageCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Instructor Feedback:</h5>
                  <p className="text-blue-800">{assignment.submission.feedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission Form (if not submitted or resubmission allowed) */}
      {(assignment.status === 'not_submitted' || assignment.status === 'late') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {assignment.submission ? 'Resubmit Assignment' : 'Submit Assignment'}
          </h3>

          {/* Text Submission */}
          {assignment.submissionTypes.includes('text') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Submission
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter your submission text here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={8}
              />
            </div>
          )}

          {/* File Upload */}
          {(assignment.submissionTypes.includes('file') || 
            assignment.submissionTypes.includes('image') || 
            assignment.submissionTypes.includes('video')) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Upload
              </label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept={assignment.submissionTypes.includes('image') ? 'image/*' : 
                          assignment.submissionTypes.includes('video') ? 'video/*' : '*'}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  Choose Files
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {getFileIcon(file.type)}
                        <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Save Draft
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!submissionText.trim() && uploadedFiles.length === 0)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmission;