import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { quizzesApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface QuizBuilderModalProps {
  isOpen: boolean;
  moduleId: string;
  onClose: () => void;
  onCreated?: (quiz: any) => void;
}

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

const defaultPassing = 70;

const QuizBuilderModal: React.FC<QuizBuilderModalProps> = ({ isOpen, moduleId, onClose, onCreated }) => {
  const { error: toastError } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<any | null>(null);

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passing_score: defaultPassing,
    time_limit: 0,
    attempts_allowed: 1,
    randomize_questions: false,
    randomize_answers: false,
    show_feedback: 'immediate',
    status: 'draft',
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as QuestionType,
    options: [''],
    correct_answer: '',
    explanation: '',
    points: 1,
  });

  const canCreateQuiz = useMemo(() => quizForm.title.trim().length > 0, [quizForm]);

  if (!isOpen) return null;

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateQuiz) return;
    try {
      setSaving(true);
      const res = await quizzesApi.create({
        module_id: moduleId,
        title: quizForm.title.trim(),
        description: quizForm.description?.trim() || undefined,
        passing_score: Number(quizForm.passing_score) || defaultPassing,
        time_limit: Number(quizForm.time_limit) || 0,
        attempts_allowed: Number(quizForm.attempts_allowed) || 1,
        randomize_questions: !!quizForm.randomize_questions,
        randomize_answers: !!quizForm.randomize_answers,
        show_feedback: quizForm.show_feedback as any,
        status: quizForm.status as any,
      });
      if ((res as any).success && (res as any).data) {
        const quiz = (res as any).data;
        setCreatedQuiz(quiz);
        setStep(2);
        onCreated?.(quiz);
      }
    } catch (err: any) {
      // Best effort; modal stays open
      // Toasts are not available here without context, keep silent
    } finally {
      setSaving(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: [''],
      correct_answer: '',
      explanation: '',
      points: 1,
    });
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdQuiz) return;
    try {
      setCreatingQuestion(true);
      const payload: any = {
        question_text: questionForm.question_text.trim(),
        question_type: questionForm.question_type,
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation.trim() || undefined,
        points: Number(questionForm.points) || 1,
      };

      if (questionForm.question_type === 'multiple_choice') {
        const options = (questionForm.options || []).map((o) => (o || '').trim()).filter(Boolean);
        if (options.length < 2) {
          toastError('Please provide at least two options.');
          return;
        }
        payload.options = options;
      } else if (questionForm.question_type === 'true_false') {
        payload.options = ['True', 'False'];
      }

      const res = await quizzesApi.addQuestion(createdQuiz.id, payload);
      if ((res as any).success) {
        resetQuestionForm();
      }
    } catch (err: any) {
      // Toasts are not available here without context, keep silent
    } finally {
      setCreatingQuestion(false);
    }
  };

  const closeAll = () => {
    setStep(1);
    setCreatedQuiz(null);
    setQuizForm({ title: '', description: '', passing_score: defaultPassing, time_limit: 0, attempts_allowed: 1, randomize_questions: false, randomize_answers: false, show_feedback: 'immediate', status: 'draft' });
    resetQuestionForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{step === 1 ? 'Create Quiz' : 'Add Questions'}</h3>
          <button onClick={closeAll} className="p-2 text-gray-600 hover:bg-gray-100 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <form onSubmit={handleCreateQuiz} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Module 1 Assessment"
                title="Quiz title"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Describe what this quiz covers (optional)"
                title="Quiz description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm({ ...quizForm, passing_score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 70"
                  title="Passing score percentage"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (min)</label>
                <input
                  type="number"
                  min={0}
                  value={quizForm.time_limit}
                  onChange={(e) => setQuizForm({ ...quizForm, time_limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0 for no limit"
                  title="Time limit in minutes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attempts Allowed</label>
                <input
                  type="number"
                  min={1}
                  value={quizForm.attempts_allowed}
                  onChange={(e) => setQuizForm({ ...quizForm, attempts_allowed: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., 1"
                  title="Number of attempts allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="randomize_questions"
                  type="checkbox"
                  checked={quizForm.randomize_questions}
                  onChange={(e) => setQuizForm({ ...quizForm, randomize_questions: e.target.checked })}
                  className="h-4 w-4 border-gray-300 rounded"
                  title="Randomize questions"
                />
                <label htmlFor="randomize_questions" className="text-sm text-gray-700">Randomize questions</label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="randomize_answers"
                  type="checkbox"
                  checked={quizForm.randomize_answers}
                  onChange={(e) => setQuizForm({ ...quizForm, randomize_answers: e.target.checked })}
                  className="h-4 w-4 border-gray-300 rounded"
                  title="Randomize answers"
                />
                <label htmlFor="randomize_answers" className="text-sm text-gray-700">Randomize answers</label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Visibility</label>
                <select
                  value={quizForm.show_feedback}
                  onChange={(e) => setQuizForm({ ...quizForm, show_feedback: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="When to show feedback"
                >
                  <option value="immediate">Immediate</option>
                  <option value="after_submission">After submission</option>
                  <option value="after_completion">After completion</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={quizForm.status}
                  onChange={(e) => setQuizForm({ ...quizForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Quiz status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeAll} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={!canCreateQuiz || saving} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create & Continue'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Quiz:</span> {createdQuiz?.title}
              </div>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter the question text"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
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
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value as QuestionType })}
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
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 1"
                    title="Points for this question"
                  />
                </div>
                {questionForm.question_type === 'true_false' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                    <select
                      value={questionForm.correct_answer || ''}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
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
                      value={questionForm.correct_answer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={questionForm.question_type === 'short_answer' ? 'Type the expected answer' : 'Correct answer'}
                      title="Correct answer value"
                    />
                  </div>
                )}
              </div>

              {(questionForm.question_type === 'multiple_choice') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Options</label>
                    <button
                      type="button"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                      onClick={() => setQuestionForm({ ...questionForm, options: [...(questionForm.options || []), ''] })}
                    >
                      <Plus size={14} className="mr-1" /> Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(questionForm.options || []).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...(questionForm.options || [])];
                            next[idx] = e.target.value;
                            setQuestionForm({ ...questionForm, options: next });
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
                            const next = [...(questionForm.options || [])];
                            next.splice(idx, 1);
                            setQuestionForm({ ...questionForm, options: next });
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={closeAll} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50">Done</button>
                <button type="submit" disabled={creatingQuestion || !questionForm.question_text.trim()} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                  {creatingQuestion ? 'Adding...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBuilderModal;


