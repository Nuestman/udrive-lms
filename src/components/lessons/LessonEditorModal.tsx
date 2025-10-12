// Lesson Editor Modal - Rich text editor with TinyMCE
import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { X, Save } from 'lucide-react';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson: any;
  onClose: () => void;
  onSave: (lessonId: string, updates: any) => Promise<void>;
}

const LessonEditorModal: React.FC<LessonEditorModalProps> = ({ isOpen, lesson, onClose, onSave }) => {
  const editorRef = useRef<any>(null);
  const [title, setTitle] = useState(lesson?.title || '');
  const [lessonType, setLessonType] = useState(lesson?.lesson_type || 'text');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [documentUrl, setDocumentUrl] = useState(lesson?.document_url || '');
  const [duration, setDuration] = useState(lesson?.estimated_duration_minutes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize editor content from lesson
  const initialContent = React.useMemo(() => {
    if (!lesson?.content) return '';
    
    // If content is a JSON array (block editor format), extract text
    if (Array.isArray(lesson.content)) {
      return lesson.content
        .map((block: any) => block.content || block.text || '')
        .join('<br>');
    }
    
    // If it's already HTML string
    if (typeof lesson.content === 'string') {
      return lesson.content;
    }
    
    return '';
  }, [lesson]);

  const handleSave = async () => {
    setError('');
    
    if (!title.trim()) {
      setError('Lesson title is required');
      return;
    }

    try {
      setSaving(true);
      
      // Get content from TinyMCE
      const editorContent = editorRef.current ? editorRef.current.getContent() : '';
      
      // Store as simple JSON block for now (compatible with JSONB)
      const contentBlock = [{
        type: 'html',
        content: editorContent
      }];

      await onSave(lesson.id, {
        title,
        content: contentBlock,
        lesson_type: lessonType,
        video_url: videoUrl || null,
        document_url: documentUrl || null,
        estimated_duration_minutes: duration ? parseInt(duration) : null
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Lesson</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Type
              </label>
              <select
                value={lessonType}
                onChange={(e) => setLessonType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <Editor
              apiKey="no-api-key" // Using free version without API key
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={initialContent}
              init={{
                height: 400,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                branding: false,
                promotion: false
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

