import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Mail, Plus, Trash2, Search, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  students?: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ManageStudents: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token || !courseId) {
        setError('Missing required information');
        setIsLoading(false);
        return;
      }

      const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
      });

      try {
        // Fetch course details
        const courseResponse = await api.get(`/api/courses/${courseId}`);
        const courseData = courseResponse.data as Course;
        setCourse(courseData);

        // Fetch enrolled students using dedicated endpoint
        const enrolledResponse = await api.get(`/api/courses/${courseId}/students`);
        const enrolledData = enrolledResponse.data as Student[];
        setEnrolledStudents(enrolledData);

        // Fetch all students for adding new ones
        const studentsResponse = await api.get('/api/students');
        const studentsData = studentsResponse.data as Student[];
        setAllStudents(studentsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load student data. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [courseId, user, token]);
  const addStudentToCourse = async (student: Student) => {
    if (!course || !token) return;
    
    try {
      const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
      });

      await api.post(`/api/courses/${courseId}/students`, {
        studentId: student._id
      });

      // Update local state
      setEnrolledStudents([...enrolledStudents, student]);
      setCourse({
        ...course,
        students: [...(course.students || []), student._id]
      });
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student. Please try again.');
    }
    setIsAddDialogOpen(false);
  };
  const removeStudentFromCourse = async (studentId: string) => {
    if (!course || !token) return;
    
    try {
      const api = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
      });

      await api.delete(`/api/courses/${courseId}/students/${studentId}`);

      // Update local state
      setEnrolledStudents(enrolledStudents.filter(s => s._id !== studentId));
      setCourse({
        ...course,
        students: course.students?.filter(id => id !== studentId) || []
      });
    } catch (err) {
      console.error('Error removing student:', err);
      setError('Failed to remove student. Please try again.');
    }
  };

  const filteredAvailableStudents = allStudents.filter(student => 
    !course?.students?.includes(student._id) &&
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <AppLayout pageTitle="Manage Students">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading student data...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Manage Students">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/teacher/courses')}
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Courses
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
              <p className="text-gray-500">
                {course ? `${course.name} (${course.code})` : 'Course not found'}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus size={16} className="mr-1" /> Add Student
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Enrolled Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Enrolled Students ({enrolledStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students enrolled in this course yet.
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledStudents.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-edu-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={12} /> {student.email}
                        </p>
                      </div>
                      <Badge variant="secondary">{student.department}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeStudentFromCourse(student._id)}
                    >
                      <Trash2 size={14} className="mr-1" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Student Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Students to Course</DialogTitle>
              <DialogDescription>
                Select students to add to {course?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredAvailableStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available students found.
                  </div>
                ) : (
                  filteredAvailableStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        <Badge variant="outline">{student.department}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addStudentToCourse(student)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ManageStudents;
