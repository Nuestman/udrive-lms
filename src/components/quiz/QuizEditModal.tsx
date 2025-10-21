import React, { useEffect, useState } from 'react';
import { X, Plus, Edit2 } from 'lucide-react';
import { quizzesApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import QuestionEditModal from './QuestionEditModal';

interface QuizEditModalProps {
  isOpen: boolean;
  quizId: string;
  onClose: () => void;
  onSaved?: (quiz: any) => void;
}

const QuizEditModal: React.FC<QuizEditModalProps> = ({ isOpen, quizId, onClose, onSaved }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionEditModal, setQuestionEditModal] = useState<{
    isOpen: boolean;
    question: any | null;
  }>({ isOpen: false, question: null });
  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: 0,
    max_attempts: 1,
    randomize_questions: false,
    randomize_answers: false,
    show_feedback: 'immediate',
    status: 'draft',
  });

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        const res = await quizzesApi.getById(quizId);
        if ((res as any).success) {
          const q = (res as any).data;
          setQuestions(q.questions || []);
          setForm({
            title: q.title || '',
            description: q.description || '',
            passing_score: q.passing_score ?? 70,
            time_limit_minutes: q.time_limit_minutes ?? 0,
            max_attempts: q.max_attempts ?? 1,
            randomize_questions: !!q.randomize_questions,
            randomize_answers: !!q.randomize_answers,
            show_feedback: q.show_feedback || 'immediate',
            status: q.status || 'draft',
          });
        }
      } catch (e: any) {
        error(e.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, quizId, error]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await quizzesApi.update(quizId, form);
      if ((res as any).success) {
        success('Quiz updated');
        onSaved?.((res as any).data);
        onClose();
      }
    } catch (e: any) {
      error(e.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestionEditModal({ isOpen: true, question: null });
  };

  const handleEditQuestion = (question: any) => {
    setQuestionEditModal({ isOpen: true, question });
  };

  const handleQuestionSaved = async () => {
    // Reload questions to get the updated data
    try {
      const res = await quizzesApi.getById(quizId);
      if ((res as any).success) {
        const q = (res as any).data;
        setQuestions(q.questions || []);
      }
    } catch (e: any) {
      console.error('Failed to reload questions:', e);
    }
    setQuestionEditModal({ isOpen: false, question: null });
  };

  const handleQuestionDeleted = async () => {
    // Reload questions to get the updated data
    try {
      const res = await quizzesApi.getById(quizId);
      if ((res as any).success) {
        const q = (res as any).data;
        setQuestions(q.questions || []);
      }
    } catch (e: any) {
      console.error('Failed to reload questions:', e);
    }
    setQuestionEditModal({ isOpen: false, question: null });
  };

  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'short_answer': return 'Short Answer';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Quiz</h3>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Quiz Details Section */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-900 border-b pb-2">Quiz Details</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Quiz title"
                    title="Quiz title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Description"
                    title="Quiz description"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                    <input type="number" min={0} max={100} value={form.passing_score}
                      onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 70"
                      title="Passing score"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (min)</label>
                    <input type="number" min={0} value={form.time_limit_minutes}
                      onChange={(e) => setForm({ ...form, time_limit_minutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0 for no limit"
                      title="Time limit in minutes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attempts</label>
                    <input type="number" min={1} value={form.max_attempts}
                      onChange={(e) => setForm({ ...form, max_attempts: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 1"
                      title="Max attempts"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Visibility</label>
                    <select value={form.show_feedback} onChange={(e) => setForm({ ...form, show_feedback: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Feedback visibility">
                      <option value="immediate">Immediate</option>
                      <option value="after_submission">After submission</option>
                      <option value="after_completion">After completion</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Quiz status">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-md font-medium text-gray-900">Questions ({questions.length})</h4>
                  <button
                    onClick={handleAddQuestion}
                    className="inline-flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Question
                  </button>
                </div>
                
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions added yet.</p>
                    <p className="text-sm">Click "Add Question" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {getQuestionTypeDisplay(question.question_type)}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {question.points} {question.points === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{question.question_text}</p>
                            {question.explanation && (
                              <p className="text-xs text-gray-600 italic">Explanation: {question.explanation}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit question"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {/* Question Edit Modal */}
      <QuestionEditModal
        isOpen={questionEditModal.isOpen}
        question={questionEditModal.question}
        quizId={quizId}
        onClose={() => setQuestionEditModal({ isOpen: false, question: null })}
        onSaved={handleQuestionSaved}
        onDeleted={handleQuestionDeleted}
      />
    </div>
  );
};

export default QuizEditModal;


