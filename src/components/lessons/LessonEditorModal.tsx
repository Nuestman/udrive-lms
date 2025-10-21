// Lesson Editor Modal - Rich text editor with TinyMCE
import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { X, Save } from 'lucide-react';
import { cleanLessonContent, sanitizeEditorContent } from '../../utils/htmlUtils';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson: any;
  onClose: () => void;
  onSave: (lessonId: string, updates: any) => Promise<void>;
}

// Get TinyMCE API key from environment variables
const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY;

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({ isOpen, lesson, onClose, onSave }) => {
  const editorRef = useRef<any>(null);
  const [title, setTitle] = useState(lesson?.title || '');
  const [lessonType, setLessonType] = useState(lesson?.lesson_type || 'text');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [documentUrl, setDocumentUrl] = useState(lesson?.document_url || '');
  const [duration, setDuration] = useState(lesson?.estimated_duration_minutes || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(lesson?.status || 'draft');
  const [error, setError] = useState('');

  // Initialize editor content from lesson
  const initialContent = React.useMemo(() => {
    return cleanLessonContent(lesson?.content);
  }, [lesson]);

  const handleSave = async () => {
    setError('');
    
    if (!title.trim()) {
      setError('Lesson title is required');
      return;
    }

    try {
      setSaving(true);
      
      // Get content from TinyMCE and sanitize it
      const rawEditorContent = editorRef.current ? editorRef.current.getContent() : '';
      const sanitizedContent = sanitizeEditorContent(rawEditorContent);
      
      // Debug: Log the content to see what's being saved
      console.log('Raw editor content:', rawEditorContent);
      console.log('Sanitized content:', sanitizedContent);
      
      // Store as simple JSON block for now (compatible with JSONB)
      const contentBlock = [{
        type: 'html',
        content: sanitizedContent
      }];

      await onSave(lesson.id, {
        title,
        content: contentBlock,
        lesson_type: lessonType,
        video_url: videoUrl || null,
        document_url: documentUrl || null,
        estimated_duration_minutes: duration ? parseInt(duration) : null,
        status,
      });

      onClose();
    } catch (err: any) {
      console.error('Lesson save error:', err);
      if (err.message?.includes('request entity too large')) {
        setError('Content too large. Please reduce image sizes or remove some content.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to save lesson');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Lesson</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close editor"
            title="Close editor"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Lesson title..."
            />
          </div>

          {/* Lesson Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lesson-type" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Type
              </label>
              <select
                id="lesson-type"
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Lesson Type"
                title="Select lesson type"
              >
                <option value="text">Text Content</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="30"
                min="0"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Lesson status"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Video URL (if video type) */}
          {lessonType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* Document URL (if document type) */}
          {lessonType === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document URL
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/document.pdf"
              />
            </div>
          )}

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Content
            </label>
            <p className="text-xs text-gray-500 mb-2">
              💡 Tip: Keep images under 2MB for best performance. You can upload images via the Upload tab or drag & drop them directly into the editor. For YouTube videos, use the Media button and paste the YouTube URL.
            </p>
            <Editor
              apiKey={TINYMCE_API_KEY}
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={initialContent}
              init={{
                height: 400,
                menubar: false,
                plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount code fullscreen',
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | code fullscreen | removeformat',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; line-height:1.6; }',
                branding: false,
                promotion: false,
                // Additional settings for better editor experience
                resize: true,
                statusbar: true,
                elementpath: false,
                // Image upload settings (can be configured later with backend)
                images_upload_handler: (blobInfo: any) => {
                  return new Promise((resolve, reject) => {
                    // Check file size (limit to 2MB for base64 conversion)
                    if (blobInfo.blob().size > 2 * 1024 * 1024) {
                      reject('Image size must be less than 2MB');
                      return;
                    }
                    
                    // For now, convert to base64 (you can implement server upload later)
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blobInfo.blob());
                  });
                },
                // Image settings
                image_advtab: true,
                image_uploadtab: true,
                // Auto-resize images to prevent huge content
                automatic_uploads: true,
                file_picker_types: 'image',
                // Enable drag and drop for images
                paste_data_images: true,
                // Image dialog settings
                image_caption: true,
                image_title: true,
                // File picker callback for additional file handling
                file_picker_callback: (callback: any, value: any, meta: any) => {
                  if (meta.filetype === 'image') {
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    
                    input.onchange = function() {
                      const file = (input.files as FileList)[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = function() {
                          callback(reader.result, { alt: file.name });
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                  }
                },
                // Auto-save settings
                setup: (editor: any) => {
                  editor.on('change', () => {
                    editor.save();
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : 'Save Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditorModal;

