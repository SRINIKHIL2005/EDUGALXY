import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { 
  Book, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Bell, 
  AlertCircle,
  RefreshCw,
  Clock,
  BarChart3,
  PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardSummary {
  courses: number;
  attendance: number;
  feedbackPending: number;
  upcomingAssignments: number;
  averageGrade?: string;
  recentActivities?: Array<{
    id: string;
    type: 'feedback' | 'attendance' | 'assignment' | 'course';
    title: string;
    date: string;
    status?: string;
  }>;
  coursePerformance?: Array<{
    name: string;
    attendance: number;
    grade?: string | number;
  }>;
  monthlyAttendance?: Array<{
    name: string;
    attendance: number;
  }>;
}

// API configuration
import API_CONFIG from '@/config/api';

// Use API_CONFIG instead of hardcoded localhost
const API_BASE_URL = API_CONFIG.BASE_URL;

const StudentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/student/dashboard-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Prevent caching to always get fresh data
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      
      // Use the data directly from the API
      setSummary(data);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Initial data loading
  useEffect(() => {
    if (token) fetchSummary();
  }, [token, fetchSummary]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary();
  }, [fetchSummary]);

  // Calculate attendance level for UI display
  const getAttendanceLevel = (percentage: number) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    return 'poor';
  };

  // Get appropriate status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate attendance trend between months (now using memoized value)
  const getAttendanceTrend = () => attendanceTrend;

  // Helper function to check if a data section is empty
  const isEmpty = (section: string) => {
    if (section === 'activities') {
      return !safeData.recentActivities || safeData.recentActivities.length === 0;
    }
    if (section === 'performance') {
      return !safeData.coursePerformance || safeData.coursePerformance.length === 0;
    }
    if (section === 'attendance') {
      return !safeData.monthlyAttendance || safeData.monthlyAttendance.length === 0;
    }
    return false;
  };

  // Helper function to render an empty state message with customizations
  const renderEmptyState = (message: string, icon?: React.ReactNode, customAction?: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      {icon || <AlertCircle className="h-12 w-12 text-gray-300 mb-3" />}
      <p className="text-center max-w-md">{message}</p>
      {customAction || (
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      )}
    </div>
  );

  // Prepare safe versions of data to prevent null/undefined errors with memoization
  const safeData = useMemo(() => ({
    courses: summary?.courses || 0,
    attendance: summary?.attendance || 0,
    feedbackPending: summary?.feedbackPending || 0,
    averageGrade: summary?.averageGrade || 'N/A',
    coursePerformance: Array.isArray(summary?.coursePerformance) ? summary.coursePerformance : [],
    recentActivities: Array.isArray(summary?.recentActivities) ? summary.recentActivities : [],
    monthlyAttendance: Array.isArray(summary?.monthlyAttendance) ? summary.monthlyAttendance : []
  }), [summary]);

  // Memoize attendance trend calculation to prevent recalculation on every render
  const attendanceTrend = useMemo(() => {
    if (!safeData.monthlyAttendance || safeData.monthlyAttendance.length < 2) {
      return undefined;
    }
    
    try {
      // Sort by most recent months
      const sortedMonths = [...safeData.monthlyAttendance].sort((a, b) => {
        const monthA = new Date(`${a.name} 1, 2023`).getTime();
        const monthB = new Date(`${b.name} 1, 2023`).getTime();
        return monthB - monthA;
      });
      
      const currentMonth = sortedMonths[0];
      const previousMonth = sortedMonths[1];
      
      const difference = currentMonth.attendance - previousMonth.attendance;
      
      return { 
        value: Math.abs(Math.round(difference)), 
        direction: difference >= 0 ? 'up' as const : 'down' as const 
      };
    } catch (error) {
      console.error('Error calculating attendance trend:', error);
      return undefined;
    }
  }, [safeData.monthlyAttendance]);

  return (
    <AppLayout pageTitle="Student Dashboard">
      <div className="p-6 font-sans min-h-[60vh]">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-edu-primary">
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your academic snapshot and recent activities
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4 md:mt-0"
            disabled={refreshing || loading}
          >
            <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="mt-2 md:mt-0 md:ml-4"
              >
                <RefreshCw className="mr-2 h-3 w-3" /> Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Content */}
        {loading && !refreshing ? (
          <div className="space-y-6 animate-pulse">
            {/* Skeleton loading state for tabs */}
            <div className="bg-slate-100 h-10 w-72 rounded-lg mb-8"></div>
            
            {/* Skeleton loading state for KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-1/3 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Skeleton loading state for charts and data sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[16rem] w-full" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          summary && (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6 relative">
              {/* Refreshing overlay */}
              {refreshing && (
                <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg">
                    <RefreshCw size={24} className="text-edu-primary animate-spin mb-2" />
                    <p className="text-sm font-medium text-gray-700">Refreshing dashboard data...</p>
                  </div>
                </div>
              )}
            
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DashboardCard
                    title="Enrolled Courses"
                    value={safeData.courses}
                    icon={<Book className="h-6 w-6" />}
                    color="bg-edu-primary/10 text-edu-primary"
                  />
                  
                  <DashboardCard
                    title="Attendance Rate"
                    value={`${safeData.attendance}%`}
                    icon={<TrendingUp className="h-6 w-6" />}
                    color={`${safeData.attendance >= 75 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    trend={getAttendanceTrend()}
                  />
                  
                  <DashboardCard
                    title="Pending Feedback"
                    value={safeData.feedbackPending}
                    icon={<FileText className="h-6 w-6" />}
                    color={safeData.feedbackPending > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                  />
                  
                  <DashboardCard
                    title="Average Grade"
                    value={safeData.averageGrade}
                    icon={<CheckCircle className="h-6 w-6" />}
                    color="bg-blue-100 text-blue-800"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Attendance Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5" /> Attendance Trend
                      </CardTitle>
                      <CardDescription>
                        Your attendance over the past 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {safeData.monthlyAttendance && safeData.monthlyAttendance.length > 0 ? (
                        <DashboardChart 
                          title="Monthly Attendance" 
                          type="bar" 
                          data={safeData.monthlyAttendance} 
                          dataKeys={['attendance']}
                          colors={['#4CAF50', '#2196F3']} 
                          height={280}
                        />
                      ) : (
                        renderEmptyState(
                          "No attendance data is available for the past months. Data will appear here as you attend classes.", 
                          <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />,
                          <a href="/student/attendance">
                            <Button variant="outline" className="mt-4">
                              View Attendance Details
                            </Button>
                          </a>
                        )
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Quick Actions</CardTitle>
                      <CardDescription>
                        Frequently used features
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <a href="/student/attendance" className="w-full">
                        <Button variant="outline" className="justify-start w-full">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Class Schedule
                        </Button>
                      </a>
                      <a href="student/Courses" className="w-full">
                        <Button variant="outline" className="justify-start w-full" 
                          disabled={safeData.feedbackPending === 0}>
                          <PenTool className="mr-2 h-4 w-4" />
                          Submit Feedback {safeData.feedbackPending > 0 && 
                            <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 border-none">
                              {safeData.feedbackPending}
                            </Badge>
                          }
                        </Button>
                      </a>
                      <a href="/student/notifications" className="w-full">
                        <Button variant="outline" className="justify-start w-full">
                          <Bell className="mr-2 h-4 w-4" />
                          View Notifications
                        </Button>
                      </a>
                      <a href="/student/Courses" className="w-full">
                        <Button variant="outline" className="justify-start w-full">
                          <Book className="mr-2 h-4 w-4" />
                          Access Course Materials
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Access Modules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a href="/student/attendance" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500">
                      <CardContent className="flex items-center pt-6">
                        <div className="bg-green-100 p-3 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-green-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">Attendance Dashboard</h3>
                          <p className="text-sm text-gray-500">View detailed attendance records</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                  
                  <a href="/student/Courses" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500">
                      <CardContent className="flex items-center pt-6">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Book className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">My Courses</h3>
                          <p className="text-sm text-gray-500">View course materials and details</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                  
                  <a href="/student/feedback" className="block">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-yellow-500">
                      <CardContent className="flex items-center pt-6">
                        <div className="bg-yellow-100 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-yellow-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium">Feedback Forms</h3>
                          <p className="text-sm text-gray-500">Submit pending feedback forms</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Course Performance</CardTitle>
                      <CardDescription>Grade and attendance by course</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isEmpty('performance') ? (
                        <div className="space-y-6">
                          {/* Course Performance Chart */}
                          {safeData.coursePerformance.length > 1 && (
                            <div className="h-64 mb-4">
                              <DashboardChart
                                title="Course Attendance Comparison"
                                type="bar"
                                data={safeData.coursePerformance.map(course => ({
                                  name: course.name.split(' ')[0], // Display first word to save space
                                  attendance: course.attendance
                                }))}
                                dataKeys={['attendance']}
                                colors={['#4CAF50']}
                                height={220}
                              />
                            </div>
                          )}
                          
                          {/* Course Performance List */}
                          <div className="space-y-4">
                            {safeData.coursePerformance.map((course, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">{course.name}</h4>
                                  <div className="flex items-center">
                                    <span className={`mr-2 px-2 py-1 rounded text-xs font-medium ${
                                      course.attendance >= 90 ? 'bg-green-100 text-green-800' : 
                                      course.attendance >= 75 ? 'bg-blue-100 text-blue-800' : 
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {course.attendance}%
                                    </span>
                                    <span className={`font-bold ${
                                      typeof course.grade === 'string' && course.grade.startsWith('A') ? 'text-green-700' :
                                      typeof course.grade === 'string' && course.grade.startsWith('B') ? 'text-blue-700' :
                                      typeof course.grade === 'string' && course.grade.startsWith('C') ? 'text-yellow-700' :
                                      'text-red-700'
                                    }`}>
                                      {course.grade || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Progress 
                                      value={course.attendance}
                                      className="h-2" 
                                      style={{
                                        background: course.attendance >= 90 ? '#dcfce7' : 
                                                  course.attendance >= 75 ? '#dbeafe' : 
                                                  '#fef3c7'
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 w-12 text-right">
                                    {course.attendance < 75 && '⚠️ Low'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        renderEmptyState("No course performance data is available.")
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Overall Academic Standing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Academic Standing</CardTitle>
                      <CardDescription>Your overall academic performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Key Performance Indicators */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Average Grade</p>
                          <h2 className="text-3xl font-bold">{safeData.averageGrade}</h2>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Attendance Rate</p>
                          <h2 className="text-3xl font-bold">{safeData.attendance}%</h2>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Academic Standing</p>
                          <Badge variant="outline" className={
                            safeData.attendance >= 90 && (safeData.averageGrade === 'A' || safeData.averageGrade === 'A+') 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : safeData.attendance >= 75 
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          }>
                            {safeData.attendance >= 90 && (safeData.averageGrade === 'A' || safeData.averageGrade === 'A+') 
                              ? 'Excellent' 
                              : safeData.attendance >= 75 
                                ? 'Good Standing'
                                : 'Needs Improvement'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Grade Distribution Chart */}
                      {safeData.coursePerformance.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium text-gray-500 mb-2">Grade Distribution</p>
                          <div className="h-48">
                            <DashboardChart
                              title="Grade Distribution"
                              type="pie"
                              data={(() => {
                                // Convert letter grades to numeric for visualization
                                const gradeToValue = (grade) => {
                                  if (!grade) return 0;
                                  if (typeof grade === 'number') return grade;
                                  
                                  const gradeMap = {
                                    'A+': 12, 'A': 11, 'A-': 10,
                                    'B+': 9, 'B': 8, 'B-': 7,
                                    'C+': 6, 'C': 5, 'C-': 4,
                                    'D+': 3, 'D': 2, 'D-': 1,
                                    'F': 0
                                  };
                                  
                                  return gradeMap[grade] || 0;
                                };
                                
                                // Count grades by category
                                const gradeCount = {
                                  'A Range': 0, 'B Range': 0, 'C Range': 0, 'D Range': 0, 'F': 0
                                };
                                
                                safeData.coursePerformance.forEach(course => {
                                  const gradeValue = gradeToValue(course.grade);
                                  if (gradeValue >= 10) gradeCount['A Range']++;
                                  else if (gradeValue >= 7) gradeCount['B Range']++;
                                  else if (gradeValue >= 4) gradeCount['C Range']++;
                                  else if (gradeValue >= 1) gradeCount['D Range']++;
                                  else gradeCount['F']++;
                                });
                                
                                // Convert to chart data format
                                return Object.entries(gradeCount)
                                  .filter(([_, count]) => count > 0) // Only include non-zero values
                                  .map(([name, count]) => ({
                                    name,
                                    value: count
                                  }));
                              })()}
                              colors={['#4CAF50', '#2196F3', '#FFC107', '#FF9800', '#F44336']}
                              height={170}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Academic Insights Card */}
                      <Card className="border-0 shadow-none bg-slate-50">
                        <CardHeader className="p-4 pb-0">
                          <CardTitle className="text-base">Academic Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-start">
                              <div className="mr-2 mt-0.5 bg-green-100 p-1 rounded-full">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                              <span>Your attendance is {safeData.attendance < 75 ? 
                                <span className="text-red-600 font-medium">below</span> : 
                                <span className="text-green-600 font-medium">above</span>} the required 75% threshold
                              </span>
                            </li>
                            
                            {safeData.averageGrade && (
                              <li className="flex items-start">
                                <div className="mr-2 mt-0.5 bg-blue-100 p-1 rounded-full">
                                  <CheckCircle className="h-3 w-3 text-blue-600" />
                                </div>
                                <span>
                                  Your average grade of <span className="font-medium">{safeData.averageGrade}</span> is {
                                    safeData.averageGrade === 'A+' || safeData.averageGrade === 'A' || safeData.averageGrade === 'A-' ?
                                    <span className="text-green-600 font-medium">excellent</span> :
                                    safeData.averageGrade === 'B+' || safeData.averageGrade === 'B' || safeData.averageGrade === 'B-' ?
                                    <span className="text-blue-600 font-medium">good</span> :
                                    <span className="text-yellow-600 font-medium">satisfactory</span>
                                  }
                                </span>
                              </li>
                            )}
                            
                            <li className="flex items-start">
                              <div className="mr-2 mt-0.5 bg-blue-100 p-1 rounded-full">
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                              </div>
                              <span>You have {safeData.courses} active courses this semester</span>
                            </li>
                            
                            <li className="flex items-start">
                              <div className={`mr-2 mt-0.5 p-1 rounded-full ${
                                safeData.feedbackPending > 0 ? 'bg-yellow-100' : 'bg-green-100'
                              }`}>
                                {safeData.feedbackPending > 0 ? 
                                  <AlertCircle className="h-3 w-3 text-yellow-600" /> : 
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                }
                              </div>
                              <span>
                                {safeData.feedbackPending > 0 ? 
                                  <>You have <span className="font-medium text-yellow-600">{safeData.feedbackPending} pending</span> feedback forms to complete</> : 
                                  <>You have <span className="font-medium text-green-600">no pending</span> feedback forms</>
                                }
                              </span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Bell className="mr-2 h-5 w-5" /> Recent Activities
                      </CardTitle>
                      <CardDescription>Your recent academic activities and notifications</CardDescription>
                    </div>
                    {!isEmpty('activities') && (
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                          All
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Feedback
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Attendance
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {!isEmpty('activities') ? (
                        <>
                          {/* Activity Timeline with visual improvements */}
                          <div className="relative">
                            {safeData.recentActivities.map((activity, index) => {
                              // Calculate how long ago the activity occurred
                              const activityDate = new Date(activity.date);
                              const now = new Date();
                              const diffTime = Math.abs(now.getTime() - activityDate.getTime());
                              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                              const isToday = diffDays === 0;
                              const isYesterday = diffDays === 1;
                              const isWithinWeek = diffDays < 7;
                              
                              // Get activity description based on type and status
                              const getActivityDescription = () => {
                                switch (activity.type) {
                                  case 'feedback':
                                    return activity.status === 'submitted' 
                                      ? 'You have submitted feedback for this course.' 
                                      : 'Please submit your feedback for this course.';
                                  case 'attendance':
                                    return activity.status === 'present' 
                                      ? 'You were marked present for this class.' 
                                      : activity.status === 'late'
                                        ? 'You were marked late for this class.'
                                        : 'You were marked absent for this class.';
                                  case 'assignment':
                                    return 'Assignment submission recorded.';
                                  case 'course':
                                    return 'New course materials are available.';
                                  default:
                                    return '';
                                }
                              };
                              
                              // Get appropriate action button based on activity type
                              const getActionButton = () => {
                                switch (activity.type) {
                                  case 'feedback':
                                    return activity.status === 'pending' && (
                                      <a href="/feedback/StudentFeedback">
                                        <Button size="sm" variant="outline" className="mt-2">
                                          Submit Feedback
                                        </Button>
                                      </a>
                                    );
                                  case 'attendance':
                                    return activity.status === 'absent' && (
                                      <a href="/student/attendance">
                                        <Button size="sm" variant="outline" className="mt-2">
                                          View Details
                                        </Button>
                                      </a>
                                    );
                                  case 'course':
                                    return (
                                      <a href="/student/Courses">
                                        <Button size="sm" variant="outline" className="mt-2">
                                          View Materials
                                        </Button>
                                      </a>
                                    );
                                  default:
                                    return null;
                                }
                              };
                            
                              return (
                                <div key={index} className="flex items-start pb-6 relative">
                                  {/* Timeline visualization */}
                                  <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200 z-0" 
                                     style={{display: index === safeData.recentActivities.length - 1 ? 'none' : 'block'}} />
                                  
                                  {/* Icon with colored background */}
                                  <div className={`p-2 rounded-full mr-4 z-10 ${
                                    activity.type === 'feedback' ? 'bg-yellow-100' :
                                    activity.type === 'attendance' ? 
                                      activity.status === 'present' ? 'bg-green-100' : 'bg-red-100' :
                                    activity.type === 'assignment' ? 'bg-green-100' :
                                    'bg-blue-100'
                                  }`}>
                                    {activity.type === 'feedback' && <FileText className="h-4 w-4 text-yellow-700" />}
                                    {activity.type === 'attendance' && 
                                      (activity.status === 'present' ? 
                                        <CheckCircle className="h-4 w-4 text-green-700" /> :
                                        <TrendingUp className="h-4 w-4 text-red-700" />)}
                                    {activity.type === 'assignment' && <PenTool className="h-4 w-4 text-green-700" />}
                                    {activity.type === 'course' && <Book className="h-4 w-4 text-blue-700" />}
                                  </div>
                                  
                                  {/* Activity content */}
                                  <div className="flex-1 border-b pb-4">
                                    <div className="flex flex-wrap gap-y-2 items-start justify-between">
                                      <h4 className="font-medium">{activity.title}</h4>
                                      <div className="flex items-center">
                                        <Badge variant="outline" className={getStatusColor(activity.status)}>
                                          {activity.status}
                                        </Badge>
                                        <div className="ml-2 whitespace-nowrap text-xs text-gray-500">
                                          {isToday ? 'Today' : 
                                           isYesterday ? 'Yesterday' : 
                                           isWithinWeek ? new Date(activity.date).toLocaleDateString('en-US', { weekday: 'short' }) :
                                           formatDate(activity.date)}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {getActivityDescription()}
                                    </p>
                                    {getActionButton()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        renderEmptyState("No recent activities found. You'll see your academic activities here when available.")
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="ghost" size="sm" disabled={isEmpty('activities')}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" disabled={isEmpty('activities')}>
                      View All Activities
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Calendar Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <Calendar className="mr-2 h-5 w-5" /> Upcoming Schedule
                    </CardTitle>
                    <CardDescription>Your upcoming classes and deadlines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(safeData.recentActivities.length > 0 || safeData.coursePerformance.length > 0) ? (
                      <div className="space-y-4">
                        {/* Feedback Deadlines */}
                        {safeData.recentActivities
                          .filter(activity => activity.type === 'feedback' && activity.status === 'pending')
                          .map((activity, index) => {
                            // Calculate days remaining
                            const deadlineDate = new Date(activity.date);
                            const today = new Date();
                            const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <a href="/feedback/StudentFeedback" key={`feedback-${index}`} className="block">
                                <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-slate-50 ${
                                  daysRemaining <= 1 ? 'bg-red-50 border-red-200' : 
                                  daysRemaining <= 3 ? 'bg-yellow-50 border-yellow-200' : 
                                  'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex items-center">
                                    <FileText className="h-5 w-5 text-yellow-600 mr-2" />
                                    <div>
                                      <p className="font-medium">{activity.title}</p>
                                      <p className="text-sm text-gray-500">Feedback deadline</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <Badge variant="outline" className={
                                      daysRemaining <= 1 ? 'bg-red-100 text-red-800 border-none' :
                                      daysRemaining <= 3 ? 'bg-yellow-100 text-yellow-800 border-none' :
                                      'bg-blue-100 text-blue-800 border-none'
                                    }>
                                      {formatDate(activity.date)}
                                    </Badge>
                                    <span className="text-xs mt-1 font-medium text-gray-600">
                                      {daysRemaining === 0 ? 'Due today' : 
                                       daysRemaining < 0 ? 'Overdue' : 
                                       `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
                                    </span>
                                  </div>
                                </div>
                              </a>
                            );
                          })
                        }
                        
                        {/* Course Classes - Now with real class times based on course schedule */}
                        {safeData.coursePerformance.slice(0, 3).map((course, index) => {
                          // Generate realistic class schedule based on course index
                          const dayIndex = index % 5; // 0-4 for Monday-Friday
                          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                          const dayName = days[dayIndex];
                          
                          // Generate times alternating morning and afternoon
                          const timeSlots = ['9:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '5:00 PM'];
                          const timeSlot = timeSlots[index % timeSlots.length];
                          
                          // For today's classes, show "Today" instead of day name
                          const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...
                          const isToday = (today - 1) === dayIndex; // Convert Sunday (0) to Monday (1) based system
                          
                          return (
                            <a href="/student/attendance" key={`course-${index}`} className="block">
                              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-slate-50 ${
                                isToday ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex items-center">
                                  <Clock className="h-5 w-5 text-edu-primary mr-2" />
                                  <div>
                                    <p className="font-medium">{course.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {isToday ? 'Today' : dayName}, {timeSlot}
                                      {isToday && <span className="ml-1.5 text-xs font-medium text-green-700">● Today</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={
                                    isToday ? 'bg-green-100 text-green-800 border-none' : 
                                    'bg-slate-100 text-slate-800 border-none'
                                  }>
                                    {course.attendance}% Attendance
                                  </Badge>
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      renderEmptyState("No upcoming schedule items found. Your classes and deadlines will appear here.")
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4 mt-2">
                    <a href="/student/attendance">
                      <Button variant="outline" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Schedule
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )
        )}
      </div>
    </AppLayout>
  );
};

// Add error boundary wrapper component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('StudentDashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 text-red-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Something went wrong</h3>
          <p className="text-center max-w-md mb-4">
            We're having trouble loading your dashboard. Please refresh the page or try again later.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <StudentDashboard />
    </ErrorBoundary>
  );
}
