// Celebration Modal - Shows when student completes module or course
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, ChevronRight, Home } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'module' | 'course';
  title: string;
  message: string;
  onNext?: () => void;
  onGoToDashboard?: () => void;
  nextButtonText?: string;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  onNext,
  onGoToDashboard,
  nextButtonText = 'Next Module'
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire confetti from both sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
        {/* Header with gradient */}
        <div className={`p-8 text-center ${
          type === 'course' 
            ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500' 
            : 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500'
        }`}>
          <div className="flex justify-center mb-4">
            {type === 'course' ? (
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
            ) : (
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Award className="h-12 w-12 text-green-500" />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {type === 'course' ? '🎉 Congratulations! 🎉' : '✨ Module Complete! ✨'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            {title}
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {onNext && (
              <button
                onClick={() => {
                  onNext();
                  onClose();
                }}
                className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {nextButtonText}
                <ChevronRight size={20} className="ml-2" />
              </button>
            )}
            
            {onGoToDashboard && (
              <button
                onClick={() => {
                  onGoToDashboard();
                  onClose();
                }}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Home size={20} className="mr-2" />
                Go to Dashboard
              </button>
            )}

            {!onNext && !onGoToDashboard && (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;

