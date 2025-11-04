import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar, 
  Play, 
  CheckCircle,
  Target,
  Bell,
  MessageCircle,
  Download,
  Star,
  BarChart3
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
  dueDate: string;
  instructor: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  type: 'quiz' | 'assignment' | 'exam';
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'progress' | 'performance' | 'engagement';
}

const StudentDashboard: React.FC = () => {
  const [enrolledCourses] = useState<Course[]>([
    {
      id: '1',
      title: 'Basic Driving Course',
      progress: 75,
      nextLesson: 'Parallel Parking Techniques',
      dueDate: '2024-03-20',
      instructor: 'John Smith',
      thumbnail: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=2',
      totalLessons: 16,
      completedLessons: 12,
      estimatedTime: '2 hours'
    },
    {
      id: '2',
      title: 'Traffic Laws Review',
      progress: 45,
      nextLesson: 'Right of Way Rules',
      dueDate: '2024-03-25',
      instructor: 'Sarah Wilson',
      thumbnail: 'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=2',
      totalLessons: 20,
      completedLessons: 9,
      estimatedTime: '1.5 hours'
    },
    {
      id: '3',
      title: 'Defensive Driving',
      progress: 30,
      nextLesson: 'Hazard Recognition',
      dueDate: '2024-04-01',
      instructor: 'Mike Johnson',
      thumbnail: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&dpr=2',
      totalLessons: 12,
      completedLessons: 4,
      estimatedTime: '3 hours'
    }
  ]);

  const [assignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Defensive Driving Quiz',
      course: 'Basic Driving Course',
      dueDate: '2024-03-18',
      type: 'quiz',
      status: 'pending'
    },
    {
      id: '2',
      title: 'Traffic Signs Assessment',
      course: 'Traffic Laws Review',
      dueDate: '2024-03-22',
      type: 'assignment',
      status: 'submitted'
    },
    {
      id: '3',
      title: 'Final Driving Exam',
      course: 'Basic Driving Course',
      dueDate: '2024-03-30',
      type: 'exam',
      status: 'graded',
      score: 92
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Course Completed',
      description: 'Completed your first driving course',
      icon: '🎓',
      earnedDate: '2024-02-15',
      category: 'progress'
    },
    {
      id: '2',
      title: 'Perfect Quiz Score',
      description: 'Scored 100% on a quiz',
      icon: '⭐',
      earnedDate: '2024-03-01',
      category: 'performance'
    },
    {
      id: '3',
      title: '7-Day Streak',
      description: 'Studied for 7 consecutive days',
      icon: '🔥',
      earnedDate: '2024-03-10',
      category: 'engagement'
    }
  ]);

  const [notifications] = useState([
    {
      id: '1',
      message: 'New lesson available: Parallel Parking Techniques',
      time: '2 hours ago',
      type: 'lesson'
    },
    {
      id: '2',
      message: 'Quiz reminder: Defensive Driving Quiz due tomorrow',
      time: '1 day ago',
      type: 'reminder'
    },
    {
      id: '3',
      message: 'Congratulations! You earned a new achievement',
      time: '2 days ago',
      type: 'achievement'
    }
  ]);

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-primary-100 text-primary-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <CheckCircle className="w-4 h-4" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'exam':
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const totalProgress = Math.round(
    enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length
  );

  const totalCompletedLessons = enrolledCourses.reduce((acc, course) => acc + course.completedLessons, 0);
  const totalLessons = enrolledCourses.reduce((acc, course) => acc + course.totalLessons, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Sarah!</h1>
            <p className="text-primary-100 mt-1">
              You're making great progress. Keep up the excellent work!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalProgress}%</div>
            <div className="text-primary-100 text-sm">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
              <p className="text-sm text-gray-500">
                {enrolledCourses.filter(c => c.progress === 100).length} completed
              </p>
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
              <p className="text-2xl font-bold text-gray-900">{totalCompletedLessons}</p>
              <p className="text-sm text-gray-500">of {totalLessons} total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              <p className="text-sm text-gray-500">Earned this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-accent-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Study Streak</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
              <p className="text-sm text-green-600">Days in a row</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Courses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Continue Learning</h3>
          <a href="/student/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All Courses →
          </a>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                <p className="text-sm text-gray-600 mb-3">Instructor: {course.instructor}</p>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Lessons:</span>
                    <span>{course.completedLessons}/{course.totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next:</span>
                    <span className="text-primary-600">{course.nextLesson}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Est. time:</span>
                    <span>{course.estimatedTime}</span>
                  </div>
                </div>
                
                <button className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Play size={16} className="mr-2" />
                  Continue Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg mr-3">
                    {getAssignmentIcon(assignment.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                    <p className="text-sm text-gray-600">{assignment.course}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                  {assignment.score && (
                    <p className="text-xs text-green-600 font-medium">
                      Score: {assignment.score}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            View All Assignments
          </button>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl mr-3">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned: {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            View All Achievements
          </button>
        </div>
      </div>

      {/* Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="p-2 bg-primary-100 rounded-lg mr-3 mt-0.5">
                  <Bell className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            View All Notifications
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Message Instructor</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Download className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Download Materials</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <BarChart3 className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View Progress</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Calendar className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Schedule Practice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Learning Goals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-primary-900">Complete Basic Course</h4>
              <span className="text-sm text-primary-600">75%</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2 mb-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-sm text-primary-700">Target: March 30, 2024</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900">Pass All Quizzes</h4>
              <span className="text-sm text-green-600">60%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mb-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-green-700">6 of 10 completed</p>
          </div>
          
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-primary-900">Earn Certificate</h4>
              <span className="text-sm text-primary-600">25%</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2 mb-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <p className="text-sm text-primary-700">Complete all requirements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;