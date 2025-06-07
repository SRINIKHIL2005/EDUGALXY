import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Calendar, User, Search, Filter, Download, Eye, Archive, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Feedback {
  _id: string;
  message: string;
  title?: string;
  department?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  submittedAt?: string;
  status?: 'pending' | 'reviewed' | 'resolved' | 'archived';
  rating?: number;
  category?: string;
  course?: {
    _id: string;
    name: string;
    code: string;
  };
  response?: string;
  respondedAt?: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
}

interface DepartmentFeedbackProps {
  department: string;
}

const DepartmentFeedback: React.FC<DepartmentFeedbackProps> = ({ department }) => {
  const { token } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  
  // Response form state
  const [responseText, setResponseText] = useState('');

  // API instance
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch feedback data
  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/hod/feedback?department=${department}`);
      setFeedbacks(response.data.feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [department]);

  // Handle feedback response
  const handleRespondToFeedback = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/hod/feedback/${selectedFeedback._id}/respond`, {
        response: responseText,
        status: 'reviewed'
      });
      
      setFeedbacks(feedbacks.map(feedback => 
        feedback._id === selectedFeedback._id ? response.data.feedback : feedback
      ));
      
      toast.success('Response submitted successfully');
      setShowResponseModal(false);
      setResponseText('');
    } catch (error: any) {
      console.error('Error responding to feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle feedback status update
  const handleUpdateStatus = async (feedbackId: string, status: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/hod/feedback/${feedbackId}/status`, { status });
      
      setFeedbacks(feedbacks.map(feedback => 
        feedback._id === feedbackId ? response.data.feedback : feedback
      ));
      
      toast.success(`Feedback ${status} successfully`);
    } catch (error: any) {
      console.error('Error updating feedback status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk actions
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedFeedbacks.length === 0) return;

    setIsLoading(true);
    try {
      await Promise.all(
        selectedFeedbacks.map(feedbackId => 
          apiClient.put(`/api/hod/feedback/${feedbackId}/status`, { status })
        )
      );
      
      setFeedbacks(feedbacks.map(feedback => 
        selectedFeedbacks.includes(feedback._id) 
          ? { ...feedback, status: status as any }
          : feedback
      ));
      
      setSelectedFeedbacks([]);
      toast.success(`${selectedFeedbacks.length} feedback items updated`);
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast.error('Failed to update some feedback items');
    } finally {
      setIsLoading(false);
    }
  };

  // Open response modal
  const openResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response || '');
    setShowResponseModal(true);
  };

  // Open view modal
  const openViewModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowViewModal(true);
  };

  // Filter feedback based on search and filters
  const filteredFeedback = feedbacks.filter(feedback => {
    const matchesSearch = feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feedback.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feedback.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || feedback.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(feedbacks.map(f => f.category).filter(Boolean))];

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render rating stars
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Feedback</h2>
          <p className="text-gray-600">Review and respond to feedback for {department}</p>
        </div>
        <div className="flex gap-3">
          {selectedFeedbacks.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleBulkStatusUpdate('reviewed')}
                size="sm"
              >
                Mark as Reviewed
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkStatusUpdate('resolved')}
                size="sm"
              >
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkStatusUpdate('archived')}
                size="sm"
              >
                Archive Selected
              </Button>
            </div>
          )}
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold">{feedbacks.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {feedbacks.filter(f => f.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {feedbacks.filter(f => f.status === 'reviewed').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {feedbacks.filter(f => f.status === 'resolved').length}
                </p>
              </div>
              <Archive className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((feedback) => (
            <motion.div
              key={feedback._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedFeedbacks.includes(feedback._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeedbacks([...selectedFeedbacks, feedback._id]);
                          } else {
                            setSelectedFeedbacks(selectedFeedbacks.filter(id => id !== feedback._id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {feedback.title || 'Feedback'}
                          </h3>
                          <Badge className={`${getStatusColor(feedback.status)} border-0`}>
                            {feedback.status || 'pending'}
                          </Badge>
                          {feedback.category && (
                            <Badge variant="outline">{feedback.category}</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3 line-clamp-3">
                          {feedback.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{feedback.createdBy?.name || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {feedback.submittedAt 
                                ? new Date(feedback.submittedAt).toLocaleDateString()
                                : 'Unknown date'
                              }
                            </span>
                          </div>
                          {feedback.course && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{feedback.course.code} - {feedback.course.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {feedback.rating && (
                          <div className="mt-2">
                            {renderStars(feedback.rating)}
                          </div>
                        )}
                        
                        {feedback.response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>Response:</strong> {feedback.response}
                            </p>
                            {feedback.respondedAt && (
                              <p className="text-xs text-blue-700 mt-1">
                                Responded on {new Date(feedback.respondedAt).toLocaleDateString()}
                                {feedback.respondedBy && ` by ${feedback.respondedBy.name}`}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(feedback)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResponseModal(feedback)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      {feedback.status !== 'resolved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(feedback._id, 'resolved')}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredFeedback.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search criteria' : 'No feedback has been submitted yet'}
          </p>
        </div>
      )}

      {/* View Feedback Modal */}
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
              <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowViewModal(false)} />
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
              <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-screen overflow-y-auto">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Feedback Details
                </Dialog.Title>

                {selectedFeedback && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedFeedback.createdBy?.name || 'Anonymous'}</h3>
                        <p className="text-sm text-gray-600">{selectedFeedback.createdBy?.email}</p>
                      </div>
                      <div className="ml-auto">
                        <Badge className={`${getStatusColor(selectedFeedback.status)} border-0`}>
                          {selectedFeedback.status || 'pending'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">
                        {selectedFeedback.title || 'Feedback'}
                      </h4>
                      <p className="text-gray-700">{selectedFeedback.message}</p>
                    </div>

                    {selectedFeedback.rating && (
                      <div>
                        <h4 className="font-medium mb-2">Rating</h4>
                        {renderStars(selectedFeedback.rating)}
                      </div>
                    )}

                    {selectedFeedback.course && (
                      <div>
                        <h4 className="font-medium mb-2">Course</h4>
                        <p className="text-gray-700">
                          {selectedFeedback.course.code} - {selectedFeedback.course.name}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Submitted</h4>
                      <p className="text-gray-700">
                        {selectedFeedback.submittedAt 
                          ? new Date(selectedFeedback.submittedAt).toLocaleString()
                          : 'Unknown date'
                        }
                      </p>
                    </div>

                    {selectedFeedback.response && (
                      <div>
                        <h4 className="font-medium mb-2">Response</h4>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-blue-900">{selectedFeedback.response}</p>
                          {selectedFeedback.respondedAt && (
                            <p className="text-xs text-blue-700 mt-2">
                              Responded on {new Date(selectedFeedback.respondedAt).toLocaleString()}
                              {selectedFeedback.respondedBy && ` by ${selectedFeedback.respondedBy.name}`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowViewModal(false);
                      if (selectedFeedback) openResponseModal(selectedFeedback);
                    }}
                  >
                    Respond
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Response Modal */}
      <Transition show={showResponseModal} as={React.Fragment}>
        <Dialog
          onClose={() => setShowResponseModal(false)}
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
                  Respond to Feedback
                </Dialog.Title>

                {selectedFeedback && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Original feedback:</p>
                      <p className="text-gray-900">{selectedFeedback.message}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Your Response</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={6}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Enter your response to this feedback..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowResponseModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRespondToFeedback}
                    disabled={isLoading || !responseText.trim()}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Response'}
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

export default DepartmentFeedback;
