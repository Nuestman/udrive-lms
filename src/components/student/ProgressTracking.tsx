import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BookOpen,
  CheckCircle,
  BarChart3,
  Activity,
  Star,
  Zap
} from 'lucide-react';
import CreateGoalModal from './CreateGoalModal';
import { useProgress } from '../../hooks/useProgress';
import { useEnrollments } from '../../hooks/useEnrollments';
import { useStudentAnalytics } from '../../hooks/useStudentAnalytics';
import api from '../../lib/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'progress' | 'performance' | 'engagement' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ProgressTrackingProps {
  studentId: string;
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({ studentId }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'semester'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'achievements' | 'goals'>('overview');
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [realGoals, setRealGoals] = useState<unknown[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  // Memoize the filters object to prevent infinite re-renders
  const enrollmentFilters = useMemo(() => ({ student_id: studentId }), [studentId]);

  // Fetch real data using hooks
  const { loading: progressLoading, error: progressError } = useProgress(studentId);
  const { enrollments, loading: enrollmentsLoading, error: enrollmentsError } = useEnrollments(enrollmentFilters);
  const { analytics, loading: analyticsLoading } = useStudentAnalytics(studentId);

  // Fetch real goals from API
  const fetchGoals = async () => {
    try {
      setLoadingGoals(true);
      setGoalsError(null);
      const response = await api.get('/goals');
      if (response.success) {
        setRealGoals(response.data);
      } else {
        setGoalsError('Failed to load goals');
      }
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      setGoalsError(error.message || 'Failed to load goals');
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

  const renderOverview = () => {
    if (progressLoading || enrollmentsLoading || analyticsLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Show error state if there's a critical error
    if (progressError || enrollmentsError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <Activity className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Error loading progress data</p>
          </div>
          <p className="text-red-700 text-sm mb-4">
            {progressError?.message || enrollmentsError?.message || 'Failed to load progress information'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    // Calculate metrics from real data
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'active').length;
    const totalProgress = totalCourses > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / totalCourses)
      : 0;
    
    const totalLessonsCompleted = enrollments.reduce((sum, e) => sum + parseInt(e.completed_lessons || '0'), 0);
    const totalLessons = enrollments.reduce((sum, e) => sum + parseInt(e.total_lessons || '0'), 0);
    
    // Get analytics data
    const averageScore = analytics?.averageScore || 0;
    const currentStreak = analytics?.currentStreak || 0;
    const weeklyProgress = analytics?.weeklyProgress || [];

    return (
    <div className="space-y-6">
      {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalProgress}%</p>
                <p className="text-sm text-green-600">{activeCourses} active courses</p>
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
                <p className="text-sm text-gray-500">of {totalLessons} total</p>
                {totalLessons === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No lessons available in enrolled courses</p>
                )}
              </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
                <p className="text-sm text-gray-500">of {totalCourses} enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">{currentStreak}</p>
                <p className="text-sm text-gray-500">days in a row</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
                <p className="text-sm text-gray-500">across all quizzes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress Over Time</h3>
          {weeklyProgress.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {weeklyProgress.slice(0, 8).map((week, index) => {
                const maxLessons = Math.max(...weeklyProgress.map(w => w.lessonsCompleted), 1);
                const height = (week.lessonsCompleted / maxLessons) * 200;
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-primary-500 rounded-t w-full min-h-[4px] transition-all duration-500"
                      style={{ height: `${height}px` }}
                      title={`Week ${index + 1}: ${week.lessonsCompleted} lessons, ${week.quizzesCompleted} quizzes`}
                    />
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {week.lessonsCompleted}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No progress data available yet</p>
                <p className="text-gray-400 text-sm">Complete some lessons to see your progress chart</p>
              </div>
          </div>
          )}
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
                {currentStreak}
            </div>
            <p className="text-sm text-gray-500">Days in a row</p>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
            {[...Array(Math.min(currentStreak, 10))].map((_, i) => (
            <div key={i} className="flex-1 h-2 bg-orange-500 rounded"></div>
          ))}
            {[...Array(Math.max(0, 10 - currentStreak))].map((_, i) => (
              <div key={i + currentStreak} className="flex-1 h-2 bg-gray-200 rounded"></div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
            {currentStreak >= 10 
              ? "Amazing! You've reached your 10-day goal!" 
              : `Study for ${10 - currentStreak} more days to reach your 10-day goal!`
            }
        </p>
      </div>
    </div>
  );
  };

  const renderCourses = () => {
    if (enrollmentsLoading) {
      return (
    <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="text-center">
                    <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (enrollmentsError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">Error loading courses</p>
          </div>
          <p className="text-red-700 text-sm mb-4">{enrollmentsError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    if (enrollments.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses enrolled</h3>
          <p className="text-gray-600">You haven't enrolled in any courses yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Info message if no content is available */}
        {enrollments.length > 0 && enrollments.every(e => 
          parseInt(e.total_lessons || '0') === 0 && parseInt(e.total_quizzes || '0') === 0
        ) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Course Content Coming Soon</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your enrolled courses don't have lessons or quizzes yet. Instructors are working on adding content.</p>
                  <p className="mt-1">Course progress is calculated based on available content, so you'll see detailed metrics once lessons and quizzes are added.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{enrollment.course_title}</h3>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  enrollment.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : enrollment.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {enrollment.status}
                </span>
                <span className="text-2xl font-bold text-primary-600">{enrollment.progress_percentage || 0}%</span>
              </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {parseInt(enrollment.completed_lessons || '0')}/{parseInt(enrollment.total_lessons || '0')}
                </div>
                <div className="text-sm text-gray-500">Lessons</div>
                {parseInt(enrollment.total_lessons || '0') === 0 && (
                  <div className="text-xs text-orange-600 mt-1">No lessons available</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {parseInt(enrollment.completed_quizzes || '0')}/{parseInt(enrollment.total_quizzes || '0')}
                </div>
                <div className="text-sm text-gray-500">Quizzes</div>
                {parseInt(enrollment.total_quizzes || '0') === 0 && (
                  <div className="text-xs text-orange-600 mt-1">No quizzes available</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {enrollment.average_score ? `${Math.round(parseFloat(enrollment.average_score))}%` : '-'}
                </div>
                <div className="text-sm text-gray-500">Avg Score</div>
                {!enrollment.average_score && (
                  <div className="text-xs text-orange-600 mt-1">No quiz attempts</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {enrollment.time_spent_minutes ? `${Math.round(parseFloat(enrollment.time_spent_minutes))}m` : '-'}
                </div>
                <div className="text-sm text-gray-500">Time Spent</div>
                {!enrollment.time_spent_minutes && (
                  <div className="text-xs text-orange-600 mt-1">No time recorded</div>
                )}
              </div>
            </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Course Progress</span>
                <span>{enrollment.progress_percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    enrollment.status === 'completed' ? 'bg-green-500' : 'bg-primary-600'
                  }`}
                  style={{ width: `${enrollment.progress_percentage || 0}%` }}
              />
            </div>
          </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
              {enrollment.updated_at && (
                <span>Last activity: {new Date(enrollment.updated_at).toLocaleDateString()}</span>
              )}
          </div>
        </div>
      ))}
    </div>
  );
  };

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Achievement System Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          We're working on an exciting achievement system to reward your learning progress. 
          Stay tuned for badges, milestones, and special recognition!
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Planned Features:</strong><br />
            • Course completion badges<br />
            • Perfect quiz scores<br />
            • Study streak rewards<br />
            • Learning milestones
          </p>
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
        ) : goalsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Error loading goals</p>
            </div>
            <p className="text-red-700 text-sm mb-4">{goalsError}</p>
            <button 
              onClick={fetchGoals}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
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
          {goalsToDisplay.map((goal: unknown) => {
            const progress = (goal as any).progress_percentage || 0;
            const daysRemaining = Math.ceil((new Date((goal as any).target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysRemaining < 0 && (goal as any).status !== 'completed';
            const displayStatus = isOverdue ? 'overdue' : (goal as any).status;

            return (
            <div key={(goal as any).id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{(goal as any).title}</h3>
                  {(goal as any).description && (
                    <p className="text-gray-600 text-sm">{(goal as any).description}</p>
                  )}
                  {(goal as any).course_title && (
                    <p className="text-sm text-primary-600 mt-1">📚 {(goal as any).course_title}</p>
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
                      (goal as any).status === 'completed' ? 'bg-green-500' : 
                      isOverdue ? 'bg-red-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Target: {new Date((goal as any).target_date).toLocaleDateString()}
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
            aria-label="Select timeframe"
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