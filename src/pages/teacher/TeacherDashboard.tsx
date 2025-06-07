import React, { useState, useEffect, useCallback } from 'react';
import { 
  Book, 
  Calendar, 
  CheckCircle, 
  MessageSquare, 
  Users, 
  TrendingUp,
  FileText,
  Bell,
  AlertCircle,
  RefreshCw,
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import DashboardChartComponent from '@/components/dashboard/DashboardChartComponent';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import axios from 'axios';

interface Course {
  _id: string;
  name: string;
  code: string;
  studentCount: number;
  attendanceRate: number;
}

interface FeedbackStat {
  courseId: string;
  courseCode: string;
  courseName: string;
  formCount: number;
  responseCount: number;
  responseRate: number;
  averageRating: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  date: string;
  studentId?: string;
  formId?: string;
  attendeeCount?: number;
  presentCount?: number;
}

interface AttendanceChartData {
  month: string;
  present: number;
  presentRate: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface DashboardData {
  teacher: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  summary: {
    courseCount: number;
    studentCount: number;
    feedbackFormCount: number;
    responseCount: number;
    attendanceRecordCount: number;
  };
  coursesWithAttendance: Course[];
  feedbackStats: FeedbackStat[];
  recentActivities: Activity[];
  monthlyAttendanceChart: AttendanceChartData[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TeacherDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  // Set up axios with auth header
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher/dashboard-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-cache' // Prevent caching for fresh data
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      
      setDashboardData(data);
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
    if (token) fetchDashboardData();
  }, [token, fetchDashboardData]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // If no user, don't render the dashboard
  if (!user) return null;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Show loading state
  if (loading && !dashboardData) {
    return (
      <AppLayout pageTitle="Teacher Dashboard">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <AppLayout pageTitle="Teacher Dashboard">
        <div className="p-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Prepare data for charts
  const attendanceChartData = dashboardData?.monthlyAttendanceChart?.map(item => ({
    name: item.month,
    'Present (%)': parseFloat(item.presentRate.toFixed(1)),
    Total: item.total
  })) || [];
  
  const feedbackRatingData = dashboardData?.feedbackStats?.map(stat => ({
    name: stat.courseCode,
    'Rating': stat.averageRating,
    'Responses': stat.responseCount
  })) || [];

  const feedbackResponseRateData = dashboardData?.feedbackStats?.map(stat => ({
    name: stat.courseCode,
    'Response Rate (%)': parseFloat(stat.responseRate.toFixed(1))
  })) || [];

  return (
    <AppLayout pageTitle="Teacher Dashboard">
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {dashboardData?.teacher?.name || user?.name || 'Teacher'}!
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} 
              — View your dashboard analytics
            </p>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing} 
            variant="outline" 
            className="gap-2"
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardCard
                title="Courses" 
                value={dashboardData?.summary?.courseCount || 0}
                icon={<Book size={20} />}
                color="bg-blue-50 text-blue-600"
              />
              <DashboardCard 
                title="Students" 
                value={dashboardData?.summary?.studentCount || 0}
                icon={<GraduationCap size={20} />}
                color="bg-indigo-50 text-indigo-600"
              />
              <DashboardCard 
                title="Feedback Forms" 
                value={dashboardData?.summary?.feedbackFormCount || 0}
                icon={<ClipboardCheck size={20} />}
                color="bg-violet-50 text-violet-600"
              />
              <DashboardCard 
                title="Responses" 
                value={dashboardData?.summary?.responseCount || 0}
                icon={<MessageSquare size={20} />}
                color="bg-fuchsia-50 text-fuchsia-600"
              />
            </div>
            
            {/* Main Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Attendance Overview</CardTitle>
                  <CardDescription>Monthly attendance statistics</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <DashboardChartComponent
                      title="Monthly Attendance"
                      type="bar" 
                      data={attendanceChartData.map(item => ({ 
                        name: item.name, 
                        value: item['Present (%)']
                      }))}
                      dataKeys={['value']}
                      colors={["#8b5cf6"]}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Course Feedback Ratings</CardTitle>
                  <CardDescription>Average ratings per course</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <DashboardChartComponent
                      title="Course Feedback Ratings"
                      type="bar"
                      data={feedbackRatingData.map(item => ({ 
                        name: item.name, 
                        value: item.Rating 
                      }))}
                      dataKeys={['value']}
                      colors={["#06b6d4"]}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Course Analytics */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course Analytics</h2>
                <Button variant="ghost" size="sm" className="gap-1">
                  See All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData?.coursesWithAttendance?.map(course => (
                  <Card key={course._id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">{course.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <span className="font-mono">{course.code}</span>
                        <Badge variant="outline" className="ml-2">
                          {course.studentCount} students
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Attendance Rate</span>
                          <span className="text-sm font-medium">{course.attendanceRate}%</span>
                        </div>
                        <Progress value={course.attendanceRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <div className="space-y-3">
                {dashboardData?.recentActivities?.slice(0, 5).map(activity => (
                  <Card key={activity.id} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'feedback' 
                          ? 'bg-violet-100 text-violet-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {activity.type === 'feedback' 
                          ? <MessageSquare size={18} /> 
                          : <Clock size={18} />
                        }
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                      </div>
                      <Badge variant={
                        activity.type === 'feedback' ? 'secondary' : 'outline'
                      }>
                        {activity.type === 'feedback' ? 'Feedback' : 'Attendance'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                
                {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No recent activity to display</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Feedback Response Rate</CardTitle>
                  <CardDescription>Response rate per course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <DashboardChartComponent
                      title="Response Rate"
                      type="bar"
                      data={feedbackResponseRateData.map(item => ({ 
                        name: item.name, 
                        value: item['Response Rate (%)'] 
                      }))}
                      dataKeys={['value']}
                      colors={["#8b5cf6"]}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Feedback Statistics</CardTitle>
                  <CardDescription>Detailed stats by course</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="space-y-6">
                    {dashboardData?.feedbackStats?.map(stat => (
                      <div key={stat.courseId} className="space-y-2 px-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{stat.courseCode}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{stat.averageRating.toFixed(1)}</span>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={stat.responseRate} className="h-2" />
                          <span className="text-xs text-muted-foreground min-w-[60px]">
                            {stat.responseCount}/{stat.formCount} forms
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {(!dashboardData?.feedbackStats || dashboardData.feedbackStats.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        No feedback data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recent Feedback Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivities?.filter(a => a.type === 'feedback')
                    .slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-center gap-4 p-2 rounded hover:bg-gray-50">
                        <div className="p-2 bg-violet-100 rounded-full text-violet-700">
                          <MessageSquare size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    ))}
                    
                  {!dashboardData?.recentActivities?.some(a => a.type === 'feedback') && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent feedback submissions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Monthly Attendance</CardTitle>
                  <CardDescription>Attendance trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <DashboardChartComponent
                      title="Monthly Attendance"
                      type="line"
                      data={attendanceChartData.map(item => ({ 
                        name: item.name, 
                        value: item['Present (%)'] 
                      }))}
                      dataKeys={['value']}
                      colors={["#06b6d4"]}
                      height={300}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Attendance Statistics</CardTitle>
                  <CardDescription>Student attendance by course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {dashboardData?.coursesWithAttendance?.map(course => (
                      <div key={course._id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{course.code}</span>
                          <span className="text-sm">{course.attendanceRate}%</span>
                        </div>
                        <Progress 
                          value={course.attendanceRate} 
                          className="h-2" 
                          indicatorClassName={
                            course.attendanceRate > 75 ? "bg-green-500" : 
                            course.attendanceRate > 50 ? "bg-yellow-500" : "bg-red-500"
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {course.studentCount} students enrolled
                        </p>
                      </div>
                    ))}
                    
                    {(!dashboardData?.coursesWithAttendance || dashboardData.coursesWithAttendance.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">
                        No attendance data available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Recent Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivities?.filter(a => a.type === 'attendance')
                    .slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-center gap-4 p-2 rounded hover:bg-gray-50">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-700">
                          <Clock size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                        </div>
                        <Badge variant="outline">
                          {activity.presentCount}/{activity.attendeeCount} Present
                        </Badge>
                      </div>
                    ))}
                    
                  {!dashboardData?.recentActivities?.some(a => a.type === 'attendance') && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent attendance records
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;