import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Clock, AlertCircle, Check, TrendingUp } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentAttendancePortal = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // State for attendance data
  const [attendanceSummary, setAttendanceSummary] = useState({
    summary: { present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0 },
    monthlyData: []
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [departmentAttendance, setDepartmentAttendance] = useState([]);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    dailyStatus: []
  });

  // Colors for charts and status indicators
  const COLORS = ['#4CAF50', '#F44336', '#FFC107', '#2196F3', '#9E9E9E'];
  const STATUS_COLORS = {
    present: '#4CAF50',
    absent: '#F44336',
    late: '#FFC107',
    excused: '#2196F3',
    unknown: '#9E9E9E',
  };

  // Helper functions
  const formatDate = (dateString) => {
    const options = { weekday: 'long' as const, year: 'numeric' as const, month: 'long' as const, day: 'numeric' as const };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // Get student ID from local storage or context
        const studentId = localStorage.getItem('studentId') || 'current-user';
          // Fetch attendance summary
        const summaryResponse = await fetch(`${API_BASE_URL}/api/student/attendance/summary/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eduToken')}`
          }
        });

        // Fetch attendance records
        const recordsResponse = await fetch(`${API_BASE_URL}/api/student/attendance/records/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eduToken')}`
          }
        });

        // Fetch department comparison
        const departmentResponse = await fetch(`${API_BASE_URL}/api/student/attendance/departments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eduToken')}`
          }
        });

        // Fetch streak data
        const streakResponse = await fetch(`${API_BASE_URL}/api/student/attendance/streak/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eduToken')}`
          }
        });

        if (!summaryResponse.ok || !recordsResponse.ok || !departmentResponse.ok || !streakResponse.ok) {
          throw new Error('Failed to fetch attendance data');
        }

        const summaryData = await summaryResponse.json();
        const recordsData = await recordsResponse.json();
        const departmentData = await departmentResponse.json();
        const streakData = await streakResponse.json();

        setAttendanceSummary(summaryData);
        setAttendanceRecords(recordsData.records);
        setDepartmentAttendance(departmentData.departments);
        setStreakData(streakData);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // Tab content renderers
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="mr-4 text-green-500">
              <Check size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-xl font-bold">{attendanceSummary.summary.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="mr-4 text-red-500">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-xl font-bold">{attendanceSummary.summary.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="mr-4 text-yellow-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Late</p>
              <p className="text-xl font-bold">{attendanceSummary.summary.late}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="mr-4 text-blue-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-xl font-bold">{attendanceSummary.summary.attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Chart */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Monthly Attendance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={attendanceSummary.monthlyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#4CAF50" name="Present" />
              <Bar dataKey="absent" fill="#F44336" name="Absent" />
              <Bar dataKey="late" fill="#FFC107" name="Late" />
              <Bar dataKey="excused" fill="#2196F3" name="Excused" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Rate and Department Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Attendance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: attendanceSummary.summary.present },
                    { name: 'Absent', value: attendanceSummary.summary.absent },
                    { name: 'Late', value: attendanceSummary.summary.late },
                    { name: 'Excused', value: attendanceSummary.summary.excused },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {[0, 1, 2, 3].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Department Attendance Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentAttendance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="department" type="category" width={100} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="attendanceRate" fill="#2196F3" name="Attendance Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceHistoryTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${record.status === 'present' ? 'bg-green-100 text-green-800' : ''} 
                        ${record.status === 'absent' ? 'bg-red-100 text-red-800' : ''} 
                        ${record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : ''} 
                        ${record.status === 'excused' ? 'bg-blue-100 text-blue-800' : ''} 
                        ${record.status === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}`}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.remark || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.recordedBy}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStreakTab = () => (
    <div className="space-y-6">
      {/* Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
          <div className="flex items-center">
            <div className="mr-4 text-yellow-500">
              <TrendingUp size={36} />
            </div>
            <div>
              <p className="text-3xl font-bold">{streakData.currentStreak} days</p>
              <p className="text-gray-500">Current attendance streak</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Longest Streak</h3>
          <div className="flex items-center">
            <div className="mr-4 text-green-500">
              <TrendingUp size={36} />
            </div>
            <div>
              <p className="text-3xl font-bold">{streakData.longestStreak} days</p>
              <p className="text-gray-500">Longest attendance streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">30-Day Attendance Calendar</h3>
        <div className="grid grid-cols-7 gap-2">
          {streakData.dailyStatus.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs mb-1">{day.dayOfWeek}</div>
              <div 
                className="h-8 w-8 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: STATUS_COLORS[day.status] || '#9E9E9E' }}
              >
                <span className="text-white text-xs font-bold">
                  {new Date(day.date).getDate()}
                </span>
              </div>
              <div className="text-xs mt-1 truncate">
                {day.status !== 'unknown' ? day.status.charAt(0).toUpperCase() + day.status.slice(1) : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout pageTitle="My Attendance">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Attendance</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  className={`py-4 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`py-4 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  Attendance History
                </button>
                <button
                  className={`py-4 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'streak'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('streak')}
                >
                  Attendance Streak
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'history' && renderAttendanceHistoryTab()}
            {activeTab === 'streak' && renderStreakTab()}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentAttendancePortal;