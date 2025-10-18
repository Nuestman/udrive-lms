import React, { useEffect, useState } from 'react';
import { X, Save, Trash2, Plus } from 'lucide-react';
import { quizzesApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface QuestionEditModalProps {
  isOpen: boolean;
  question: any | null;
  quizId: string;
  onClose: () => void;
  onSaved?: (question: any) => void;
  onDeleted?: () => void;
}

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({ 
  isOpen, 
  question, 
  quizId, 
  onClose, 
  onSaved, 
  onDeleted 
}) => {
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as QuestionType,
    options: [''],
    correct_answer: '',
    explanation: '',
    points: 1,
  });

  useEffect(() => {
    if (question && isOpen) {
      setForm({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        options: Array.isArray(question.options) ? question.options : [''],
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || '',
        points: question.points || 1,
      });
    }
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload: any = {
        question_text: form.question_text.trim(),
        question_type: form.question_type,
        correct_answer: form.correct_answer,
        explanation: form.explanation.trim() || undefined,
        points: Number(form.points) || 1,
      };

      if (form.question_type === 'multiple_choice') {
        const options = (form.options || []).map((o) => (o || '').trim()).filter(Boolean);
        if (options.length < 2) {
          error('Please provide at least two options for multiple choice questions.');
          return;
        }
        payload.options = options;
      } else if (form.question_type === 'true_false') {
        payload.options = ['True', 'False'];
      }

      if (question) {
        // Update existing question
        const res = await quizzesApi.updateQuestion(quizId, question.id, payload);
        if ((res as any).success) {
          success('Question updated successfully');
          onSaved?.((res as any).data);
          onClose();
        }
      } else {
        // Add new question
        const res = await quizzesApi.addQuestion(quizId, payload);
        if ((res as any).success) {
          success('Question added successfully');
          onSaved?.((res as any).data);
          onClose();
        }
      }
    } catch (e: any) {
      error(e.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!question) return;
    
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const res = await quizzesApi.deleteQuestion(quizId, question.id);
      if ((res as any).success) {
        success('Question deleted successfully');
        onDeleted?.();
        onClose();
      }
    } catch (e: any) {
      error(e.message || 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {question ? 'Edit Question' : 'Add Question'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <input
              type="text"
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter the question text"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Explain why this answer is correct (optional)"
              title="Explanation for the correct answer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.question_type}
                onChange={(e) => setForm({ ...form, question_type: e.target.value as QuestionType })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Question type"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                min={1}
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 1"
                title="Points for this question"
              />
            </div>
            {form.question_type === 'true_false' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <select
                  value={form.correct_answer || ''}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Select True or False"
                >
                  <option value="">Select…</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                <input
                  type="text"
                  value={form.correct_answer}
                  onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={form.question_type === 'short_answer' ? 'Type the expected answer' : 'Correct answer'}
                  title="Correct answer value"
                />
              </div>
            )}
          </div>

          {form.question_type === 'multiple_choice' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => setForm({ ...form, options: [...(form.options || []), ''] })}
                >
                  <Plus size={14} className="mr-1" /> Add Option
                </button>
              </div>
              <div className="space-y-2">
                {(form.options || []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...(form.options || [])];
                        next[idx] = e.target.value;
                        setForm({ ...form, options: next });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={`Option ${idx + 1}`}
                      title={`Option ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      aria-label="Remove option"
                      onClick={() => {
                        const next = [...(form.options || [])];
                        next.splice(idx, 1);
                        setForm({ ...form, options: next });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <div>
            {question && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.question_text.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditModal;
