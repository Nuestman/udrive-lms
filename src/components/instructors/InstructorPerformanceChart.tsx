// Instructor Performance Chart with Recharts
import React from 'react';
import { Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface InstructorPerformanceChartProps {
  topInstructors: any[];
  loading: boolean;
}

const InstructorPerformanceChart: React.FC<InstructorPerformanceChartProps> = ({ topInstructors, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!topInstructors || topInstructors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="flex justify-center items-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const totalCourses = topInstructors.reduce((sum, i) => sum + (parseInt(i.courses_count) || 0), 0);
  const totalStudents = topInstructors.reduce((sum, i) => sum + (parseInt(i.total_students) || 0), 0);
  const totalCompleted = topInstructors.reduce((sum, i) => sum + (parseInt(i.completed_enrollments) || 0), 0);
  const avgProgress = topInstructors.length > 0 
    ? Math.round(topInstructors.reduce((sum, i) => sum + (parseInt(i.avg_student_progress) || 0), 0) / topInstructors.length)
    : 0;

  // Transform data for recharts
  const chartData = topInstructors.map((instructor, index) => ({
    name: `${instructor.first_name || 'Unknown'} ${instructor.last_name || 'Instructor'}`.substring(0, 12) + 
          ((instructor.first_name?.length || 0) + (instructor.last_name?.length || 0) > 12 ? '...' : ''),
    fullName: `${instructor.first_name || 'Unknown'} ${instructor.last_name || 'Instructor'}`,
    students: parseInt(instructor.total_students) || 0,
    courses: parseInt(instructor.courses_count) || 0,
    progress: parseInt(instructor.avg_student_progress) || 0
  }));

  // Debug: Log the data to see what we're working with
  console.log('InstructorPerformanceChart - topInstructors:', topInstructors);
  console.log('InstructorPerformanceChart - chartData:', chartData);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        <div className="flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-600 font-medium">
            {totalStudents} total students
          </span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto">
        {chartData.length > 0 ? (
          <div className="space-y-4 pr-2">
            {chartData.map((instructor, index) => {
              // For students and courses, use relative comparison
              const maxStudents = Math.max(...chartData.map(i => i.students));
              const maxCourses = Math.max(...chartData.map(i => i.courses));
              
              const studentsPercentage = maxStudents > 0 ? (instructor.students / maxStudents) * 100 : 0;
              const coursesPercentage = maxCourses > 0 ? (instructor.courses / maxCourses) * 100 : 0;
              // For progress, use the actual percentage value (not relative to max)
              const progressPercentage = instructor.progress;
              
              return (
                <div key={index} className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="font-semibold text-gray-900 truncate">
                      {instructor.fullName}
                    </span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-primary-600 font-medium">{instructor.students} students</span>
                      <span className="text-green-600 font-medium">{instructor.courses} courses</span>
                      <span className="text-primary-600 font-medium">{instructor.progress}% avg</span>
                    </div>
                  </div>
                  
                  {/* Multi-metric bars */}
                  <div className="space-y-2">
                    {/* Students */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Students</span>
                        <span>{instructor.students}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${studentsPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Courses */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Courses</span>
                        <span>{instructor.courses}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-200 to-primary-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${coursesPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Avg Progress</span>
                        <span>{instructor.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-200 to-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No performance data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Courses</span>
            <span className="font-semibold text-gray-900">{totalCourses}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Students</span>
            <span className="font-semibold text-gray-900">{totalStudents}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Completed</span>
            <span className="font-semibold text-gray-900">{totalCompleted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Avg Progress</span>
            <span className="font-semibold text-gray-900">{avgProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorPerformanceChart;