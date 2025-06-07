import React, { useState, useEffect } from 'react';
import {
  Book, Calendar, Edit, Trash2, Plus, Users, MessageSquare, ChevronRight, Settings, Brain, Clock, GraduationCap, TrendingUp, Search, Loader2, AlertCircle, Key, X
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Course {
  _id: string;
  name: string;
  code: string;
  teacher: string;
  schedule?: string[];
  description?: string;
  students?: string[];
  materials?: { title: string; url: string; type?: string }[];
  category?: string;
  difficulty?: string;
  duration?: string;
  rating?: number;
  enrollmentCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AIScheduleSuggestion {
  timeSlot: string;
  reasoning: string;
  conflictLevel: 'low' | 'medium' | 'high';
  confidence: number;
  alternativeSlots?: string[];
  dayOfWeek: string;
  timeRange: string;
}

interface AICourseContent {
  modules: Array<{
    title: string;
    description: string;
    duration: string;
    topics: string[];
    learningObjectives: string[];
    difficulty: string;
  }>;
  materials: Array<{
    title: string;
    type: 'video' | 'document' | 'interactive' | 'quiz' | 'assignment' | 'reading';
    description: string;
    url?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
  }>;
  assignments: Array<{
    title: string;
    type: string;
    description: string;
    rubric: string;
    estimatedHours: number;
    dueWeek: number;
  }>;
  assessmentMethods: string[];
  technologyTools: string[];
  bestPractices: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  weeklyPlan: Array<{
    week: number;
    topic: string;
    activities: string[];
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TeacherCoursesPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [aiLoading, setAILoading] = useState(false);
  const [aiScheduleSuggestions, setAIScheduleSuggestions] = useState<AIScheduleSuggestion[]>([]);
  const [aiContentSuggestions, setAIContentSuggestions] = useState<AICourseContent | null>(null);
  const [aiInsights, setAIInsights] = useState<any>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isAIScheduleDialogOpen, setIsAIScheduleDialogOpen] = useState(false);
  const [isAIContentDialogOpen, setIsAIContentDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [manageStudentsCourse, setManageStudentsCourse] = useState<Course | null>(null);
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', code: '', description: '', category: 'technology', difficulty: 'beginner', duration: '', schedule: [''], materials: [{ title: '', url: '', type: 'document' }]
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(localStorage.getItem('geminiApiKey'));
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });

  useEffect(() => { if (!user) return; fetchCoursesData(); }, [user, token]);
  useEffect(() => {
    let filtered = courses;
    if (searchTerm) filtered = filtered.filter(course => course.name.toLowerCase().includes(searchTerm.toLowerCase()) || course.code.toLowerCase().includes(searchTerm.toLowerCase()) || course.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterCategory !== 'all') filtered = filtered.filter(course => course.category === filterCategory);
    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterCategory]);
  const fetchCoursesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [coursesResponse, studentsResponse] = await Promise.all([
        api.get('/api/teacher/courses'),
        api.get('/api/students')
      ]);
      setCourses(coursesResponse.data as Course[]);
      setStudents(studentsResponse.data as Student[]);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- AI Features with better error handling ---
  const requireGeminiKey = async (): Promise<string> => {
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      setIsApiKeyDialogOpen(true);
      throw new Error('Gemini API key required');
    }
    return geminiApiKey;
  };

  const makeAIRequest = async (endpoint: string, data: any) => {
    try {
      const apiKey = await requireGeminiKey();
      const response = await api.post(endpoint, { ...data, geminiApiKey: apiKey });
      return response.data;
    } catch (error: any) {
      if (error.message === 'Gemini API key required') {
        throw error;
      }
      console.error(`AI request failed for ${endpoint}:`, error);
      throw new Error(`AI service temporarily unavailable. Please try again later.`);
    }
  };  const handleGetAIScheduleSuggestions = async () => {
    setAILoading(true);
    try {
      const data = await makeAIRequest('/api/ai-schedule-suggestions', {
        courseName: formData.name || 'New Course',
        courseCode: formData.code || 'TEMP101',
        department: user?.department || 'Computer Science',
        estimatedStudents: 30,
        preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        preferredTimes: ['09:00', '11:00', '14:00', '16:00']
      });
      setAIScheduleSuggestions((data as any)?.suggestions || []);
      setIsAIScheduleDialogOpen(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAILoading(false);
    }
  };

  const handleGetAIContentSuggestions = async () => {
    setAILoading(true);
    try {
      const data = await makeAIRequest('/api/ai-content-suggestions', {
        courseName: formData.name || 'General Course',
        courseCode: formData.code || 'GEN101',
        department: user?.department || 'Computer Science',
        courseLevel: 'undergraduate',
        topics: formData.description || 'General topics',
        learningObjectives: 'Students will learn core concepts'
      });
      setAIContentSuggestions(data as AICourseContent);
      setIsAIContentDialogOpen(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAILoading(false);
    }
  };

  const handleGetAIInsights = async (course: Course) => {
    setAILoading(true);
    try {
      const data = await makeAIRequest('/api/ai-course-insights', {
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        description: course.description
      });
      setAIInsights(data);
      setShowAIPanel(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setAILoading(false);
    }
  };
  // --- Feedback Form Navigation with AI ---
  const handleCreateFeedbackForm = async (course: Course) => {
    try {
      setAILoading(true);
      // Get student names using AI
      const studentNames = await getAIStudentNames(course);
      navigate('/teacher/feedback', {
        state: { 
          courseId: course._id, 
          courseName: course.name, 
          courseCode: course.code, 
          studentNames 
        }
      });
    } catch (error: any) {
      console.error('Error creating feedback form:', error);
      // Fallback to regular student names
      const fallbackNames = getStudentNames(course.students);
      navigate('/feedback/TeacherFeedbackManagement', {
        state: { 
          courseId: course._id, 
          courseName: course.name, 
          courseCode: course.code, 
          studentNames: fallbackNames 
        }
      });
    } finally {
      setAILoading(false);
    }
  };

  const getAIStudentNames = async (course: Course): Promise<string[]> => {
    try {
      const data = await makeAIRequest('/api/ai-feedback-student-names', {
        courseId: course._id,
        courseName: course.name,
        studentIds: course.students || []
      });
      return (data as any)?.studentNames || getStudentNames(course.students);
    } catch (error) {
      return getStudentNames(course.students);
    }
  };

  // --- Student Management ---
  const getStudentNames = (studentIds: string[] = []) => {
    if (!Array.isArray(studentIds) || !Array.isArray(students)) return [];
    return studentIds.map(id => {
      const student = students.find(s => s._id === id || s.email === id || s.name === id);
      return student ? student.name : 'Unknown Student';
    });
  };
  const getAvailableStudents = (course: Course) => {
    if (!Array.isArray(students) || !course) return [];
    return students.filter(student =>
      !(Array.isArray(course.students) ? course.students : []).includes(student._id) &&
      student.name.toLowerCase().includes(searchStudentTerm.toLowerCase())
    );
  };
  const getEnrolledStudents = (course: Course) => {
    if (!Array.isArray(students) || !course) return [];
    return students.filter(student =>
      (Array.isArray(course.students) ? course.students : []).includes(student._id)
    );
  };
  const handleAddStudentToCourse = async (studentId: string) => {
    if (!manageStudentsCourse) return;
    try {
      await api.post(`/api/courses/${manageStudentsCourse._id}/students`, { studentId });
      // Re-fetch enrolled students
      const response = await api.get(`/api/courses/${manageStudentsCourse._id}/students`);
      setEnrolledStudents(response.data as Student[]);
      setCourses(courses.map(course =>
        course._id === manageStudentsCourse._id
          ? { ...course, students: [...(course.students || []), studentId] }
          : course
      ));
      setManageStudentsCourse({
        ...manageStudentsCourse,
        students: [...(manageStudentsCourse.students || []), studentId]
      });
    } catch (error: any) {
      setError('Failed to add student to course.');
    }
  };
  const handleRemoveStudentFromCourse = async (studentId: string) => {
    if (!manageStudentsCourse) return;
    try {
      await api.delete(`/api/courses/${manageStudentsCourse._id}/students/${studentId}`);
      // Re-fetch enrolled students
      const response = await api.get(`/api/courses/${manageStudentsCourse._id}/students`);
      setEnrolledStudents(response.data as Student[]);
      setCourses(courses.map(course =>
        course._id === manageStudentsCourse._id
          ? { ...course, students: (course.students || []).filter(id => id !== studentId) }
          : course
      ));
      setManageStudentsCourse({
        ...manageStudentsCourse,
        students: (manageStudentsCourse.students || []).filter(id => id !== studentId)
      });
    } catch (error: any) {
      setError('Failed to remove student from course.');
    }
  };

  // --- CRUD Dialog Handlers ---
  const handleCreateCourse = () => {
    setFormData({
      name: '', code: '', description: '', category: 'technology', difficulty: 'beginner', duration: '', schedule: [''], materials: [{ title: '', url: '', type: 'document' }]
    });
    setIsCreateDialogOpen(true);
  };
  const handleEditCourse = (course: Course) => {
    setCurrentCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description || '',
      category: course.category || 'technology',
      difficulty: course.difficulty || 'beginner',
      duration: course.duration || '',
      schedule: course.schedule || [''],
      materials: course.materials?.map(m => ({ title: m.title, url: m.url, type: m.type || 'document' })) || [{ title: '', url: '', type: 'document' }]
    });
    setIsEditDialogOpen(true);
  };
  const handleDeleteCourse = (course: Course) => {
    setCurrentCourse(course);
    setIsDeleteDialogOpen(true);
  };
  const handleManageStudents = (course: Course) => {
    setManageStudentsCourse(course);
    setIsManageStudentsDialogOpen(true);
  };
  const handleOpenManageStudents = async (course: Course) => {
    setManageStudentsCourse(course);
    setIsManageStudentsDialogOpen(true);
    setSearchStudentTerm('');
    try {
      setIsLoading(true);
      // Fetch enrolled students for this course
      const response = await api.get(`/api/courses/${course._id}/students`);
      setEnrolledStudents(response.data as Student[]);
    } catch (err) {
      setError('Failed to fetch enrolled students');
      setEnrolledStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Form Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleScheduleChange = (index: number, value: string) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule[index] = value;
    setFormData({ ...formData, schedule: updatedSchedule });
  };
  const addScheduleSlot = () => {
    setFormData({ ...formData, schedule: [...formData.schedule, ''] });
  };
  const removeScheduleSlot = (index: number) => {
    const updatedSchedule = [...formData.schedule];
    updatedSchedule.splice(index, 1);
    setFormData({ ...formData, schedule: updatedSchedule });
  };
  const handleMaterialChange = (index: number, field: 'title' | 'url', value: string) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index][field] = value;
    setFormData({ ...formData, materials: updatedMaterials });
  };
  const addMaterial = () => {
    setFormData({ ...formData, materials: [...formData.materials, { title: '', url: '', type: 'document' }] });
  };
  const removeMaterial = (index: number) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials.splice(index, 1);
    setFormData({ ...formData, materials: updatedMaterials });
  };

  // --- CRUD Submit Handlers ---
  const handleCreateSubmit = async () => {
    try {
      setIsLoading(true);
      const filteredSchedule = formData.schedule.filter(s => s.trim() !== '');
      const filteredMaterials = formData.materials.filter(m => m.title.trim() !== '' || m.url.trim() !== '');
      const newCourse = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        teacher: user?.id,
        schedule: filteredSchedule,
        materials: filteredMaterials,
        students: []
      };
      try {
        const response = await api.post('/api/courses', newCourse);
        setCourses([...courses, { ...newCourse, _id: (response.data as Course)._id }]);
      } catch {
        setCourses([...courses, { ...newCourse, _id: `temp-${Date.now()}` }]);
      }
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError('Error creating course.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleEditSubmit = async () => {
    if (!currentCourse) return;
    try {
      setIsLoading(true);
      const filteredSchedule = formData.schedule.filter(s => s.trim() !== '');
      const filteredMaterials = formData.materials.filter(m => m.title.trim() !== '' || m.url.trim() !== '');
      const updatedCourse = {
        ...currentCourse,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        schedule: filteredSchedule,
        materials: filteredMaterials
      };
      try {
        await api.put(`/api/courses/${currentCourse._id}`, updatedCourse);
        setCourses(courses.map(c => c._id === currentCourse._id ? updatedCourse : c));
      } catch {
        setCourses(courses.map(c => c._id === currentCourse._id ? updatedCourse : c));
      }
      setIsEditDialogOpen(false);
    } catch (err) {
      setError('Error editing course.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteSubmit = async () => {
    if (!currentCourse) return;
    try {
      setIsLoading(true);
      try {
        await api.delete(`/api/courses/${currentCourse._id}`);
        setCourses(courses.filter(c => c._id !== currentCourse._id));
      } catch {
        setCourses(courses.filter(c => c._id !== currentCourse._id));
      }
      setIsDeleteDialogOpen(false);
    } catch (err) {
      setError('Error deleting course.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- AI Apply Handlers ---
  const applyScheduleSuggestion = (suggestion: AIScheduleSuggestion) => {
    setFormData({ ...formData, schedule: [...formData.schedule, suggestion.timeSlot] });
    setIsAIScheduleDialogOpen(false);
  };
  const applyContentSuggestion = (type: 'materials' | 'all') => {
    if (!aiContentSuggestions) return;
    if (type === 'materials') {
      const newMaterials = aiContentSuggestions.materials.map(mat => ({
        title: mat.title,
        url: `${mat.type}: ${mat.description}`,
        type: mat.type as string
      }));
      setFormData({ ...formData, materials: [...formData.materials, ...newMaterials] });
    } else if (type === 'all') {
      const newMaterials = aiContentSuggestions.materials.map(mat => ({
        title: mat.title,
        url: `${mat.type}: ${mat.description}`,
        type: mat.type as string
      }));
      setFormData({
        ...formData,
        description: formData.description + '\n\nAI-Generated Content:\n' + aiContentSuggestions.modules.map(mod => `• ${mod.title}: ${mod.description}`).join('\n'),
        materials: [...formData.materials, ...newMaterials]
      });
    }
    setIsAIContentDialogOpen(false);
  };

  // --- UI/UX ---
  if (isLoading && courses.length === 0) {
    return (
      <AppLayout pageTitle="Manage Courses">
        <div className="flex flex-col items-center justify-center h-96 animate-pulse">
          <Loader2 size={48} className="mb-4 animate-spin text-edu-primary" />
          <span className="text-2xl text-gray-500 font-semibold">Loading your courses...</span>
        </div>
      </AppLayout>
    );
  }
  if (error) {
    return (
      <AppLayout pageTitle="Manage Courses">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle size={40} className="text-red-500 mb-2" />
          <span className="text-xl text-red-500 font-semibold">{error}</span>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout pageTitle="Course Management">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="text-blue-600" size={32} />
            Course Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your courses and leverage AI-powered tools</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsApiKeyDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Key size={16} />
            API Settings
          </Button>
          <Button onClick={handleCreateCourse} className="flex items-center gap-2">
            <Plus size={16} />
            New Course
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="mathematics">Mathematics</SelectItem>
            <SelectItem value="language">Language</SelectItem>
            <SelectItem value="arts">Arts</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {courses.length === 0 ? "No courses yet" : "No courses match your search"}
          </h3>
          <p className="text-gray-500 mb-4">
            {courses.length === 0 ? "Start by creating your first course" : "Try adjusting your search terms"}
          </p>
          {courses.length === 0 && (
            <Button onClick={handleCreateCourse}>Create your first course</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Book className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{course.code}</p>
                      <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                        {course.name}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCourse(course)}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteCourse(course)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description || 'No description provided'}
                </p>
                
                {/* Schedule */}
                {course.schedule && course.schedule.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Schedule</p>
                    <div className="flex flex-wrap gap-1">
                      {course.schedule.slice(0, 2).map((time, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                          <Clock size={10} />
                          {time}
                        </span>
                      ))}
                      {course.schedule.length > 2 && (
                        <span className="text-xs text-gray-500">+{course.schedule.length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Students Count */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Enrollment</p>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Users size={14} />
                    {/* Show live enrolled count if dialog is open for this course, else fallback to course.students?.length */}
                    {isManageStudentsDialogOpen && manageStudentsCourse && manageStudentsCourse._id === course._id
                      ? enrolledStudents.length
                      : course.students?.length || 0} students
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenManageStudents(course)}
                    className="flex-1"
                  >
                    <Users size={14} className="mr-1" />
                    Students
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCreateFeedbackForm(course)}
                    className="flex-1"
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <MessageSquare size={14} className="mr-1" />
                    )}
                    Feedback
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleGetAIInsights(course)}
                    disabled={aiLoading}
                    className="w-full mt-2"
                  >
                    {aiLoading ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Brain size={14} className="mr-1" />
                    )}
                    AI Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      {/* Create/Edit Course Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreateDialogOpen ? 'Create New Course' : 'Edit Course'}</DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen ? 'Fill in the details to create a new course' : 'Update the course information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., CS101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Course description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="arts">Arts</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 12 weeks"
                />
              </div>
            </div>
            
            {/* Schedule Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Schedule</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetAIScheduleSuggestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Brain size={14} className="mr-1" />}
                    AI Suggest
                  </Button>
                  <Button type="button" size="sm" onClick={addScheduleSlot}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {formData.schedule.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={time}
                      onChange={(e) => handleScheduleChange(index, e.target.value)}
                      placeholder="e.g., Monday 10:00-12:00"
                      className="flex-1"
                    />
                    {formData.schedule.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeScheduleSlot(index)}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Course Materials</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetAIContentSuggestions}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Brain size={14} className="mr-1" />}
                    AI Suggest
                  </Button>
                  <Button type="button" size="sm" onClick={addMaterial}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={material.title}
                      onChange={(e) => handleMaterialChange(index, 'title', e.target.value)}
                      placeholder="Material title"
                      className="flex-1"
                    />
                    <Input
                      value={material.url}
                      onChange={(e) => handleMaterialChange(index, 'url', e.target.value)}
                      placeholder="URL or description"
                      className="flex-1"
                    />
                    {formData.materials.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={isCreateDialogOpen ? handleCreateSubmit : handleEditSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {isCreateDialogOpen ? 'Create Course' : 'Update Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentCourse?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={isManageStudentsDialogOpen} onOpenChange={setIsManageStudentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Students - {manageStudentsCourse?.name}</DialogTitle>
            <DialogDescription>
              Add or remove students from this course
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Available Students */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Available Students</h4>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search..."
                    value={searchStudentTerm}
                    onChange={(e) => setSearchStudentTerm(e.target.value)}
                    className="pl-8 w-48"
                  />
                </div>
              </div>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {manageStudentsCourse && getAvailableStudents(manageStudentsCourse).length > 0 ? (
                  getAvailableStudents(manageStudentsCourse).map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddStudentToCourse(student._id)}
                        className="shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    {searchStudentTerm ? 'No students found' : 'No available students'}
                  </div>
                )}
              </div>
            </div>

            {/* Enrolled Students */}
            <div>
              <h4 className="font-medium mb-4">
                Enrolled Students ({enrolledStudents.length})
              </h4>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {enrolledStudents.length > 0 ? (
                  enrolledStudents.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRemoveStudentFromCourse(student._id)}
                        className="shrink-0"
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No students enrolled
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsManageStudentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Schedule Suggestions Dialog */}
      <Dialog open={isAIScheduleDialogOpen} onOpenChange={setIsAIScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Schedule Suggestions</DialogTitle>
            <DialogDescription>AI-generated schedule recommendations based on your course details</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" />
                Generating suggestions...
              </div>
            ) : aiScheduleSuggestions.length > 0 ? (
              <div className="space-y-3">
                {aiScheduleSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{suggestion.timeSlot}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${
                        suggestion.conflictLevel === 'low' ? 'bg-green-100 text-green-700' :
                        suggestion.conflictLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {suggestion.conflictLevel} conflict
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.reasoning}</p>
                    <Button size="sm" onClick={() => applyScheduleSuggestion(suggestion)}>
                      Apply This Schedule
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No schedule suggestions available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIScheduleDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Content Suggestions Dialog */}
      <Dialog open={isAIContentDialogOpen} onOpenChange={setIsAIContentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Content Suggestions</DialogTitle>
            <DialogDescription>AI-generated course content and materials</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" />
                Generating content suggestions...
              </div>
            ) : aiContentSuggestions ? (
              <div className="space-y-6">
                {/* Modules */}
                {aiContentSuggestions.modules && aiContentSuggestions.modules.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Course Modules</h4>
                    <div className="space-y-2">
                      {aiContentSuggestions.modules.map((module, index) => (
                        <div key={index} className="border rounded p-3">
                          <h5 className="font-medium">{module.title}</h5>
                          <p className="text-sm text-gray-600">{module.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Duration: {module.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materials */}
                {aiContentSuggestions.materials && aiContentSuggestions.materials.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Suggested Materials</h4>
                    <div className="space-y-2">
                      {aiContentSuggestions.materials.map((material, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{material.title}</h5>
                              <p className="text-sm text-gray-600">{material.description}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {material.type}
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {material.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => applyContentSuggestion('materials')}>
                    Apply Materials Only
                  </Button>
                  <Button variant="outline" onClick={() => applyContentSuggestion('all')}>
                    Apply All Content
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No content suggestions available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIContentDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Insights Dialog */}
      <Dialog open={showAIPanel} onOpenChange={setShowAIPanel}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Course Insights</DialogTitle>
            <DialogDescription>
              AI-powered analytics and recommendations for your course
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" />
                Analyzing course data...
              </div>
            ) : aiInsights ? (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp size={18} className="text-green-600" />
                      Performance Metrics
                    </h4>
                    {aiInsights.coursePerformance ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Average Grade:</span>
                          <span className="font-medium">{aiInsights.coursePerformance.averageGrade}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance Rate:</span>
                          <span className="font-medium">{aiInsights.coursePerformance.attendanceRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completion Rate:</span>
                          <span className="font-medium">{aiInsights.coursePerformance.completionRate}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No performance data available</p>
                    )}
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users size={18} className="text-blue-600" />
                      Student Engagement
                    </h4>
                    {aiInsights.studentEngagement ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Active Participants:</span>
                          <span className="font-medium">{aiInsights.studentEngagement.activeParticipants}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg. Session Time:</span>
                          <span className="font-medium">{aiInsights.studentEngagement.averageSessionTime} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Forum Posts:</span>
                          <span className="font-medium">{aiInsights.studentEngagement.forumPosts}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No engagement data available</p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Brain size={18} className="text-purple-600" />
                      AI Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {aiInsights.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 shrink-0"></span>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No insights available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAIPanel(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      {/* Gemini API Key Dialog */}
      <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Gemini AI</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to enable AI features. 
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                Get your API key here
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Gemini API key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
            </div>
            {geminiApiKey && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                API key is currently configured
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsApiKeyDialogOpen(false);
              setTempApiKey('');
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (tempApiKey.trim()) {
                setGeminiApiKey(tempApiKey.trim());
                localStorage.setItem('geminiApiKey', tempApiKey.trim());
                setTempApiKey('');
                setIsApiKeyDialogOpen(false);
              }
            }}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TeacherCoursesPage;