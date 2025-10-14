// User Activity Chart Component
import React from 'react';
import { TrendingUp } from 'lucide-react';

interface UserActivityChartProps {
  activity: any[];
  loading: boolean;
}

const UserActivityChart: React.FC<UserActivityChartProps> = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (Last 30 Days)</h3>
        <div className="flex justify-center items-center h-64 text-gray-500">
          No activity data available
        </div>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...activity.map(a => parseInt(a.new_users) || 0));
  const maxHeight = 200; // pixels

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Activity (Last 30 Days)</h3>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-green-600 font-medium">
            {activity.reduce((sum, a) => sum + (parseInt(a.new_users) || 0), 0)} new users
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-64">
        {activity.map((item, index) => {
          const height = maxValue > 0 ? (parseInt(item.new_users) / maxValue) * maxHeight : 0;
          const date = new Date(item.date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center group relative">
              {/* Bar */}
              <div className="w-full flex flex-col items-center">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                  <div className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-gray-300">Total: {item.new_users}</div>
                  <div className="text-gray-300">Students: {item.new_students}</div>
                  <div className="text-gray-300">Instructors: {item.new_instructors}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>

                {/* Bar segments */}
                <div className="w-full flex flex-col-reverse" style={{ height: `${maxHeight}px` }}>
                  {parseInt(item.new_users) > 0 && (
                    <>
                      {/* Instructors (top segment - green) */}
                      {parseInt(item.new_instructors) > 0 && (
                        <div
                          className="w-full bg-green-500 rounded-t transition-all duration-300 group-hover:bg-green-600"
                          style={{
                            height: `${(parseInt(item.new_instructors) / parseInt(item.new_users)) * height}px`
                          }}
                        ></div>
                      )}
                      
                      {/* Students (bottom segment - blue) */}
                      {parseInt(item.new_students) > 0 && (
                        <div
                          className="w-full bg-blue-500 transition-all duration-300 group-hover:bg-blue-600"
                          style={{
                            height: `${(parseInt(item.new_students) / parseInt(item.new_users)) * height}px`
                          }}
                        ></div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Date label - show every 5th day or weekends */}
              {(index % 5 === 0 || isWeekend) && (
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {date.getDate()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Students</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Instructors</span>
        </div>
      </div>
    </div>
  );
};

export default UserActivityChart;

