import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  Award, 
  BookOpen,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Zap
} from 'lucide-react';
import CreateGoalModal from './CreateGoalModal';
import api from '../../lib/api';

interface ProgressData {
  courseId: string;
  courseName: string;
  overallProgress: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastActivity: string;
  streak: number;
  achievements: Achievement[];
  weeklyProgress: { week: string; progress: number }[];
  skillProgress: { skill: string; level: number; maxLevel: number }[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'progress' | 'performance' | 'engagement' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  currentProgress: number;
  targetValue: number;
  type: 'completion' | 'score' | 'time' | 'streak';
  status: 'active' | 'completed' | 'overdue';
}

interface ProgressTrackingProps {
  studentId: string;
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({ studentId }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'achievements' | 'goals'>('overview');
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [realGoals, setRealGoals] = useState<any[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);

  const [progressData] = useState<ProgressData[]>([
    {
      courseId: '1',
      courseName: 'Basic Driving Course',
      overallProgress: 75,
      lessonsCompleted: 12,
      totalLessons: 16,
      quizzesCompleted: 8,
      totalQuizzes: 10,
      averageScore: 87,
      timeSpent: 1440, // 24 hours
      lastActivity: '2024-03-15',
      streak: 7,
      achievements: [],
      weeklyProgress: [
        { week: 'Week 1', progress: 20 },
        { week: 'Week 2', progress: 35 },
        { week: 'Week 3', progress: 55 },
        { week: 'Week 4', progress: 75 }
      ],
      skillProgress: [
        { skill: 'Parking', level: 8, maxLevel: 10 },
        { skill: 'Highway Driving', level: 6, maxLevel: 10 },
        { skill: 'Traffic Laws', level: 9, maxLevel: 10 },
        { skill: 'Defensive Driving', level: 7, maxLevel: 10 }
      ]
    },
    {
      courseId: '2',
      courseName: 'Traffic Laws Review',
      overallProgress: 45,
      lessonsCompleted: 9,
      totalLessons: 20,
      quizzesCompleted: 4,
      totalQuizzes: 8,
      averageScore: 92,
      timeSpent: 900, // 15 hours
      lastActivity: '2024-03-12',
      streak: 3,
      achievements: [],
      weeklyProgress: [
        { week: 'Week 1', progress: 15 },
        { week: 'Week 2', progress: 25 },
        { week: 'Week 3', progress: 35 },
        { week: 'Week 4', progress: 45 }
      ],
      skillProgress: [
        { skill: 'Road Signs', level: 9, maxLevel: 10 },
        { skill: 'Right of Way', level: 7, maxLevel: 10 },
        { skill: 'Speed Limits', level: 8, maxLevel: 10 },
        { skill: 'Intersections', level: 6, maxLevel: 10 }
      ]
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Steps',
      description: 'Completed your first lesson',
      icon: '👶',
      earnedDate: '2024-01-15',
      category: 'progress',
      rarity: 'common'
    },
    {
      id: '2',
      title: 'Perfect Score',
      description: 'Scored 100% on a quiz',
      icon: '💯',
      earnedDate: '2024-02-01',
      category: 'performance',
      rarity: 'rare'
    },
    {
      id: '3',
      title: 'Speed Demon',
      description: 'Completed 5 lessons in one day',
      icon: '⚡',
      earnedDate: '2024-02-15',
      category: 'engagement',
      rarity: 'epic'
    },
    {
      id: '4',
      title: 'Course Master',
      description: 'Completed your first course',
      icon: '🎓',
      earnedDate: '2024-03-01',
      category: 'milestone',
      rarity: 'legendary'
    }
  ]);

  // Fetch real goals from API
  const fetchGoals = async () => {
    try {
      setLoadingGoals(true);
      const response = await api.get('/goals');
      if (response.success) {
        setRealGoals(response.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'goals') {
      fetchGoals();
    }
  }, [activeTab]);

  const handleGoalCreated = () => {
    fetchGoals(); // Refresh goals after creation
  };

  const totalProgress = Math.round(
    progressData.reduce((acc, course) => acc + course.overallProgress, 0) / progressData.length
  );

  const totalTimeSpent = progressData.reduce((acc, course) => acc + course.timeSpent, 0);
  const totalLessonsCompleted = progressData.reduce((acc, course) => acc + course.lessonsCompleted, 0);
  const averageScore = Math.round(
    progressData.reduce((acc, course) => acc + course.averageScore, 0) / progressData.length
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50';
      case 'rare':
        return 'border-blue-300 bg-blue-50';
      case 'epic':
        return 'border-purple-300 bg-purple-50';
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalProgress}%</p>
              <p className="text-sm text-green-600">+5% this week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{totalLessonsCompleted}</p>
              <p className="text-sm text-gray-500">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              <p className="text-sm text-green-600">Above target</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalTimeSpent / 60)}h</p>
              <p className="text-sm text-gray-500">Total learning time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress Over Time</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Progress chart visualization</p>
          </div>
        </div>
      </div>

      {/* Study Streak */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Study Streak</h3>
            <p className="text-gray-600">Keep up the great work!</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 flex items-center">
              <Zap className="w-8 h-8 mr-2" />
              7
            </div>
            <p className="text-sm text-gray-500">Days in a row</p>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 h-2 bg-orange-500 rounded"></div>
          ))}
          {[...Array(3)].map((_, i) => (
            <div key={i + 7} className="flex-1 h-2 bg-gray-200 rounded"></div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Study for 3 more days to reach your 10-day goal!
        </p>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      {progressData.map((course) => (
        <div key={course.courseId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{course.courseName}</h3>
            <span className="text-2xl font-bold text-primary-600">{course.overallProgress}%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{course.lessonsCompleted}/{course.totalLessons}</div>
              <div className="text-sm text-gray-500">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{course.quizzesCompleted}/{course.totalQuizzes}</div>
              <div className="text-sm text-gray-500">Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{course.averageScore}%</div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{Math.round(course.timeSpent / 60)}h</div>
              <div className="text-sm text-gray-500">Time Spent</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Course Progress</span>
              <span>{course.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${course.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Skill Progress */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Skill Development</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.skillProgress.map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{skill.skill}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{skill.level}/{skill.maxLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => (
          <div key={achievement.id} className={`rounded-lg border-2 p-6 ${getRarityColor(achievement.rarity)}`}>
            <div className="text-center">
              <div className="text-4xl mb-3">{achievement.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{achievement.category}</span>
                <span>{new Date(achievement.earnedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
            <div className="text-sm text-gray-500">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {achievements.filter(a => a.rarity === 'legendary').length}
            </div>
            <div className="text-sm text-gray-500">Legendary</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {achievements.filter(a => a.rarity === 'epic').length}
            </div>
            <div className="text-sm text-gray-500">Epic</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {achievements.filter(a => a.rarity === 'rare').length}
            </div>
            <div className="text-sm text-gray-500">Rare</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => {
    const goalsToDisplay = realGoals.length > 0 ? realGoals : [];

    return (
    <div className="space-y-6">
      {loadingGoals ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading goals...</p>
        </div>
      ) : goalsToDisplay.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600 mb-6">Create your first learning goal to stay motivated!</p>
          <button 
            onClick={() => setShowCreateGoalModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
          >
            <Target className="w-5 h-5 mr-2" />
            Create Your First Goal
          </button>
        </div>
      ) : (
        <>
          {goalsToDisplay.map((goal) => {
            const progress = goal.progress_percentage || 0;
            const daysRemaining = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysRemaining < 0 && goal.status !== 'completed';
            const displayStatus = isOverdue ? 'overdue' : goal.status;

            return (
            <div key={goal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-gray-600 text-sm">{goal.description}</p>
                  )}
                  {goal.course_title && (
                    <p className="text-sm text-primary-600 mt-1">📚 {goal.course_title}</p>
                  )}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGoalStatusColor(displayStatus)}`}>
                  {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      goal.status === 'completed' ? 'bg-green-500' : 
                      isOverdue ? 'bg-red-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Target: {new Date(goal.target_date).toLocaleDateString()}
                </span>
                <span className={daysRemaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                  {daysRemaining < 0 
                    ? `${Math.abs(daysRemaining)} days overdue` 
                    : `${daysRemaining} days remaining`}
                </span>
              </div>
            </div>
          );
        })}
        </>
      )}


      {/* Add New Goal */}
      {goalsToDisplay.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 text-center">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="font-medium text-gray-900 mb-1">Set a New Goal</h3>
          <p className="text-gray-500 text-sm mb-4">Create a personal learning goal to stay motivated</p>
          <button 
            onClick={() => setShowCreateGoalModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
          >
            <Target className="w-4 h-4 mr-2" />
            Create Goal
          </button>
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        onSuccess={handleGoalCreated}
      />
    </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600">Monitor your learning journey and achievements</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
            { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
            { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" /> },
            { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'courses' && renderCourses()}
      {activeTab === 'achievements' && renderAchievements()}
      {activeTab === 'goals' && renderGoals()}
    </div>
  );
};

export default ProgressTracking;