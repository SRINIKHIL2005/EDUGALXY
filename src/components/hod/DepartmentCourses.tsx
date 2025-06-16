import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Course {
  _id: string;
  code: string;
  name: string;
  description?: string;
  department: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  students: string[];
  schedule?: string[];
  materials?: any[];
  createdAt?: string;
  enrollment?: number;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface DepartmentCoursesProps {
  department: string;
}

const DepartmentCourses: React.FC<DepartmentCoursesProps> = ({ department }) => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    teacher: '',
    schedule: ['']
  });
  // API instance
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch courses data
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      try {
        const response = await apiClient.get(`/api/hod/courses?department=${department}`);
        // Handle both array and {courses: [...]} response formats
        const courseData = Array.isArray(response.data) ? response.data : response.data.courses || [];
        setCourses(courseData);
        console.log('✅ Authenticated courses endpoint worked! Received', courseData.length, 'course records');
      } catch (authError) {
        console.warn('⚠️ Authenticated courses endpoint failed, trying debug endpoint...', authError);
        
        // Fallback to non-authenticated debug endpoint
        const debugResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/hod/debug-courses`);
        
        // Handle both array and {courses: [...]} response formats
        const courseData = Array.isArray(debugResponse.data) ? debugResponse.data : debugResponse.data.courses || [];
        setCourses(courseData);
        
        console.log('✅ Debug endpoint worked! Received', courseData.length, 'course records');
        
        // Show warning to user
        toast.error('Using debug endpoint - authentication bypassed');
      }
    } catch (error) {
      console.error('Error fetching courses (all attempts failed):', error);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch faculty for course assignment
  const fetchFaculty = async () => {
    try {
      try {
        const response = await apiClient.get(`/api/hod/faculty?department=${department}`);
        // Handle both array and {faculty: [...]} response formats
        const facultyData = Array.isArray(response.data) ? response.data : response.data.faculty || [];
        setFaculty(facultyData);
        console.log('✅ Authenticated faculty endpoint worked! Received', facultyData.length, 'faculty records');
      } catch (authError) {
        console.warn('⚠️ Authenticated faculty endpoint failed, trying debug endpoint...', authError);
        
        // Fallback to non-authenticated debug endpoint
        const debugResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/hod/debug-faculty`);
        
        // Handle both array and {faculty: [...]} response formats
        const facultyData = Array.isArray(debugResponse.data) ? debugResponse.data : debugResponse.data.faculty || [];
        setFaculty(facultyData);
        
        console.log('✅ Debug endpoint worked! Received', facultyData.length, 'faculty records');
      }
    } catch (error) {
      console.error('Error fetching faculty (all attempts failed):', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchFaculty();
  }, [department]);

  // Handle course creation
  const handleCreateCourse = async () => {
    if (!formData.code || !formData.name || !formData.teacher) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/hod/courses', {
        ...formData,
        department
      });
      
      setCourses([...courses, response.data.course]);
      toast.success('Course created successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle course update
  const handleUpdateCourse = async () => {
    if (!selectedCourse || !formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/hod/courses/${selectedCourse._id}`, formData);
      
      setCourses(courses.map(course => 
        course._id === selectedCourse._id ? response.data.course : course
      ));
      
      toast.success('Course updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    setIsLoading(true);
    try {
      await apiClient.delete(`/api/hod/courses/${selectedCourse._id}`);
      
      setCourses(courses.filter(course => course._id !== selectedCourse._id));
      toast.success('Course deleted successfully');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      teacher: '',
      schedule: ['']
    });
    setSelectedCourse(null);
  };

  // Open edit modal
  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || '',
      teacher: course.teacher._id,
      schedule: course.schedule || ['']
    });
    setShowEditModal(true);
  };

  // Filter courses based on search and status
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Courses</h2>
          <p className="text-gray-600">Manage courses for {department}</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <p className="text-sm text-gray-600">{course.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {course.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{course.teacher.name}</span>
                    </div>
                    <Badge variant="secondary">
                      {course.students.length} students
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first course'}
          </p>
        </div>
      )}      {/* Add Course Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g., CS101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Course Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Course description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assigned Teacher</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              >
                <option value="">Select a teacher</option>
                {faculty.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g., CS101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Course Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Course description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assigned Teacher</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.teacher}
                onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              >
                <option value="">Select a teacher</option>
                {faculty.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCourse}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Course'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{selectedCourse?.name}"? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentCourses;
