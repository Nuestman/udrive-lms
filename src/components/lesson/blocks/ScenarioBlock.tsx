import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  consequence?: string;
}

interface ScenarioBlockProps {
  content: {
    title?: string;
    description?: string;
    scenarioType?: 'intersection' | 'highway' | 'parking' | 'weather' | 'emergency';
    imageUrl?: string;
    options?: ScenarioOption[];
    explanation?: string;
  };
  onChange?: (content: any) => void;
  readOnly?: boolean;
}

const SCENARIO_TEMPLATES = {
  intersection: {
    title: 'Four-Way Intersection',
    description: 'You approach a four-way intersection with a stop sign. There are other vehicles present.',
    imageUrl: 'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    options: [
      {
        id: '1',
        text: 'Stop completely and proceed when safe',
        isCorrect: true,
        feedback: 'Correct! Always come to a complete stop and check for other traffic.',
        consequence: 'You safely navigate the intersection.'
      },
      {
        id: '2',
        text: 'Slow down and roll through if no one is coming',
        isCorrect: false,
        feedback: 'Incorrect. You must come to a complete stop at a stop sign.',
        consequence: 'You risk a traffic violation and potential accident.'
      },
      {
        id: '3',
        text: 'Honk your horn and proceed quickly',
        isCorrect: false,
        feedback: 'Incorrect. This is dangerous and not the proper procedure.',
        consequence: 'You create a dangerous situation for all drivers.'
      }
    ]
  },
  highway: {
    title: 'Highway Merging',
    description: 'You need to merge onto a busy highway from an on-ramp.',
    imageUrl: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    options: [
      {
        id: '1',
        text: 'Accelerate to match traffic speed and find a safe gap',
        isCorrect: true,
        feedback: 'Correct! Match the speed of traffic and merge when safe.',
        consequence: 'You successfully merge into traffic flow.'
      },
      {
        id: '2',
        text: 'Drive slowly and force your way in',
        isCorrect: false,
        feedback: 'Incorrect. This creates dangerous speed differences.',
        consequence: 'You disrupt traffic flow and increase accident risk.'
      },
      {
        id: '3',
        text: 'Stop at the end of the ramp and wait',
        isCorrect: false,
        feedback: 'Incorrect. Stopping on the ramp is dangerous.',
        consequence: 'You create a hazard for vehicles behind you.'
      }
    ]
  },
  parking: {
    title: 'Parallel Parking',
    description: 'You need to parallel park between two cars on a busy street.',
    imageUrl: 'https://images.pexels.com/photos/63294/pexels-photo-63294.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=2',
    options: [
      {
        id: '1',
        text: 'Signal, check mirrors, and execute the parking maneuver slowly',
        isCorrect: true,
        feedback: 'Correct! Take your time and use proper signaling.',
        consequence: 'You successfully park without blocking traffic.'
      },
      {
        id: '2',
        text: 'Quickly swing into the space to avoid holding up traffic',
        isCorrect: false,
        feedback: 'Incorrect. Rushing increases the chance of hitting other cars.',
        consequence: 'You risk damaging vehicles and creating a bigger delay.'
      },
      {
        id: '3',
        text: 'Give up and find an easier parking spot',
        isCorrect: false,
        feedback: 'While not dangerous, this doesn\'t help you learn the skill.',
        consequence: 'You miss the opportunity to practice an important skill.'
      }
    ]
  }
};

const ScenarioBlock: React.FC<ScenarioBlockProps> = ({
  content,
  onChange,
  readOnly = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const currentScenario = content.scenarioType && SCENARIO_TEMPLATES[content.scenarioType] 
    ? { ...SCENARIO_TEMPLATES[content.scenarioType], ...content }
    : content;

  const handleScenarioTypeChange = (type: string) => {
    const template = SCENARIO_TEMPLATES[type];
    onChange?.({
      ...content,
      scenarioType: type,
      ...template
    });
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleRestart = () => {
    setSelectedOption(null);
    setShowResult(false);
    setHasStarted(false);
  };

  const selectedOptionData = currentScenario.options?.find(opt => opt.id === selectedOption);

  if (!readOnly && !content.scenarioType) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Driving Scenario</h3>
        <p className="text-gray-600 mb-4">Choose a scenario type to create an interactive driving situation:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(SCENARIO_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleScenarioTypeChange(key)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <img
                src={template.imageUrl}
                alt={template.title}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
              <h4 className="font-medium text-gray-900">{template.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!hasStarted && !readOnly) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="relative">
          <img
            src={currentScenario.imageUrl}
            alt={currentScenario.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <button
              onClick={() => setHasStarted(true)}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Scenario
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentScenario.title}</h3>
          <p className="text-gray-700">{currentScenario.description}</p>
          
          {!readOnly && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => onChange?.({ ...content, scenarioType: undefined })}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Change Scenario Type
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{currentScenario.title}</h3>
          {!readOnly && showResult && (
            <button
              onClick={handleRestart}
              className="flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Try Again
            </button>
          )}
        </div>
      </div>

      {/* Scenario Image */}
      <div className="relative">
        <img
          src={currentScenario.imageUrl}
          alt={currentScenario.title}
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Situation</h4>
          <p className="text-gray-700">{currentScenario.description}</p>
        </div>

        {!showResult ? (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">What should you do?</h4>
            
            <div className="space-y-3">
              {currentScenario.options?.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    selectedOption === option.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 ${
                      selectedOption === option.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedOption === option.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="text-gray-900">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedOption && (
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Answer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result */}
            <div className={`p-4 rounded-lg border ${
              selectedOptionData?.isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                {selectedOptionData?.isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                )}
                <div>
                  <h5 className={`font-medium ${
                    selectedOptionData?.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {selectedOptionData?.isCorrect ? 'Correct!' : 'Incorrect'}
                  </h5>
                  <p className={`mt-1 ${
                    selectedOptionData?.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedOptionData?.feedback}
                  </p>
                </div>
              </div>
            </div>

            {/* Consequence */}
            {selectedOptionData?.consequence && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800">Consequence</h5>
                    <p className="text-blue-700 mt-1">{selectedOptionData.consequence}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            {currentScenario.explanation && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Key Learning Points</h5>
                <p className="text-gray-700">{currentScenario.explanation}</p>
              </div>
            )}

            {/* Show all options with correct answers */}
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900">All Options:</h5>
              {currentScenario.options?.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border ${
                    option.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start">
                    {option.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      option.isCorrect ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {option.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioBlock;