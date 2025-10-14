// Instructor Activity Chart
import React from 'react';
import { TrendingUp } from 'lucide-react';

interface InstructorActivityChartProps {
  activity: any[];
  loading: boolean;
}

const InstructorActivityChart: React.FC<InstructorActivityChartProps> = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64 text-gray-500">
          No activity data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...activity.map(a => parseInt(a.new_instructors) || 0));
  const maxHeight = 200;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Instructor Registrations (Last 30 Days)</h3>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {activity.reduce((sum, a) => sum + (parseInt(a.new_instructors) || 0), 0)} new instructors
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-64">
        {activity.map((item, index) => {
          const height = maxValue > 0 ? (parseInt(item.new_instructors) / maxValue) * maxHeight : 0;
          const date = new Date(item.date);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center group relative">
              <div className="w-full flex flex-col items-center">
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                  <div className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-gray-300">New: {item.new_instructors}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>

                <div className="w-full flex flex-col-reverse" style={{ height: `${maxHeight}px` }}>
                  {parseInt(item.new_instructors) > 0 && (
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 group-hover:bg-blue-600"
                      style={{ height: `${height}px` }}
                    ></div>
                  )}
                </div>
              </div>

              {(index % 5 === 0) && (
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {date.getDate()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstructorActivityChart;

