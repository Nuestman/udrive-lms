import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import QuizEngine from './QuizEngine';

describe('QuizEngine', () => {
  const sampleQuestions = [
    {
      id: '1',
      type: 'multiple_choice' as const,
      text: 'Test question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'B',
      points: 10,
    },
    {
      id: '2',
      type: 'true_false' as const,
      text: 'Test question 2',
      correctAnswer: 'True',
      points: 5,
    },
  ];

  it('renders the quiz with the first question', () => {
    render(<QuizEngine questions={sampleQuestions} />);
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Test question 1')).toBeInTheDocument();
  });

  it('shows feedback when an answer is selected', () => {
    render(<QuizEngine questions={sampleQuestions} showFeedback={true} />);
    fireEvent.click(screen.getByText('B'));
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('calculates the final score correctly', () => {
    const onComplete = vi.fn();
    render(<QuizEngine questions={sampleQuestions} onComplete={onComplete} />);

    // Answer first question correctly
    fireEvent.click(screen.getByText('B'));
    fireEvent.click(screen.getByText('Next'));

    // Answer second question incorrectly
    fireEvent.click(screen.getByText('False'));
    fireEvent.click(screen.getByText('Finish'));

    expect(onComplete).toHaveBeenCalledWith(66.67, expect.any(Object));
  });

  it('enforces time limit if specified', () => {
    vi.useFakeTimers();
    render(<QuizEngine questions={sampleQuestions} timeLimit={1} />);
    
    expect(screen.getByText('1:00')).toBeInTheDocument();
    
    vi.advanceTimersByTime(30000);
    expect(screen.getByText('0:30')).toBeInTheDocument();
    
    vi.advanceTimersByTime(30000);
    expect(screen.getByText('0%')).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});