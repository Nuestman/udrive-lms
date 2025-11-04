import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface RoadSign {
  id: string;
  name: string;
  category: 'warning' | 'regulatory' | 'guide' | 'construction';
  shape: 'circle' | 'triangle' | 'rectangle' | 'diamond' | 'octagon' | 'pentagon';
  color: string;
  meaning: string;
  imageUrl: string;
  description: string;
}

interface RoadSignBlockProps {
  content: {
    signId?: string;
    description?: string;
    showMeaning?: boolean;
    interactive?: boolean;
  };
  onChange?: (content: any) => void;
  readOnly?: boolean;
}

const ROAD_SIGNS: RoadSign[] = [
  {
    id: 'stop',
    name: 'Stop Sign',
    category: 'regulatory',
    shape: 'octagon',
    color: 'red',
    meaning: 'Come to a complete stop',
    imageUrl: 'https://images.pexels.com/photos/163016/stop-sign-road-sign-sign-street-163016.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'A stop sign requires drivers to come to a complete stop at the marked line or before entering the intersection.'
  },
  {
    id: 'yield',
    name: 'Yield Sign',
    category: 'regulatory',
    shape: 'triangle',
    color: 'red-white',
    meaning: 'Give right of way to other traffic',
    imageUrl: 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'A yield sign means you must slow down and give the right of way to traffic in the intersection or roadway you are entering.'
  },
  {
    id: 'speed-limit',
    name: 'Speed Limit',
    category: 'regulatory',
    shape: 'rectangle',
    color: 'white-black',
    meaning: 'Maximum speed allowed',
    imageUrl: 'https://images.pexels.com/photos/280076/pexels-photo-280076.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'Speed limit signs indicate the maximum speed allowed on that section of road under ideal conditions.'
  },
  {
    id: 'curve-warning',
    name: 'Curve Warning',
    category: 'warning',
    shape: 'diamond',
    color: 'yellow-black',
    meaning: 'Sharp curve ahead',
    imageUrl: 'https://images.pexels.com/photos/1619299/pexels-photo-1619299.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'This warning sign alerts drivers to a sharp curve in the road ahead and to reduce speed accordingly.'
  },
  {
    id: 'school-zone',
    name: 'School Zone',
    category: 'warning',
    shape: 'pentagon',
    color: 'yellow-black',
    meaning: 'School crossing area',
    imageUrl: 'https://images.pexels.com/photos/1462636/pexels-photo-1462636.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'School zone signs warn drivers to reduce speed and watch for children crossing the street.'
  },
  {
    id: 'no-parking',
    name: 'No Parking',
    category: 'regulatory',
    shape: 'rectangle',
    color: 'white-red',
    meaning: 'Parking prohibited',
    imageUrl: 'https://images.pexels.com/photos/1619299/pexels-photo-1619299.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2',
    description: 'No parking signs indicate areas where parking is prohibited at all times or during specified hours.'
  }
];

const RoadSignBlock: React.FC<RoadSignBlockProps> = ({
  content,
  onChange,
  readOnly = false
}) => {
  const [selectedSign, setSelectedSign] = useState<RoadSign | null>(
    content.signId ? ROAD_SIGNS.find(sign => sign.id === content.signId) || null : null
  );
  const [showSignSelector, setShowSignSelector] = useState(!content.signId && !readOnly);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  const handleSignSelect = (sign: RoadSign) => {
    setSelectedSign(sign);
    setShowSignSelector(false);
    onChange?.({
      ...content,
      signId: sign.id
    });
  };

  const handleDescriptionChange = (description: string) => {
    onChange?.({
      ...content,
      description
    });
  };

  const handleQuizSubmit = () => {
    setShowResult(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'regulatory':
        return 'bg-red-100 text-red-800';
      case 'guide':
        return 'bg-primary-100 text-primary-800';
      case 'construction':
        return 'bg-accent-100 text-accent-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showSignSelector) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select a Road Sign</h3>
          <button
            onClick={() => setShowSignSelector(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ROAD_SIGNS.map((sign) => (
            <button
              key={sign.id}
              onClick={() => handleSignSelect(sign)}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <img
                src={sign.imageUrl}
                alt={sign.name}
                className="w-16 h-16 object-cover rounded-md mx-auto mb-2"
              />
              <h4 className="font-medium text-gray-900 text-sm">{sign.name}</h4>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(sign.category)}`}>
                {sign.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedSign) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Road Sign Block</h3>
        <p className="text-gray-500 mb-4">Select a road sign to display and teach about</p>
        {!readOnly && (
          <button
            onClick={() => setShowSignSelector(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Choose Road Sign
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Road Sign: {selectedSign.name}</h3>
          </div>
          {!readOnly && (
            <button
              onClick={() => setShowSignSelector(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Change Sign
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sign Image */}
          <div className="text-center">
            <img
              src={selectedSign.imageUrl}
              alt={selectedSign.name}
              className="w-48 h-48 object-cover rounded-lg mx-auto shadow-md"
            />
            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedSign.category)}`}>
                {selectedSign.category.charAt(0).toUpperCase() + selectedSign.category.slice(1)}
              </span>
            </div>
          </div>

          {/* Sign Information */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedSign.name}</h4>
              <p className="text-gray-700">{selectedSign.description}</p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-primary-500 mr-2 mt-0.5" />
                <div>
                  <h5 className="font-medium text-primary-900">Meaning</h5>
                  <p className="text-primary-800">{selectedSign.meaning}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Shape:</span>
                <span className="ml-2 text-gray-900 capitalize">{selectedSign.shape}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Color:</span>
                <span className="ml-2 text-gray-900 capitalize">{selectedSign.color.replace('-', ' & ')}</span>
              </div>
            </div>

            {/* Custom Description */}
            {!readOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={content.description || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Add any additional information about this road sign..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            {content.description && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Additional Notes</h5>
                <p className="text-gray-700">{content.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Quiz */}
        {content.interactive && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Quiz</h4>
            
            {!showQuiz ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Test Your Knowledge
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-3">
                    What should you do when you see this road sign?
                  </p>
                  <div className="space-y-2">
                    {[
                      'Ignore it and continue driving',
                      selectedSign.meaning,
                      'Speed up to get through quickly',
                      'Turn around and go back'
                    ].sort(() => Math.random() - 0.5).map((option, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="radio"
                          name="quiz-answer"
                          value={option}
                          checked={quizAnswer === option}
                          onChange={(e) => setQuizAnswer(e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {!showResult ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={!quizAnswer}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <div className={`p-4 rounded-lg ${
                    quizAnswer === selectedSign.meaning 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      quizAnswer === selectedSign.meaning ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {quizAnswer === selectedSign.meaning ? 'Correct!' : 'Incorrect'}
                    </p>
                    {quizAnswer !== selectedSign.meaning && (
                      <p className="text-red-700 mt-1">
                        The correct answer is: {selectedSign.meaning}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadSignBlock;