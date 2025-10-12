import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  Play, 
  Clock, 
  BookOpen, 
  Award,
  ChevronRight,
  Star,
  Target
} from 'lucide-react';

interface LessonItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'milestone';
  status: 'completed' | 'current' | 'locked' | 'available';
  duration?: string;
  score?: number;
  isRequired: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessons: LessonItem[];
  isUnlocked: boolean;
  estimatedTime: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  overallProgress: number;
  modules: Module[];
  prerequisites?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningPathNavigationProps {
  course: Course;
  onLessonSelect: (lessonId: string) => void;
}

const LearningPathNavigation: React.FC<LearningPathNavigationProps> = ({
  course,
  onLessonSelect
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['1']));

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getStatusIcon = (status: string, type: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Play className="w-5 h-5 text-primary-600" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      case 'available':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-4 h-4" />;
      case 'quiz':
        return <Target className="w-4 h-4" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'milestone':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'current':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'locked':
        return 'text-gray-400 bg-gray-50 border-gray-200';
      case 'available':
        return 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50';
      default:
        return 'text-gray-600 bg-white border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Course Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-3">{course.description}</p>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                {course.modules.length} modules
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{course.overallProgress}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="divide-y divide-gray-200">
        {course.modules.map((module, moduleIndex) => (
          <div key={module.id} className="p-6">
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-semibold text-sm mr-3">
                  {moduleIndex + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-600">{module.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {module.lessons.length} items
                    </span>
                    <span className="text-xs text-gray-500">
                      Est. {module.estimatedTime}
                    </span>
                    <span className="text-xs text-primary-600 font-medium">
                      {module.progress}% complete
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
                <ChevronRight 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedModules.has(module.id) ? 'rotate-90' : ''
                  }`} 
                />
              </div>
            </button>

            {/* Module Content */}
            {expandedModules.has(module.id) && (
              <div className="mt-4 ml-11 space-y-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <button
                    key={lesson.id}
                    onClick={() => lesson.status !== 'locked' && onLessonSelect(lesson.id)}
                    disabled={lesson.status === 'locked'}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${getStatusColor(lesson.status)} ${
                      lesson.status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getStatusIcon(lesson.status, lesson.type)}
                      </div>
                      <div className="flex items-center mr-3">
                        {getTypeIcon(lesson.type)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center">
                          <span className="font-medium">{lesson.title}</span>
                          {lesson.isRequired && (
                            <Star className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <span className="capitalize">{lesson.type}</span>
                          {lesson.duration && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {lesson.duration}
                            </span>
                          )}
                          {lesson.score !== undefined && (
                            <span className="text-green-600 font-medium">
                              Score: {lesson.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {lesson.status === 'current' && (
                      <div className="flex items-center text-primary-600">
                        <span className="text-sm font-medium mr-2">Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Course Completion */}
      {course.overallProgress === 100 && (
        <div className="p-6 bg-green-50 border-t border-green-200">
          <div className="flex items-center">
            <Award className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h4 className="font-semibold text-green-900">Course Completed!</h4>
              <p className="text-sm text-green-700">
                Congratulations! You've successfully completed this course.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathNavigation;