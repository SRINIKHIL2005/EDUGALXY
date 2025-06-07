import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Eye, Search, Filter, Download, Mail, Phone, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Faculty {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinedOn: string;
  phone?: string;
  specialization?: string[];
  coursesCount?: number;
  studentsCount?: number;
  lastLogin?: string;
  createdAt?: string;
}

interface ManageTeachersProps {
  department: string;
}

const ManageTeachers: React.FC<ManageTeachersProps> = ({ department }) => {
  const { token } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Faculty | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: [''],
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

  // Fetch faculty data
  const fetchFaculty = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/hod/faculty?department=${department}`);
      setFaculty(response.data.faculty || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [department]);

  // Handle faculty creation
  const handleCreateTeacher = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/hod/faculty', {
        ...formData,
        department,
        role: 'teacher',
        specialization: formData.specialization.filter(s => s.trim() !== '')
      });
      
      setFaculty([...faculty, response.data.faculty]);
      toast.success('Teacher added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to add teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle faculty update
  const handleUpdateTeacher = async () => {
    if (!selectedTeacher || !formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/hod/faculty/${selectedTeacher._id}`, {
        ...formData,
        specialization: formData.specialization.filter(s => s.trim() !== '')
      });
      
      setFaculty(faculty.map(teacher => 
        teacher._id === selectedTeacher._id ? response.data.faculty : teacher
      ));
      
      toast.success('Teacher updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle faculty deletion
  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    setIsLoading(true);
    try {
      await apiClient.delete(`/api/hod/faculty/${selectedTeacher._id}`);
      
      setFaculty(faculty.filter(teacher => teacher._id !== selectedTeacher._id));
      toast.success('Teacher removed successfully');
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      toast.error(error.response?.data?.message || 'Failed to remove teacher');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedFaculty.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedFaculty.map(teacherId => 
          apiClient.delete(`/api/hod/faculty/${teacherId}`)
        )
      );
      
      setFaculty(faculty.filter(teacher => !selectedFaculty.includes(teacher._id)));
      setSelectedFaculty([]);
      toast.success(`${selectedFaculty.length} teachers removed successfully`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to remove some teachers');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: [''],
      password: ''
    });
    setSelectedTeacher(null);
  };

  // Open edit modal
  const openEditModal = (teacher: Faculty) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      specialization: teacher.specialization || [''],
      password: ''
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (teacher: Faculty) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  // Add/Remove specialization fields
  const addSpecialization = () => {
    setFormData({
      ...formData,
      specialization: [...formData.specialization, '']
    });
  };

  const removeSpecialization = (index: number) => {
    const newSpecializations = formData.specialization.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      specialization: newSpecializations.length > 0 ? newSpecializations : ['']
    });
  };

  const updateSpecialization = (index: number, value: string) => {
    const newSpecializations = [...formData.specialization];
    newSpecializations[index] = value;
    setFormData({
      ...formData,
      specialization: newSpecializations
    });
  };

  // Filter faculty based on search and specialization
  const filteredFaculty = faculty.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = filterSpecialization === 'all' || 
                                 teacher.specialization?.includes(filterSpecialization);
    
    return matchesSearch && matchesSpecialization;
  });

  // Get unique specializations for filter
  const specializations = [...new Set(faculty.flatMap(t => t.specialization || []).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Faculty</h2>
          <p className="text-gray-600">Manage teachers in {department}</p>
        </div>
        <div className="flex gap-3">
          {selectedFaculty.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Selected ({selectedFaculty.length})
            </Button>
          )}
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterSpecialization}
          onChange={(e) => setFilterSpecialization(e.target.value)}
        >
          <option value="all">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Faculty Table */}
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
                        checked={selectedFaculty.length === filteredFaculty.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFaculty(filteredFaculty.map(t => t._id));
                          } else {
                            setSelectedFaculty([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
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
                  {filteredFaculty.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedFaculty.includes(teacher._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFaculty([...selectedFaculty, teacher._id]);
                            } else {
                              setSelectedFaculty(selectedFaculty.filter(id => id !== teacher._id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.specialization?.slice(0, 2).map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {teacher.specialization && teacher.specialization.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.specialization.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          {teacher.coursesCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          {teacher.studentsCount || 0}
                        </div>
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
                            onClick={() => openViewModal(teacher)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(teacher);
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

      {filteredFaculty.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first teacher'}
          </p>
        </div>
      )}

      {/* Add Teacher Modal */}
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
                  Add New Teacher
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter teacher's full name"
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
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Specializations</label>
                    {formData.specialization.map((spec, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={spec}
                          onChange={(e) => updateSpecialization(index, e.target.value)}
                          placeholder="Enter specialization"
                        />
                        {formData.specialization.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSpecialization(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecialization}
                    >
                      Add Specialization
                    </Button>
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
                    onClick={handleCreateTeacher}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Add Teacher'}
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Teacher Modal */}
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
                  Edit Teacher
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter teacher's full name"
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
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Specializations</label>
                    {formData.specialization.map((spec, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          value={spec}
                          onChange={(e) => updateSpecialization(index, e.target.value)}
                          placeholder="Enter specialization"
                        />
                        {formData.specialization.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSpecialization(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSpecialization}
                    >
                      Add Specialization
                    </Button>
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
                    onClick={handleUpdateTeacher}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Teacher'}
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* View Teacher Modal */}
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
                  Teacher Details
                </Dialog.Title>

                {selectedTeacher && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedTeacher.name}</h3>
                        <p className="text-gray-600">Faculty Member</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedTeacher.email}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedTeacher.phone || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Courses Teaching</label>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span>{selectedTeacher.coursesCount || 0}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Total Students</label>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{selectedTeacher.studentsCount || 0}</span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-2">Specializations</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeacher.specialization?.map((spec, index) => (
                            <Badge key={index} variant="secondary">
                              {spec}
                            </Badge>
                          )) || <span className="text-gray-500">No specializations listed</span>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Joined On</label>
                        <span>{new Date(selectedTeacher.joinedOn).toLocaleDateString()}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">Last Login</label>
                        <span>{selectedTeacher.lastLogin ? new Date(selectedTeacher.lastLogin).toLocaleDateString() : 'Never'}</span>
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
                  Remove Teacher
                </Dialog.Title>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove "{selectedTeacher?.name}"? This action cannot be undone.
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
                    onClick={handleDeleteTeacher}
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

export default ManageTeachers;
