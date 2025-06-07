import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Book, Calendar, CalendarIcon, CheckCircle, ChevronLeft, ChevronRight, Info, MessageSquare, Users, Brain } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

// ---------- Interfaces ----------
interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
  remark: string;
}

interface AttendanceRecord {
  _id: string;
  department: string;
  date: string;
  attendees: StudentAttendance[];
  createdAt: string;
}

interface CalendarAttendanceData {
  date: string;
  department: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

interface CalendarDayProps {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  attendanceData?: CalendarAttendanceData;
  onDayClick: (date: Date) => void;
}

interface AttendanceCalendarProps {
  attendanceData: AttendanceRecord[];
  students: Student[];
  onDateSelect: (date: string) => void;
  selectedDepartment: string;
}

type ActiveTab = 'mark' | 'history' | 'calendar';

const TeacherAttendancePortal: React.FC = () => {
  // States for marking attendance
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, StudentAttendance>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // States for attendance history
  const [historyData, setHistoryData] = useState<AttendanceRecord[]>([]);
  const [historyDepartment, setHistoryDepartment] = useState<string>('');
  const [historyDate, setHistoryDate] = useState<string>('');
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  // Active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('mark');

  // AI attendance analysis states
  const [isAIAttendanceDialogOpen, setIsAIAttendanceDialogOpen] = useState<boolean>(false);
  const [aiAttendanceReport, setAIAttendanceReport] = useState<string | null>(null);
  const [aiAttendanceLoading, setAIAttendanceLoading] = useState<boolean>(false);

  // FIXED: Use 'eduToken' instead of 'token' from localStorage
  const token = localStorage.getItem('eduToken');
  const { refreshToken } = useAuth();

  // ---------- Fetch Students & Derive Departments ----------
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        
        // Check if token exists first
        if (!token) {
          setError('Please log in to access attendance management');
          setLoading(false);
          return;
        }
        
        let response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || ''}/api/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok && response.status === 403) {
          // Only call refreshToken for actual 403 errors (token expiration)
          refreshToken();
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch students');
        const data: Student[] = await response.json();
        setStudents(data);
        
        // Initialize attendance record for every student with default status "present"
        const initialRecords: Record<string, StudentAttendance> = {};
        data.forEach((student: Student) => {
          initialRecords[student._id] = {
            studentId: student._id,
            status: 'present',
            remark: ''
          };
        });
        setAttendanceRecords(initialRecords);
        
        // Derive unique departments from the students
        const uniqueDepartments = Array.from(new Set(data.map((s) => s.department)));
        setDepartments(uniqueDepartments);
        if (uniqueDepartments.length > 0) {
          setSelectedDepartment(uniqueDepartments[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching students');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchStudents();
    }
  }, [token, refreshToken]);

  // ---------- Handlers for Marking Attendance ----------
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarkChange = (studentId: string, event: ChangeEvent<HTMLInputElement>) => {
    const remark = event.target.value;
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark }
    }));
  };

  const handleSubmitAttendance = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitStatus('');
    if (!selectedDepartment.trim()) {
      setError('Please select a valid department or course.');
      return;
    }
    setLoading(true);
    try {
      const attendees = Object.values(attendanceRecords).map(record => ({
        student: record.studentId,
        status: record.status,
        remark: record.remark,
      }));
      
      const payload = {
        department: selectedDepartment,
        date: selectedDate,
        attendees,
      };
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || ''}/api/attendance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Attendance submission failed');
      }
      
      await response.json();
      setSubmitStatus('Attendance successfully marked.');
    } catch (err: any) {
      setError(err.message || 'Error submitting attendance');
    } finally {
      setLoading(false);
    }  };

  // ---------- AI Attendance Analysis Handler ----------
  const handleAIAttendanceAnalysis = async () => {
    setAIAttendanceLoading(true);
    setAIAttendanceReport(null);
    setIsAIAttendanceDialogOpen(true);
    
    try {
      // Prepare attendance data for AI analysis
      const attendanceAnalysisData = {
        totalStudents: students.length,
        totalRecords: historyData.length,
        departmentData: departments.map(dept => {
          const deptStudents = students.filter(s => s.department === dept);
          const deptRecords = historyData.filter(r => r.department === dept);
          
          let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalExcused = 0;
          deptRecords.forEach(record => {
            record.attendees.forEach(attendee => {
              switch (attendee.status) {
                case 'present': totalPresent++; break;
                case 'absent': totalAbsent++; break;
                case 'late': totalLate++; break;
                case 'excused': totalExcused++; break;
              }
            });
          });
          
          const total = totalPresent + totalAbsent + totalLate + totalExcused;
          return {
            department: dept,
            studentCount: deptStudents.length,
            recordCount: deptRecords.length,
            attendanceRate: total > 0 ? Math.round((totalPresent / total) * 100) : 0,
            absenteeRate: total > 0 ? Math.round((totalAbsent / total) * 100) : 0,
            lateRate: total > 0 ? Math.round((totalLate / total) * 100) : 0,
            totalSessions: total
          };
        }),
        recentTrends: historyData.slice(0, 10).map(record => ({
          date: record.date,
          department: record.department,
          totalStudents: record.attendees.length,
          presentCount: record.attendees.filter(a => a.status === 'present').length,
          absentCount: record.attendees.filter(a => a.status === 'absent').length,
          lateCount: record.attendees.filter(a => a.status === 'late').length
        }))
      };

      const response = await fetch('/api/ai-attendance-analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceAnalysisData),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI attendance analysis');
      }

      const data = await response.json();
      setAIAttendanceReport(data.analysis || 'AI analysis completed successfully.');
    } catch (error) {
      console.error('Error getting AI attendance analysis:', error);
      // Provide fallback analysis
      setAIAttendanceReport(`AI Attendance Analysis Summary:

📊 **Overall Statistics:**
- Total Students: ${students.length}
- Total Attendance Records: ${historyData.length}
- Departments Tracked: ${departments.length}

🏢 **Department Breakdown:**
${departments.map(dept => {
  const deptStudents = students.filter(s => s.department === dept);
  const deptRecords = historyData.filter(r => r.department === dept);
  return `• ${dept}: ${deptStudents.length} students, ${deptRecords.length} records`;
}).join('\n')}

💡 **Recommendations:**
- Monitor departments with lower attendance rates
- Consider implementing early intervention for frequent absentees
- Track attendance patterns to identify optimal class scheduling
- Use data-driven insights to improve student engagement

📈 **Next Steps:**
- Review individual student attendance patterns
- Implement targeted support for students with attendance challenges
- Consider department-specific attendance policies based on data trends`);
    } finally {
      setAIAttendanceLoading(false);
    }
  };

  // Get status color for attendance badges
  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'excused': return '#6366f1';
      default: return '#9ca3af';
    }
  };

  // ---------- Fetch Attendance History ----------
  const fetchAttendanceHistory = async () => {
    if (!token) return;
    setHistoryLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (historyDepartment.trim()) queryParams.append('department', historyDepartment);
      if (historyDate) {
        queryParams.append('date', historyDate);
      }
      
      const url = `${process.env.REACT_APP_BACKEND_URL || ''}/api/attendance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok && response.status === 403) {
        refreshToken();
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch attendance history');
      const data: AttendanceRecord[] = await response.json();
      setHistoryData(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ---------- Export to CSV ----------
  const exportHistoryToCSV = () => {
    if (!historyData.length) {
      setError('No data to export');
      return;
    }
    const rows = historyData.map(record => [
      record.date.split('T')[0],
      record.department,
      record.attendees.length,
      record.attendees.filter(a => a.status === 'present').length,
      record.attendees.filter(a => a.status === 'absent').length,
      record.attendees.filter(a => a.status === 'late').length,
      record.attendees.filter(a => a.status === 'excused').length
    ]);
    
    const csvContent = [
      ['Date', 'Department', 'Total', 'Present', 'Absent', 'Late', 'Excused'],
      ...rows
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ---------- Calendar Components ----------
  const CalendarDay: React.FC<CalendarDayProps> = ({
    day,
    month,
    year,
    isCurrentMonth,
    isToday,
    attendanceData,
    onDayClick
  }) => {
    const hasData = !!attendanceData;
    const date = new Date(year, month, day);
    
    // Calculate attendance percentage if data exists
    const attendancePercentage = hasData 
      ? Math.round((attendanceData.present / attendanceData.total) * 100) 
      : 0;
    
    // Determine background color based on attendance percentage
    const getBackgroundColor = () => {
      if (!hasData) return 'bg-white';
      if (attendancePercentage >= 90) return 'bg-green-50';
      if (attendancePercentage >= 75) return 'bg-blue-50';
      if (attendancePercentage >= 50) return 'bg-yellow-50';
      return 'bg-red-50';
    };

    const getBorderColor = () => {
      if (!hasData) return 'border-gray-200';
      if (attendancePercentage >= 90) return 'border-green-200';
      if (attendancePercentage >= 75) return 'border-blue-200';
      if (attendancePercentage >= 50) return 'border-yellow-200';
      return 'border-red-200';
    };

    return (
      <div
        onClick={() => onDayClick(date)}
        className={`
          relative h-16 border cursor-pointer transition-colors hover:bg-gray-50
          ${getBackgroundColor()} ${getBorderColor()}
          ${!isCurrentMonth ? 'text-gray-400' : ''}
          ${isToday ? 'ring-2 ring-edu-primary' : ''}
        `}
      >
        <div className="p-1">
          <div className={`text-sm ${isToday ? 'font-bold text-edu-primary' : ''}`}>
            {day}
          </div>
          {hasData && (
            <div className="text-xs text-center mt-1">
              <div className="text-gray-600">{attendancePercentage}%</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
    attendanceData,
    students,
    onDateSelect,
    selectedDepartment
  }) => {
    // State for current calendar view
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<Record<string, CalendarAttendanceData>>({});
    
    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    // Get day of week of first day of month (0 = Sunday, 6 = Saturday)
    const getFirstDayOfMonth = (year: number, month: number) => {
      return new Date(year, month, 1).getDay();
    };
    
    // Process attendance data for calendar
    useEffect(() => {
      const processedData: Record<string, CalendarAttendanceData> = {};
      
      attendanceData.forEach(record => {
        if (selectedDepartment && record.department !== selectedDepartment) return;
        
        const dateKey = record.date.split('T')[0];
        let present = 0, absent = 0, late = 0, excused = 0;
        const totalStudents = record.attendees.length;
        
        record.attendees.forEach(attendee => {
          switch (attendee.status) {
            case 'present': present++; break;
            case 'absent': absent++; break;
            case 'late': late++; break;
            case 'excused': excused++; break;
          }
        });
        
        processedData[dateKey] = {
          date: dateKey,
          department: record.department,
          present,
          absent,
          late,
          excused,
          total: totalStudents
        };
      });
      
      setCalendarData(processedData);
    }, [attendanceData, students, selectedDepartment]);
    
    // Handle month navigation
    const prevMonth = () => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    
    const nextMonth = () => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };
    
    const goToToday = () => {
      setCurrentDate(new Date());
    };
    
    // Handle day click
    const handleDayClick = (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      onDateSelect(dateString);
    };
    
    // Generate calendar days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Create array of calendar days
    const calendarDays = [];
    
    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dateKey = new Date(year, month - 1, day).toLocaleDateString('en-CA');
      calendarDays.push(
        <CalendarDay
          key={`prev-${day}`}
          day={day}
          month={month - 1}
          year={year}
          isCurrentMonth={false}
          isToday={false}
          attendanceData={calendarData[dateKey]}
          onDayClick={handleDayClick}
        />
      );
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = new Date(year, month, day).toLocaleDateString('en-CA');
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      calendarDays.push(
        <CalendarDay
          key={`current-${day}`}
          day={day}
          month={month}
          year={year}
          isCurrentMonth={true}
          isToday={isToday}
          attendanceData={calendarData[dateKey]}
          onDayClick={handleDayClick}
        />
      );
    }
    
    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const dateKey = new Date(year, month + 1, day).toLocaleDateString('en-CA');
      calendarDays.push(
        <CalendarDay
          key={`next-${day}`}
          day={day}
          month={month + 1}
          year={year}
          isCurrentMonth={false}
          isToday={false}
          attendanceData={calendarData[dateKey]}
          onDayClick={handleDayClick}
        />
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center text-gray-800">
              <CalendarIcon size={20} className="mr-2 text-edu-primary" />
              Attendance Calendar
            </CardTitle>
            <div className="space-x-2">
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-edu-primary bg-edu-accent/20 rounded-md hover:bg-edu-accent/30"
              >
                Today
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">
              {monthNames[month]} {year}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={prevMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-50 mr-1 border border-green-200"></div>
              <span>≥90% Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-50 mr-1 border border-blue-200"></div>
              <span>75-89% Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-50 mr-1 border border-yellow-200"></div>
              <span>50-74% Present</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-50 mr-1 border border-red-200"></div>
              <span>&lt;50% Present</span>
            </div>
          </div>
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {calendarDays}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ---------- Rendering the Mark Attendance View ----------
  const renderMarkAttendance = () => (
    <div className="bg-white rounded-lg shadow">
      <form onSubmit={handleSubmitAttendance} className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-700" htmlFor="attendance-date">
              Date
            </label>
            <input
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-edu-accent focus:border-edu-accent"
              type="date"
              id="attendance-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-700" htmlFor="department-select">
              Department
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-edu-accent focus:border-edu-accent"
              id="department-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              required
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-edu-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : students.filter(student => student.department === selectedDepartment).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <Users size={48} />
            </div>
            <p className="text-gray-600">No students found for this department</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Attendance Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter(student => student.department === selectedDepartment)
                  .map((student, index) => (
                    <tr key={student._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center">
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex flex-wrap gap-2">
                          {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(status => (
                            <label 
                              key={status} 
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer border transition-colors
                                ${attendanceRecords[student._id]?.status === status ? 'text-white' : 'text-gray-700'}`}
                              style={{
                                backgroundColor: attendanceRecords[student._id]?.status === status 
                                  ? getStatusColor(status) 
                                  : 'transparent',
                                borderColor: getStatusColor(status)
                              }}
                            >
                              <input
                                type="radio"
                                name={`status-${student._id}`}
                                value={status}
                                checked={attendanceRecords[student._id]?.status === status}
                                onChange={() => handleStatusChange(student._id, status)}
                                className="sr-only"
                              />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <input
                          type="text"
                          placeholder="Add a remark (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-edu-accent focus:border-edu-accent"
                          value={attendanceRecords[student._id]?.remark || ''}
                          onChange={(e) => handleRemarkChange(student._id, e)}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-3 mb-6 bg-red-50 text-red-700 rounded-md">
            <Info size={20} />
            <span>{error}</span>
          </div>
        )}
        
        {submitStatus && (
          <div className="flex items-center gap-3 p-3 mb-6 bg-green-50 text-green-700 rounded-md">
            <CheckCircle size={20} />
            <span>{submitStatus}</span>
          </div>
        )}

        <button 
          type="submit" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-edu-primary text-white font-medium rounded-md hover:bg-edu-primary/90 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Submit Attendance
            </>
          )}
        </button>
      </form>
    </div>
  );

  // ---------- Rendering the Attendance History View ----------
  const renderAttendanceHistory = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-700" htmlFor="history-department">
              Department Filter
            </label>
            <select
              id="history-department"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-edu-accent focus:border-edu-accent"
              value={historyDepartment}
              onChange={(e) => setHistoryDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-700" htmlFor="history-date">
              Date Filter
            </label>
            <input
              id="history-date"
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-edu-accent focus:border-edu-accent"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchAttendanceHistory}
              className="px-4 py-2 bg-edu-primary text-white font-medium rounded-md hover:bg-edu-primary/90 transition-colors"
              disabled={historyLoading}
            >
              {historyLoading ? 'Loading...' : 'Search'}
            </button>
            <button
              onClick={exportHistoryToCSV}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              disabled={!historyData.length || historyLoading}
            >
              Export CSV
            </button>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-edu-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar size={48} />
            </div>
            <p className="text-gray-600">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Present</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Absent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Late</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Excused</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map(record => {
                  const present = record.attendees.filter(a => a.status === 'present').length;
                  const absent = record.attendees.filter(a => a.status === 'absent').length;
                  const late = record.attendees.filter(a => a.status === 'late').length;
                  const excused = record.attendees.filter(a => a.status === 'excused').length;
                  
                  return (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.attendees.length}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {present}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {absent}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {late}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {excused}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => {
                            setSelectedDate(record.date.split('T')[0]);
                            setSelectedDepartment(record.department);
                            setActiveTab('mark');
                          }}
                          className="px-3 py-1 text-sm bg-edu-accent/20 text-edu-primary rounded-md hover:bg-edu-accent/30 transition-colors"
                        >
                          View/Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ---------- Dashboard Statistics Cards ----------
  const renderDashboardStats = () => {
    // Calculate statistics from history data
    let totalRecords = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalStudents = 0;

    historyData.forEach(record => {
      record.attendees.forEach(attendee => {
        totalStudents++;
        switch (attendee.status) {
          case 'present': totalPresent++; break;
          case 'absent': totalAbsent++; break;
          case 'late': totalLate++; break;
          case 'excused': totalExcused++; break;
        }
      });
      totalRecords++;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">        <DashboardCard
          title="Total Records"
          value={totalRecords.toString()}
          icon={<Book className="h-8 w-8 text-blue-600" />}
          trend={{ value: 0, direction: "up" }}
        />        <DashboardCard
          title="Present"
          value={totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) + '%' : '0%'}
          icon={<CheckCircle className="h-8 w-8 text-green-600" />}
          trend={{ value: 0, direction: "up" }}
        />        <DashboardCard
          title="Absent"
          value={totalStudents > 0 ? Math.round((totalAbsent / totalStudents) * 100) + '%' : '0%'}
          icon={<Users className="h-8 w-8 text-red-600" />}
          trend={{ value: 0, direction: "up" }}
        />        <DashboardCard
          title="Late/Excused"
          value={totalStudents > 0 ? Math.round(((totalLate + totalExcused) / totalStudents) * 100) + '%' : '0%'
          }
          icon={<MessageSquare className="h-8 w-8 text-yellow-600" />}
          trend={{ value: 0, direction: "up" }}
        />
      </div>
    );
  };

  const renderCalendarView = () => (
    <div className="mb-6">
      <AttendanceCalendar
        attendanceData={historyData}
        students={students}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setActiveTab('mark');
        }}
        selectedDepartment={historyDepartment}
      />
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
              <p className="text-gray-600">Track and manage student attendance efficiently</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleAIAttendanceAnalysis}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={aiAttendanceLoading || historyData.length === 0}
              >
                <Brain className="mr-2 h-4 w-4" />
                {aiAttendanceLoading ? 'Analyzing...' : 'AI Attendance Analysis'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'mark'
                ? 'border-edu-primary text-edu-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-edu-primary text-edu-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Attendance History
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-edu-primary text-edu-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendar View
          </button>
        </div>

        {/* Dashboard Statistics */}
        {activeTab !== 'mark' && renderDashboardStats()}        {/* Tab Content */}
        {activeTab === 'mark' && renderMarkAttendance()}
        {activeTab === 'history' && renderAttendanceHistory()}
        {activeTab === 'calendar' && renderCalendarView()}

        {/* AI Attendance Analysis Dialog */}
        <Dialog open={isAIAttendanceDialogOpen} onOpenChange={setIsAIAttendanceDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Attendance Analysis
              </DialogTitle>
              <DialogDescription>
                Comprehensive AI-powered analysis of attendance patterns, trends, and recommendations for improvement.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {aiAttendanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Analyzing attendance data...</span>
                </div>
              ) : aiAttendanceReport ? (
                <div className="prose max-w-none">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mb-4">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">AI-Generated Attendance Insights</h4>
                    <p className="text-xs text-purple-600">This analysis is generated by AI based on attendance data and should be reviewed by educators for accuracy.</p>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                    {aiAttendanceReport}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Brain size={48} />
                  </div>
                  <p className="text-gray-600">No analysis available.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAIAttendanceDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default TeacherAttendancePortal;