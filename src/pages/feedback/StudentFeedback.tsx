import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import FeedbackFormCard from '@/components/feedback/FeedbackFormCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Spinner from "@/components/ui/spinner";

// Helper to get backend URL
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

// Define interfaces for our data types
interface FeedbackForm {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  createdBy: string;
  students: string[];
  questions: Question[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  responses?: FeedbackResponse[];
}

interface Question {
  type: 'multipleChoice' | 'shortAnswer' | 'trueFalse' | 'ratingScale';
  text: string;
  options?: string[];
  correctAnswer?: string;
  _id?: string;
}

interface FeedbackResponse {
  formId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  overallRating?: number;
  _id?: string;
}

interface Answer {
  questionId: string;
  response: string | string[];
  rating?: number;
  questionText?: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface FeedbackFormCardProps {
  form: FeedbackForm;
  teacher: Teacher;
  userResponse?: FeedbackResponse;
  readOnly?: boolean;
  isSubmitting?: boolean; // Ensure this property is included
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (answers: Answer[]) => Promise<void>;
}

const StudentFeedback = () => {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Record<string, Teacher>>({});
  const [userResponses, setUserResponses] = useState<Record<string, FeedbackResponse>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Improved fetch with retry mechanism and timeout
  const fetchWithRetry = useCallback(async (url: string, options: RequestInit, maxRetries = 3) => {
    const controller = new AbortController();
    setAbortController(controller);

    for (let i = 0; i < maxRetries; i++) {
      try {
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { data, error: null };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        if (i === maxRetries - 1) {
          throw err;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }, []);

  // Improved fetchFeedbackForms with better error handling
  useEffect(() => {
    const fetchFeedbackForms = async () => {
      if (!user || !token) return;
      
      try {
        setLoading(true);
        setError(null);

        const result = await fetchWithRetry(
          `${BACKEND_URL}/api/feedback-forms/student`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (result?.data) {
          const feedbackForms = result.data as FeedbackForm[];
          setFeedbackForms(feedbackForms);
          // Extract unique teacher IDs
          const teacherIds = [...new Set(feedbackForms.map(form => form.createdBy))];
          await fetchTeachers(teacherIds);
        }
      } catch (err: any) {
        console.error('Error fetching feedback forms:', err);
        setError(err.message || 'Failed to fetch feedback forms');
        toast.error('Failed to load feedback forms. Please try again.');
        setRetryCount(prev => prev + 1);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackForms();

    // Cleanup function
    return () => {
      abortController?.abort();
    };
  }, [user, token, retryCount, fetchWithRetry]);

  
  // Improved fetchTeachers with loading state
  const fetchTeachers = async (teacherIds: string[]) => {
    if (!teacherIds.length) return;
    try {
      setTeachersLoading(true);
      // Use GET instead of POST for /api/users/teachers
      // Pass teacherIds as a query parameter (comma-separated)
      const query = new URLSearchParams({ teacherIds: teacherIds.join(',') }).toString();
      const result = await fetchWithRetry(
        `${BACKEND_URL}/api/users/teachers?${query}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (result?.data) {
        const teachersMap: Record<string, Teacher> = {};
        result.data.forEach((teacher: Teacher) => {
          teachersMap[teacher._id] = teacher;
        });
        setTeachers(teachersMap);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      toast.error('Failed to load teacher information');
    } finally {
      setTeachersLoading(false);
    }
  };

  // Fetch user's responses to forms
  const fetchUserResponses = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/feedback-responses/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const responses: FeedbackResponse[] = await response.json();
      const responsesMap: Record<string, FeedbackResponse> = {};
      
      responses.forEach(response => {
        responsesMap[response.formId] = response;
      });
      
      setUserResponses(responsesMap);
    } catch (err) {
      console.error('Error fetching user responses:', err);
    }
  };
  
  if (!user) return null;
  
  // Filter forms based on search query
  const filteredForms = feedbackForms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Check if a form has been responded to by the user
  const hasUserResponse = (formId: string) => {
    return !!userResponses[formId];
  };
  
  // Separate forms by completion status
  const pendingForms = filteredForms.filter(form => 
    form.status === 'active' && !hasUserResponse(form._id)
  );
  
  const completedForms = filteredForms.filter(form => 
    hasUserResponse(form._id) || form.status === 'archived'
  );

  // Calculate overall rating from answers
  const calculateOverallRating = (answers: Answer[]) => {
    const ratingAnswers = answers.filter(answer => answer.rating !== undefined);
    if (ratingAnswers.length === 0) return undefined;
    
    const sum = ratingAnswers.reduce((total, answer) => total + (answer.rating || 0), 0);
    return sum / ratingAnswers.length;
  };

  // Improved form submission with proper error handling
  const handleFormSubmit = async (formId: string, answers: Answer[]) => {
    try {
      setSubmitting(true);
      setSelectedFormId(formId);
      const form = feedbackForms.find(f => f._id === formId);
      if (!form) {
        throw new Error("Form not found");
      }
      // Validate answers before submission
      if (!answers.length) {
        throw new Error("Please answer at least one question");
      }
      const enhancedAnswers = answers.map(answer => {
        const question = form.questions.find(q => q._id === answer.questionId);
        if (!question) {
          throw new Error(`Question not found for answer: ${answer.questionId}`);
        }
        return {
          ...answer,
          questionText: question.text
        };
      });
      const overallRating = calculateOverallRating(enhancedAnswers);
      const result = await fetchWithRetry(
        `${BACKEND_URL}/api/feedback-responses`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            formId,
            answers: enhancedAnswers
            // Removed overallRating from payload to match backend expectations
          })
        }
      );
      if (result?.data) {
        setUserResponses(prev => ({
          ...prev,
          [formId]: result.data
        }));
        toast.success('Feedback submitted successfully!');
        setSelectedFormId(null);
        await fetchUserResponses();
      }
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      // Try to extract backend error message
      let errorMsg = err.message || 'Failed to submit feedback';
      if (err.response) {
        // If using axios or similar
        errorMsg = err.response.data?.message || errorMsg;
      } else if (err instanceof Error && err.name === 'FetchError' && err.response) {
        // For fetch errors
        try {
          const data = await err.response.json();
          errorMsg = data?.message || errorMsg;
        } catch {}
      } else if (err && err.toString && err.toString().includes('HTTP error!')) {
        // If fetchWithRetry threw an HTTP error, try to get backend error
        try {
          const response = await fetch(`${BACKEND_URL}/api/feedback-responses`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              formId,
              answers: enhancedAnswers
            })
          });
          if (!response.ok) {
            const data = await response.json();
            errorMsg = data?.message || errorMsg;
          }
        } catch {}
      }
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Fix renderFeedbackCards function
// In your StudentFeedback.tsx file, update the renderFeedbackCards function
const renderFeedbackCards = (forms: FeedbackForm[]) => {
  if (teachersLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner className="w-6 h-6 text-primary" />
        <span className="ml-2">Loading teacher information...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map(form => {
        const teacher = teachers[form.createdBy];
        const userResponse = userResponses[form._id];
        const isCompleted = hasUserResponse(form._id) || form.status === 'archived';
        const isSelected = selectedFormId === form._id;
        const currentSubmitting = isSelected && submitting;
        return (
          <FeedbackFormCard
            key={form._id}
            form={form}
            teacher={teacher}
            userResponse={userResponse}
            readOnly={isCompleted}
            isSubmitting={currentSubmitting}
            isOpen={isSelected}
            onOpenChange={(open) => {
              if (!open) setSelectedFormId(null);
              else if (!isCompleted) setSelectedFormId(form._id);
            }}
            onSubmit={isCompleted ? undefined : answers => handleFormSubmit(form._id, answers)}
          />
        );
      })}
    </div>
  );
};

// Also update renderCompletedCards and renderAllCards similarly
  // Update the completed forms section
  const renderCompletedCards = (forms: FeedbackForm[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map(form => {
        const teacher = teachers[form.createdBy];
        const userResponse = userResponses[form._id];
        return (
          <FeedbackFormCard
            key={form._id}
            form={form}
            teacher={teacher}
            userResponse={userResponse}
            readOnly={true}
            isSubmitting={false}
            isOpen={false}
          />
        );
      })}
    </div>
  );

  // Update the all forms section
  const renderAllCards = (forms: FeedbackForm[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.map(form => {
        const teacher = teachers[form.createdBy];
        const userResponse = userResponses[form._id];
        const isCompleted = hasUserResponse(form._id) || form.status === 'archived';
        const isSelected = selectedFormId === form._id;
        const currentSubmitting = isSelected && submitting;
        
        return (
          <FeedbackFormCard
            key={form._id}
            form={form}
            teacher={teacher}
            userResponse={userResponse}
            readOnly={isCompleted}
            isSubmitting={currentSubmitting}
            isOpen={isSelected}
            onOpenChange={(open) => {
              if (!open) setSelectedFormId(null);
              else if (!isCompleted) setSelectedFormId(form._id);
            }}
            onSubmit={isCompleted ? undefined : answers => handleFormSubmit(form._id, answers)}
          />
        );
      })}
    </div>
  );

  return (
    <AppLayout pageTitle="Feedback Forms">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Feedback Forms</h2>
        <p className="text-gray-500">View and complete feedback forms assigned to you.</p>
      </div>
      
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search feedback forms..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Spinner className="w-8 h-8 text-primary" />
          <span className="ml-2 text-gray-600">Loading feedback forms...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-red-800">Error loading feedback forms</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="mb-6">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingForms.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedForms.length})</TabsTrigger>
            <TabsTrigger value="all">All Forms ({filteredForms.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="pt-4">
            {pendingForms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending feedback forms found.</p>
              </div>
            ) : (
              renderFeedbackCards(pendingForms)
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            {completedForms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No completed feedback forms found.</p>
              </div>
            ) : (
              renderCompletedCards(completedForms)
            )}
          </TabsContent>
          
          <TabsContent value="all" className="pt-4">
            {filteredForms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No feedback forms found.</p>
              </div>
            ) : (
              renderAllCards(filteredForms)
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default StudentFeedback;