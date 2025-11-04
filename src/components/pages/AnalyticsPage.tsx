import React from 'react';
import PageLayout from '../ui/PageLayout';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Calendar, Building2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../lib/api';
import { useAnalytics, useRecentActivity } from '../../hooks/useAnalytics';

interface AnalyticsPageProps {
  role: 'super_admin' | 'school_admin' | 'instructor';
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ role }) => {
  const breadcrumbs = [
    { label: 'Analytics' }
  ];

  const { stats, loading: statsLoading } = useAnalytics();
  const [activityLimit, setActivityLimit] = React.useState(10);
  const { activities, loading: activityLoading } = useRecentActivity(activityLimit);
  const [trends, setTrends] = React.useState<Array<{
    label: string;
    enrollments: number;
    completions: number;
  }>>([]);
  const [coursePerf, setCoursePerf] = React.useState<Array<{
    name: string;
    enrollments: number;
    completions: number;
    avgProgress: number;
    completionRate: number;
  }>>([]);
  const [schoolStats, setSchoolStats] = React.useState<{
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
    newSchoolsThisMonth: number;
  } | null>(null);
  const [schoolPerf, setSchoolPerf] = React.useState<Array<{
    schoolName: string;
    totalStudents: number;
    totalCourses: number;
    totalEnrollments: number;
    completionRate: number;
    avgProgress: number;
  }>>([]);
  const [chartsLoading, setChartsLoading] = React.useState(true);
  const [interval, setInterval] = React.useState<'day' | 'week' | 'month'>('week');
  const [periods, setPeriods] = React.useState<number>(12);
  const [courseLimit, setCourseLimit] = React.useState<number>(10);

  const downloadCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return /[",\n]/.test(str) ? `"${str}"` : str;
    };
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => escape(r[h])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    let isMounted = true;
    const fetchCharts = async () => {
      try {
        setChartsLoading(true);
        console.log('Fetching chart data...');
        
        // Base API calls for all users
        const trendsRes = await api.get<{ success: boolean; data: Array<{ periodStart: string; enrollments: number; completions: number }> }>(`/analytics/enrollment-trends?interval=${interval}&periods=${periods}`);
        const perfRes = await api.get<{ success: boolean; data: Array<{ courseTitle: string; enrollments: number; completions: number; averageProgress: number; completionRate: number }> }>(`/analytics/course-performance?limit=${courseLimit}`);

        // School-specific API calls for super admin
        let schoolStatsRes: { success: boolean; data: { totalSchools: number; activeSchools: number; inactiveSchools: number; newSchoolsThisMonth: number } } | null = null;
        let schoolPerfRes: { success: boolean; data: Array<{ schoolName: string; totalStudents: number; totalCourses: number; totalEnrollments: number; completionRate: number; avgProgress: number }> } | null = null;
        
        if (role === 'super_admin') {
          schoolStatsRes = await api.get<{ success: boolean; data: { totalSchools: number; activeSchools: number; inactiveSchools: number; newSchoolsThisMonth: number } }>('/analytics/school-stats');
          schoolPerfRes = await api.get<{ success: boolean; data: Array<{ schoolName: string; totalStudents: number; totalCourses: number; totalEnrollments: number; completionRate: number; avgProgress: number }> }>(`/analytics/school-performance?limit=${courseLimit}`);
        }
        
        console.log('Trends response:', trendsRes);
        console.log('Performance response:', perfRes);
        if (role === 'super_admin') {
          console.log('School stats response:', schoolStatsRes);
          console.log('School performance response:', schoolPerfRes);
        }
        
        if (isMounted) {
          const t = trendsRes.success ? trendsRes.data : [];
          const p = perfRes.success ? perfRes.data : [];
          
          console.log('Trends data:', t);
          console.log('Performance data:', p);
          
          // Transform trends data
          const transformedTrends = t.length > 0 ? t.map(item => ({
            label: new Date(item.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            enrollments: item.enrollments,
            completions: item.completions
          })) : [];
          
          // Transform performance data
          const transformedPerf = p.length > 0 ? p.map(item => ({
            name: item.courseTitle,
            enrollments: item.enrollments,
            completions: item.completions,
            avgProgress: item.averageProgress,
            completionRate: item.completionRate
          })) : [];
          
          setTrends(transformedTrends);
          setCoursePerf(transformedPerf);

          // Handle school data for super admin
          if (role === 'super_admin' && schoolStatsRes && schoolPerfRes) {
            const schoolStatsData = schoolStatsRes.success ? schoolStatsRes.data : null;
            const schoolPerfData = schoolPerfRes.success ? schoolPerfRes.data : [];
            
            setSchoolStats(schoolStatsData);
            setSchoolPerf(schoolPerfData.map((item: { schoolName: string; totalStudents: number; totalCourses: number; totalEnrollments: number; completionRate: number; avgProgress: number }) => ({
              schoolName: item.schoolName,
              totalStudents: item.totalStudents,
              totalCourses: item.totalCourses,
              totalEnrollments: item.totalEnrollments,
              completionRate: item.completionRate,
              avgProgress: item.avgProgress
            })));
          }
          
          console.log('Transformed trends:', transformedTrends);
          console.log('Transformed performance:', transformedPerf);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Set empty arrays on error to prevent chart rendering issues
        if (isMounted) {
          setTrends([]);
          setCoursePerf([]);
          if (role === 'super_admin') {
            setSchoolStats(null);
            setSchoolPerf([]);
          }
        }
      } finally {
        if (isMounted) setChartsLoading(false);
      }
    };
    fetchCharts();
    return () => { isMounted = false; };
  }, [interval, periods, courseLimit, role]);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getTitle = () => {
    switch (role) {
      case 'super_admin':
        return 'Platform Analytics';
      case 'school_admin':
        return 'School Analytics';
      case 'instructor':
        return 'My Analytics';
      default:
        return 'Analytics';
    }
  };

  const getDescription = () => {
    switch (role) {
      case 'super_admin':
        return 'Monitor platform-wide performance and usage metrics';
      case 'school_admin':
        return 'Track school performance, student progress, and course effectiveness';
      case 'instructor':
        return 'View your course performance and student progress';
      default:
        return 'Analytics and reporting dashboard';
    }
  };

  return (
    <PageLayout
      title={getTitle()}
      description={getDescription()}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${role === 'super_admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : stats?.totalStudents ?? '—'}</p>
                <p className="text-sm text-green-600">{statsLoading ? '' : `${stats?.newStudentsThisMonth ?? 0} new this month`}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : stats?.publishedCourses ?? '—'}</p>
                <p className="text-sm text-gray-600">{statsLoading ? '' : `Drafts: ${stats?.draftCourses ?? 0}`}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates Issued</p>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : stats?.certificatesIssued ?? '—'}</p>
                <p className="text-sm text-gray-600">{statsLoading ? '' : `${stats?.monthlyCertificates ?? 0} this month`}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="w-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Progress</p>
                <p className="text-2xl font-bold text-gray-900">{statsLoading ? '…' : `${stats?.averageProgress ?? 0}%`}</p>
                <p className="text-sm text-gray-600">{statsLoading ? '' : `Completion rate: ${stats?.completionRate ?? 0}%`}</p>
              </div>
            </div>
          </div>

          {/* School Metrics - Super Admin Only */}
          {role === 'super_admin' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-accent-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Schools</p>
                  <p className="text-2xl font-bold text-gray-900">{chartsLoading ? '…' : schoolStats?.totalSchools ?? '—'}</p>
                  <p className="text-sm text-green-600">{chartsLoading ? '' : `${schoolStats?.activeSchools ?? 0} active`}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrollment Trends</h3>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as 'day' | 'week' | 'month')}
                  aria-label="Interval"
                  title="Interval"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
                <select
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                  value={periods}
                  onChange={(e) => setPeriods(parseInt(e.target.value) || 12)}
                  aria-label="Periods"
                  title="Periods"
                >
                  <option value={8}>Last 8</option>
                  <option value={12}>Last 12</option>
                  <option value={24}>Last 24</option>
                </select>
                <button
                  className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => downloadCSV(trends.map(t => ({ label: t.label, enrollments: t.enrollments, completions: t.completions })), 'enrollment_trends.csv')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : trends.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No enrollment data available</p>
                  <p className="text-gray-400 text-sm">Data will appear once students enroll in courses</p>
                </div>
              </div>
            ) : (
              <div className="h-64 min-h-[256px] min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={256}>
                  <LineChart data={trends} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#B98C1B" strokeWidth={2} dot={false} name="Enrollments" />
                    {/* <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} dot={false} name="Completions" /> */}
                    <Line type="monotone" dataKey="completions" stroke="#150F00" strokeWidth={2} dot={false} name="Completions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                  value={courseLimit}
                  onChange={(e) => setCourseLimit(parseInt(e.target.value) || 10)}
                  aria-label="Course limit"
                  title="Course limit"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
                <button
                  className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => downloadCSV(coursePerf.map(c => ({ name: c.name, enrollments: c.enrollments, completions: c.completions, avgProgress: c.avgProgress, completionRate: c.completionRate })), 'course_performance.csv')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : coursePerf.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No course performance data available</p>
                  <p className="text-gray-400 text-sm">Data will appear once courses have enrollments</p>
                </div>
              </div>
            ) : (
              <div className="h-64 min-h-[256px] min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={256}>
                  <BarChart data={coursePerf} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide={coursePerf.length > 6} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrollments" fill="#B98C1B" name="Enrollments" />
                    <Bar dataKey="completions" fill="#150F00" name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* School Performance Chart - Super Admin Only */}
        {role === 'super_admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">School Performance</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={courseLimit}
                  onChange={(e) => setCourseLimit(parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  aria-label="Select number of schools to display"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={15}>Top 15</option>
                </select>
                <button
                  className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => downloadCSV(schoolPerf, 'school_performance.csv')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : schoolPerf.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No school performance data available</p>
                  <p className="text-gray-400 text-sm">Data will appear once schools have students and courses</p>
                </div>
              </div>
            ) : (
              <div className="h-64 min-h-[256px] min-w-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={256}>
                  <BarChart data={schoolPerf} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="schoolName" hide={schoolPerf.length > 6} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalStudents" fill="#B98C1B" name="Students" />
                    <Bar dataKey="totalEnrollments" fill="#10b981" name="Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-300 rounded-md text-sm px-2 py-1"
                value={activityLimit}
                onChange={(e) => setActivityLimit(parseInt(e.target.value) || 10)}
                aria-label="Activity limit"
                title="Activity limit"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <button
                className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => downloadCSV((activities || []).map((a: { type: string; description: string; timestamp: string }) => ({ type: a.type, description: a.description, timestamp: a.timestamp })), 'recent_activity.csv')}
              >
                Export CSV
              </button>
            </div>
          </div>
          {activityLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.map((activity: { type: string; description: string; timestamp: string }, index: number) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Calendar className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.type}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default AnalyticsPage;