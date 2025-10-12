import React, { useState } from 'react';
import { CheckCircle2, XCircle, Timer, AlertCircle } from 'lucide-react';
import { create } from 'zustand';

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  score: number;
  isComplete: boolean;
  setAnswer: (questionId: string, answer: any) => void;
  nextQuestion: () => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
}

const useQuizStore = create<QuizState>((set) => ({
  currentQuestionIndex: 0,
  answers: {},
  score: 0,
  isComplete: false,
  setAnswer: (questionId, answer) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  nextQuestion: () =>
    set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  completeQuiz: () => set({ isComplete: true }),
  resetQuiz: () => set({ currentQuestionIndex: 0, answers: {}, score: 0, isComplete: false }),
}));

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  text: string;
  options?: string[];
  correctAnswer: any;
  points: number;
  explanation?: string;
}

interface QuizEngineProps {
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore?: number;
  showFeedback?: boolean;
  onComplete?: (score: number, answers: Record<string, any>) => void;
}

const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  timeLimit,
  passingScore = 70,
  showFeedback = true,
  onComplete,
}) => {
  const {
    currentQuestionIndex,
    answers,
    isComplete,
    setAnswer,
    nextQuestion,
    completeQuiz,
    resetQuiz,
  } = useQuizStore();

  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null);
  const [showExplanation, setShowExplanation] = useState(false);

  React.useEffect(() => {
    if (timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, completeQuiz]);

  const currentQuestion = questions[currentQuestionIndex];

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question) => {
      totalPoints += question.points;
      if (answers[question.id] === question.correctAnswer) {
        earnedPoints += question.points;
      }
    });

    return Math.round((earnedPoints / totalPoints) * 100);
  };

  const handleAnswer = (answer: any) => {
    setAnswer(currentQuestion.id, answer);
    setShowExplanation(showFeedback);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestionIndex === questions.length - 1) {
      const finalScore = calculateScore();
      completeQuiz();
      onComplete?.(finalScore, answers);
    } else {
      nextQuestion();
    }
  };

  const renderQuestion = () => {
    const userAnswer = answers[currentQuestion.id];
    const isAnswered = userAnswer !== undefined;
    const isCorrect = userAnswer === currentQuestion.correctAnswer;

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          {timeRemaining !== null && (
            <div className="flex items-center text-gray-500">
              <Timer className="w-5 h-5 mr-2" />
              <span>
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <p className="text-gray-800 mb-4">{currentQuestion.text}</p>

          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  userAnswer === option
                    ? isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                    : 'border-gray-200 hover:bg-gray-50'
                } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !isAnswered && handleAnswer(option)}
                disabled={isAnswered}
              >
                <div className="flex items-center">
                  <span className="flex-grow">{option}</span>
                  {isAnswered && userAnswer === option && (
                    isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </button>
            ))}

            {currentQuestion.type === 'true_false' && (
              <div className="flex space-x-4">
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    className={`flex-1 p-4 rounded-lg border transition-colors ${
                      userAnswer === option
                        ? isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => !isAnswered && handleAnswer(option)}
                    disabled={isAnswered}
                  >
                    <div className="flex items-center justify-center">
                      <span>{option}</span>
                      {isAnswered && userAnswer === option && (
                        isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 ml-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 ml-2" />
                        )
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Type your answer..."
                  disabled={isAnswered}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnswered) {
                      handleAnswer(e.currentTarget.value);
                    }
                  }}
                />
                {isAnswered && (
                  <div className={`flex items-center ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2" />
                    )}
                    <span>
                      {isCorrect ? 'Correct!' : `Incorrect. The correct answer was: ${currentQuestion.correctAnswer}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {showExplanation && isAnswered && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <p className="text-blue-900">{currentQuestion.explanation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Points: {currentQuestion.points}
          </div>
          {isAnswered && (
            <button
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              onClick={handleNext}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const score = calculateScore();
    const passed = score >= passingScore;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
          <div className={`text-4xl font-bold mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {score}%
          </div>
          <p className="text-gray-600 mb-6">
            {passed ? 'Congratulations! You passed the quiz.' : 'You did not meet the passing score.'}
          </p>
          <div className="flex justify-center">
            <button
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              onClick={resetQuiz}
            >
              Try Again
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Review</h3>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  answers[question.id] === question.correctAnswer
                    ? 'bg-green-100 text-green-500'
                    : 'bg-red-100 text-red-500'
                }`}>
                  {answers[question.id] === question.correctAnswer ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Question {index + 1}</p>
                  <p className="text-gray-600 text-sm mt-1">{question.text}</p>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Your answer: </span>
                    <span className={answers[question.id] === question.correctAnswer ? 'text-green-600' : 'text-red-600'}>
                      {answers[question.id]}
                    </span>
                  </div>
                  {answers[question.id] !== question.correctAnswer && (
                    <div className="mt-1 text-sm">
                      <span className="text-gray-500">Correct answer: </span>
                      <span className="text-green-600">{question.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {isComplete ? renderResults() : renderQuestion()}
    </div>
  );
};

export default QuizEngine;