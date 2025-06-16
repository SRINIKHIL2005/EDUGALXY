import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BadgeCheck, AlertTriangle, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Lightbulb } from "lucide-react";

interface AttendanceRecord {
  _id: string;
  date: string;
  department: string;
  course: string;
  status: string;
  remark: string;
  submissionStatus?: 'submitted' | 'not_submitted';
}

interface AttendanceAnalysis {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentageAttendance: number;
  coursesAnalysis: {
    [course: string]: {
      total: number;
      present: number;
      percentage: number;
    }
  };
  monthlyData: {
    name: string;
    attendance: number;
  }[];
  statusDistribution: {
    name: string;
    value: number;
  }[];
  submissionStatus: {
    submitted: number;
    notSubmitted: number;
  };
}

interface AiSuggestion {
  id: string;
  type: 'warning' | 'improvement' | 'alert';
  message: string;
  description: string;
}

// Ensure we're using the correct base URL
import API_CONFIG from '@/config/api';

// Use API_CONFIG instead of hardcoded localhost
const API_BASE_URL = API_CONFIG.BASE_URL;
console.log('API Base URL:', API_BASE_URL);

const StudentAttendancePage: React.FC = () => {
  const { token } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [analysis, setAnalysis] = useState<AttendanceAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');  // Calculate attendance analytics based on the fetched data
  const calculateAnalytics = (attendanceData: AttendanceRecord[]): AttendanceAnalysis => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const late = attendanceData.filter(record => record.status === 'late').length;
    const percentage = total > 0 ? (present / total) * 100 : 0;
    
    // Course-wise analysis
    const courseAnalysis: { [course: string]: { total: number; present: number; percentage: number } } = {};
    attendanceData.forEach(record => {
      // Use department as course if course field is missing
      const courseName = record.course || record.department || 'Unknown';
      
      if (!courseAnalysis[courseName]) {
        courseAnalysis[courseName] = { total: 0, present: 0, percentage: 0 };
      }
      courseAnalysis[courseName].total += 1;
      if (record.status === 'present') {
        courseAnalysis[courseName].present += 1;
      }
    });
    
    // Calculate percentages for each course
    Object.keys(courseAnalysis).forEach(course => {
      courseAnalysis[course].percentage = 
        (courseAnalysis[course].present / courseAnalysis[course].total) * 100;
    });
    
    // Create monthly data
    const months: { [key: string]: number } = {};
    const statusCount: { [key: string]: number } = {
      present: present,
      absent: absent,
      late: late,
    };
    
    attendanceData.forEach(record => {
      const month = new Date(record.date).toLocaleString('default', { month: 'short' });
      if (!months[month]) {
        months[month] = 0;
      }
      if (record.status === 'present') {
        months[month]++;
      }
    });
    
    const monthlyData = Object.keys(months).map(month => ({
      name: month,
      attendance: months[month],
    }));
    
    const statusDistribution = Object.keys(statusCount).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusCount[status],
    }));    // Calculate submission status
    const submitted = attendanceData.filter(record => record.submissionStatus === 'submitted').length;
    const notSubmitted = attendanceData.filter(record => record.submissionStatus === 'not_submitted').length || 0;
    
    return {
      totalClasses: total,
      present,
      absent,
      late,
      percentageAttendance: percentage,
      coursesAnalysis: courseAnalysis,
      monthlyData,
      statusDistribution,
      submissionStatus: {
        submitted,
        notSubmitted
      }
    };
  };
  
  // Generate AI suggestions based on attendance patterns
  const generateSuggestions = (attendanceData: AttendanceRecord[], analysisData: AttendanceAnalysis): AiSuggestion[] => {
    const suggestions: AiSuggestion[] = [];
    
    // Check overall attendance percentage
    if (analysisData.percentageAttendance < 75) {
      suggestions.push({
        id: 'low-attendance',
        type: 'alert',
        message: 'Your attendance is below the minimum requirement',
        description: `Your current attendance is ${analysisData.percentageAttendance.toFixed(1)}%, which is below the 75% college requirement. Please improve your attendance to avoid academic penalties.`
      });
    }
    
    // Check for courses with low attendance
    Object.keys(analysisData.coursesAnalysis).forEach(course => {
      const courseData = analysisData.coursesAnalysis[course];
      if (courseData.percentage < 60) {
        suggestions.push({
          id: `low-${course}`,
          type: 'warning',
          message: `Low attendance in ${course}`,
          description: `Your attendance in ${course} is only ${courseData.percentage.toFixed(1)}%. Consider attending more classes for this course to improve your understanding.`
        });
      }
    });
    
    // Check for consecutive absences
    let consecutiveAbsences = 0;
    let maxConsecutiveAbsences = 0;
    
    // Sort by date to check consecutive absences
    const sortedRecords = [...attendanceData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedRecords.forEach(record => {
      if (record.status === 'absent') {
        consecutiveAbsences++;
        maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsences);
      } else {
        consecutiveAbsences = 0;
      }
    });
    
    if (maxConsecutiveAbsences >= 3) {
      suggestions.push({
        id: 'consecutive-absences',
        type: 'warning',
        message: 'Pattern of consecutive absences detected',
        description: `You have been absent for ${maxConsecutiveAbsences} classes in a row. Regular attendance is important for academic success.`
      });
    }
    
    // Check for pending attendance submissions
    if (analysisData.submissionStatus.notSubmitted > 0) {
      suggestions.push({
        id: 'pending-submissions',
        type: 'improvement',
        message: 'You have pending attendance submissions',
        description: `Please complete your ${analysisData.submissionStatus.notSubmitted} pending attendance submissions to ensure your records are up to date.`
      });
    }
    
    // Add general improvement suggestions
    if (analysisData.percentageAttendance >= 75 && analysisData.percentageAttendance < 90) {
      suggestions.push({
        id: 'improve-attendance',
        type: 'improvement',
        message: 'Good attendance, but room for improvement',
        description: 'Your attendance is satisfactory, but improving it further could help you better understand course materials and improve academic performance.'
      });
    } else if (analysisData.percentageAttendance >= 90) {
      suggestions.push({
        id: 'excellent-attendance',
        type: 'improvement',
        message: 'Excellent attendance record',
        description: 'Keep up the good work! Your consistent attendance shows dedication to your studies.'
      });
    }
    
    return suggestions;
  };  useEffect(() => {
    if (!token) return;
    
    // Keep track of fetch attempts for retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    // Initialize with empty analysis and suggestions if not already set
    if (!analysis) {
      setAnalysis({
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentageAttendance: 0,
        coursesAnalysis: {},
        monthlyData: [],
        statusDistribution: [],
        submissionStatus: { submitted: 0, notSubmitted: 0 }
      });
    }
    
    if (suggestions.length === 0) {
      setSuggestions([]);
    }
    
    const fetchAttendanceData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        attempts++;
        console.log(`Fetching attendance data (attempt ${attempts}/${maxAttempts}):`, `${API_BASE_URL}/api/student/attendance`);
        
        // Fetch attendance records with a timeout to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch(`${API_BASE_URL}/api/student/attendance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          // Add cache control to prevent stale responses
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId); // Clear timeout if fetch completes
        
        if (!res.ok) {
          console.error('Failed to fetch attendance:', res.status, res.statusText);
          throw new Error(`Failed to fetch attendance: ${res.status} ${res.statusText}`);
        }
          let attendanceData = await res.json();
        console.log('Received attendance data:', attendanceData);
        
        // Validate that we have an array of records
        if (!Array.isArray(attendanceData)) {
          console.error('Received data is not an array:', attendanceData);
          throw new Error('Invalid data format: expected an array of attendance records');
        }
        
        // Process the data to ensure all required fields are available
        attendanceData = attendanceData.map((record: any) => ({
          _id: record._id || `temp-${Math.random().toString(36).substring(2)}`,
          date: record.date,
          department: record.department || 'Unknown',
          course: record.course || record.department || 'Unknown', // Use department as fallback for course
          status: record.status || 'absent',
          remark: record.remark || '',
          submissionStatus: record.submissionStatus || 'submitted' // Default to submitted if not provided
        }));
        
        console.log('Processed attendance data:', attendanceData);
        
        setAttendance(attendanceData);
          // Calculate analytics from the data
        const analyticsData = calculateAnalytics(attendanceData);
        setAnalysis(analyticsData);
        
        // Generate AI suggestions based on the data
        const aiSuggestions = generateSuggestions(attendanceData, analyticsData);
        setSuggestions(aiSuggestions);
        
        // Ensure loading state is set to false on success
        setIsLoading(false);
      } catch (err: any) {
        console.error('Attendance fetch error:', err);
          // Implement retry logic for connection errors
        if ((err.message.includes('Failed to fetch') || 
             err.name === 'AbortError' || 
             err.message.includes('network') || 
             err.message.includes('refused')) && 
            attempts < maxAttempts) {
          
          console.log(`Connection failed. Retrying in ${attempts * 2} seconds...`);
          
          // Still show an error during retries, but with a "retrying" message
          setError(`Connection error: ${err.message}. Retrying in ${attempts * 2} seconds...`);
          
          setTimeout(() => {
            fetchAttendanceData(); // Retry the fetch
          }, attempts * 2000); // Exponential backoff: 2s, 4s, 6s
          
          // Don't return here, let the component render with the error state
          // But we do need to prevent the code below from executing
          return;
        }
          // If we've exhausted retries or got a different error, show it
        setError(`Failed to load attendance: ${err.message || 'Server connection error'}. Please try again later.`);
        
        // Check if we already have attendance data before falling back to mock data
        if (attendance && attendance.length > 0) {
          // We have data, so let's calculate analysis and suggestions
          console.log('Using existing attendance data even though there was an error');
          const analyticsData = calculateAnalytics(attendance);
          setAnalysis(analyticsData);
          const aiSuggestions = generateSuggestions(attendance, analyticsData);
          setSuggestions(aiSuggestions);
        }
        // Generate some mock data if in development to show the UI
        else if (import.meta.env.DEV) {
          console.log('Generating mock attendance data for development');
          const mockData = generateMockAttendanceData();
          setAttendance(mockData);
          const mockAnalytics = calculateAnalytics(mockData);
          setAnalysis(mockAnalytics);
          const mockSuggestions = generateSuggestions(mockData, mockAnalytics);
          setSuggestions(mockSuggestions);
        }} finally {
        // Set loading to false regardless of attempts count, as long as it's not going to retry
        setIsLoading(false);
      }
    };
    
    fetchAttendanceData();
    
    // Cleanup function to cancel any ongoing requests when component unmounts
    return () => {
      console.log('Cleaning up attendance fetch');
      attempts = maxAttempts; // Prevent further retries
    };
  }, [token]);
  
  // Effect to ensure analysis is calculated whenever attendance data changes
  useEffect(() => {
    if (attendance.length > 0 && (!analysis || Object.keys(analysis.coursesAnalysis).length === 0)) {
      console.log('Attendance data available but analysis missing, calculating now...');
      const analyticsData = calculateAnalytics(attendance);
      setAnalysis(analyticsData);
      
      const aiSuggestions = generateSuggestions(attendance, analyticsData);
      setSuggestions(aiSuggestions);
    }
  }, [attendance]);
  
  // Function to generate mock attendance data for development
  const generateMockAttendanceData = (): AttendanceRecord[] => {
    const courses = ['Mathematics', 'Computer Science', 'Physics', 'English Literature'];
    const statuses = ['present', 'absent', 'late'];
    const mockData: AttendanceRecord[] = [];
    
    const today = new Date();
    
    // Generate records for the past 3 months
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const course = courses[Math.floor(Math.random() * courses.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      mockData.push({
        _id: `mock-${i}`,
        date: date.toISOString(),
        department: 'Computer Science',
        course: course,
        status: status,
        remark: status === 'absent' ? 'Student was absent' : '',
        submissionStatus: i % 5 === 0 ? 'not_submitted' : 'submitted'
      });
    }
    
    return mockData;
  };
  const COLORS = ['#4CAF50', '#f44336', '#FFC107', '#2196F3', '#9C27B0'];
  
  // Get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600';
      case 'absent': return 'text-red-600';
      case 'late': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Get color for suggestion type
  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'alert': return 'bg-red-50 border-red-200';
      case 'improvement': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'improvement': return <Lightbulb className="h-5 w-5 text-green-500" />;
      default: return <BadgeCheck className="h-5 w-5 text-blue-500" />;
    }
  };
  // Debug log for rendering conditions
  console.log('Rendering attendance dashboard with states:', { 
    isLoading, 
    hasError: !!error,
    attendanceLength: attendance.length,
    hasAnalysis: !!analysis
  });
  
  return (
    <AppLayout pageTitle="My Attendance">      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Attendance Dashboard</h2>
          <p className="text-gray-500">View and analyze your attendance records</p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          size="sm"
        >
          Refresh Data
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading attendance data...</p>
        </div>      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-500 text-center max-w-lg">
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p>{error}</p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Retry Connection
          </Button>
        </div>      ) : attendance.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No attendance records found.</p>
        </div>
      ) : !analysis && attendance.length > 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Processing attendance data...</p>
          <Button 
            onClick={() => {
              // Manually calculate analysis if it wasn't set properly
              const analyticsData = calculateAnalytics(attendance);
              setAnalysis(analyticsData);
              const aiSuggestions = generateSuggestions(attendance, analyticsData);
              setSuggestions(aiSuggestions);
            }} 
            variant="outline" 
            className="mt-4"
          >
            Process Data
          </Button>
        </div>
      ) : (
        <>
          {/* Tabs navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Overall Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>                    <div className="text-3xl font-bold mb-2">{analysis?.percentageAttendance ? analysis.percentageAttendance.toFixed(1) : "0.0"}%</div>
                    <Progress 
                      value={analysis?.percentageAttendance || 0} 
                      className={`h-2 ${analysis && analysis.percentageAttendance < 75 ? 'bg-red-100' : 'bg-green-100'}`} 
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {analysis && analysis.percentageAttendance < 75 ? 
                        '⚠️ Below required 75% attendance' : 
                        '✅ Meeting attendance requirements'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Classes</CardTitle>
                  </CardHeader>
                  <CardContent>                    <div className="text-3xl font-bold">{analysis?.totalClasses || 0}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      <span className="text-green-600">{analysis?.present || 0} Present</span> • 
                      <span className="text-red-600"> {analysis?.absent || 0} Absent</span> • 
                      <span className="text-yellow-600"> {analysis?.late || 0} Late</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis?.submissionStatus.notSubmitted || 0}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      {analysis?.submissionStatus.notSubmitted ? 
                        <span className="text-red-600">Action required</span> : 
                        <span className="text-green-600">All submissions complete</span>}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{suggestions.length}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      {suggestions.filter(s => s.type === 'alert').length > 0 ? 
                        <span className="text-red-600">Some issues need attention</span> : 
                        <span className="text-green-600">No critical issues</span>}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" /> Attendance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analysis?.statusDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {(analysis?.statusDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <LineChartIcon className="h-5 w-5 mr-2" /> Monthly Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysis?.monthlyData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="attendance" stroke="#4CAF50" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course-wise Attendance</CardTitle>
                  <CardDescription>Detailed breakdown by course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">                    {analysis && Object.keys(analysis.coursesAnalysis || {}).map((course, index) => {
                      const courseData = analysis.coursesAnalysis[course] || { total: 0, present: 0, percentage: 0 };
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{course}</h4>
                            <span className={`font-bold ${courseData.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                              {courseData.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={courseData.percentage} 
                            className={`h-2 ${courseData.percentage < 75 ? 'bg-red-100' : 'bg-green-100'}`} 
                          />
                          <div className="text-xs text-gray-500">
                            Present: {courseData.present}/{courseData.total} classes
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="h-5 w-5 mr-2" /> Attendance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis?.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="attendance" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Records Tab */}
            <TabsContent value="records" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendance.map((record) => (
                  <Card key={record._id} className={
                    record.submissionStatus === 'not_submitted' ? 'border-yellow-300' : ''
                  }>
                    <CardHeader className="pb-2">
                      <CardTitle>{new Date(record.date).toLocaleDateString()}</CardTitle>
                      {record.submissionStatus === 'not_submitted' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full inline-block">
                          Submission Required
                        </span>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700 mb-2">Course: {record.course}</div>
                      <div className="text-sm text-gray-700 mb-2">Department: {record.department}</div>
                      <div className="text-sm font-medium mb-1">
                        Status: 
                        <span className={getStatusColor(record.status) + " ml-1"}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </div>
                      {record.remark && <div className="text-xs text-gray-500">Remark: {record.remark}</div>}
                    </CardContent>
                    {record.submissionStatus === 'not_submitted' && (
                      <CardFooter>
                        <Button size="sm" variant="outline" className="w-full">Submit Attendance</Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* AI Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" /> 
                AI-powered Attendance Improvement Suggestions
              </h3>
              
              {suggestions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No suggestions available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <Alert key={suggestion.id} className={`${getSuggestionColor(suggestion.type)} border`}>
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div>
                          <AlertTitle className="font-medium">{suggestion.message}</AlertTitle>
                          <AlertDescription className="text-sm mt-1">
                            {suggestion.description}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppLayout>
  );
};

export default StudentAttendancePage;
