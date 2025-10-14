// Instructor Performance Chart
import React from 'react';
import { Award } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        <Award className="w-5 h-5 text-orange-600" />
      </div>

      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalCourses}</div>
            <div className="text-xs text-gray-500">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
            <div className="text-xs text-gray-500">Total Students</div>
          </div>
        </div>

        {/* Top Instructors Bars */}
        <div className="space-y-3">
          {topInstructors.map((instructor, index) => {
            const maxStudents = Math.max(...topInstructors.map(i => parseInt(i.total_students) || 0));
            const percentage = maxStudents > 0 ? (parseInt(instructor.total_students) / maxStudents) * 100 : 0;
            
            return (
              <div key={instructor.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {instructor.first_name} {instructor.last_name}
                  </span>
                  <span className="text-gray-500">{instructor.total_students} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Average Progress */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg Student Progress</span>
            <span className="text-lg font-semibold text-gray-900">
              {topInstructors.length > 0 
                ? Math.round(topInstructors.reduce((sum, i) => sum + (parseInt(i.avg_student_progress) || 0), 0) / topInstructors.length)
                : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorPerformanceChart;

