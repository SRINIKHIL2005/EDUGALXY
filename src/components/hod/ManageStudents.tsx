import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Eye, Search, Filter, Download, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  studentId?: string;
  enrollmentYear?: string;
  program?: string;
  phone?: string;
  coursesEnrolled?: number;
  attendanceRate?: number;
  lastLogin?: string;
  createdAt?: string;
}

interface Course {
  _id: string;
  code: string;
  name: string;
}

interface ManageStudentsProps {
  department: string;
}

const ManageStudents: React.FC<ManageStudentsProps> = ({ department }) => {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    enrollmentYear: '',
    program: '',
    phone: '',
    password: ''
  });

  // API instance
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch students data
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/hod/students?department=${department}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses for enrollment
  const fetchCourses = async () => {
    try {
      const response = await apiClient.get(`/api/hod/courses?department=${department}`);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [department]);

  // Handle student creation
  const handleCreateStudent = async () => {
    if (!formData.name || !formData.email || !formData.studentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/hod/students', {
        ...formData,
        department,
        role: 'student'
      });
      
      setStudents([...students, response.data.student]);
      toast.success('Student added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student update
  const handleUpdateStudent = async () => {
    if (!selectedStudent || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/hod/students/${selectedStudent._id}`, formData);
      
      setStudents(students.map(student => 
        student._id === selectedStudent._id ? response.data.student : student
      ));
      
      toast.success('Student updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    try {
      await apiClient.delete(`/api/hod/students/${selectedStudent._id}`);
      
      setStudents(students.filter(student => student._id !== selectedStudent._id));
      toast.success('Student removed successfully');
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to remove student');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedStudents.map(studentId => 
          apiClient.delete(`/api/hod/students/${studentId}`)
        )
      );
      
      setStudents(students.filter(student => !selectedStudents.includes(student._id)));
      setSelectedStudents([]);
      toast.success(`${selectedStudents.length} students removed successfully`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to remove some students');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      studentId: '',
      enrollmentYear: '',
      program: '',
      phone: '',
      password: ''
    });
    setSelectedStudent(null);
  };

  // Open edit modal
  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      studentId: student.studentId || '',
      enrollmentYear: student.enrollmentYear || '',
      program: student.program || '',
      phone: student.phone || '',
      password: ''
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Filter students based on search and program
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProgram = filterProgram === 'all' || student.program === filterProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Get unique programs for filter
  const programs = [...new Set(students.map(s => s.program).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Students</h2>
          <p className="text-gray-600">Manage students in {department}</p>
        </div>
        <div className="flex gap-3">
          {selectedStudents.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedStudents.length})
            </Button>
          )}
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          <option value="all">All Programs</option>
          {programs.map((program) => (
            <option key={program} value={program}>{program}</option>
          ))}
        </select>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(filteredStudents.map(s => s._id));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student._id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.studentId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.program || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.enrollmentYear || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredStudents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first student'}
          </p>
        </div>
      )}

      {/* Add Student Modal */}
      <Transition show={showAddModal} as={React.Fragment}>
        <Dialog
          onClose={() => setShowAddModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-screen overflow-y-auto">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Add New Student
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter student's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Student ID *</label>
                    <Input
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      placeholder="Enter student ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Program</label>
                    <Input
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Enrollment Year</label>
                    <Input
                      value={formData.enrollmentYear}
                      onChange={(e) => setFormData({...formData, enrollmentYear: e.target.value})}
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Password *</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter temporary password"
                    />
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
                    onClick={handleCreateStudent}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Student Modal */}
      <Transition show={showEditModal} as={React.Fragment}>
        <Dialog
          onClose={() => setShowEditModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6 max-h-screen overflow-y-auto">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Edit Student
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter student's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Student ID</label>
                    <Input
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      placeholder="Enter student ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Program</label>
                    <Input
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      placeholder="e.g., Bachelor of Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Enrollment Year</label>
                    <Input
                      value={formData.enrollmentYear}
                      onChange={(e) => setFormData({...formData, enrollmentYear: e.target.value})}
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
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
                    onClick={handleUpdateStudent}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Student'}
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* View Student Modal */}
      <Transition show={showViewModal} as={React.Fragment}>
        <Dialog
          onClose={() => setShowViewModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 p-6">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Student Details
                </Dialog.Title>

                {selectedStudent && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                        <p className="text-gray-600">{selectedStudent.studentId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedStudent.email}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedStudent.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Program</label>
                        <span>{selectedStudent.program || 'N/A'}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Enrollment Year</label>
                        <span>{selectedStudent.enrollmentYear || 'N/A'}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Courses Enrolled</label>
                        <span>{selectedStudent.coursesEnrolled || 0}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Attendance Rate</label>
                        <span>{selectedStudent.attendanceRate || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition show={showDeleteModal} as={React.Fragment}>
        <Dialog
          onClose={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Remove Student
                </Dialog.Title>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove "{selectedStudent?.name}"? This action cannot be undone.
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
                    onClick={handleDeleteStudent}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ManageStudents;
