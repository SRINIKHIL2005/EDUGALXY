import React, { useState, useEffect } from 'react';
import { Pie, Bar, Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, RefreshCw, MessageSquare, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Register chart components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

// Fix for process.env not defined error
declare global {
  interface Window {
    __NEXT_DATA__?: {
      props?: {
        pageProps?: {
          env?: {
            NEXT_PUBLIC_API_URL?: string;
          };
        };
      };
    };
  }
}

/**
 * Retrieves the base URL for the API.
 * Tries reading from Next.js provided env variables and then falls back to a default value.
 */
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const nextPublicApiUrl = window.__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_API_URL;
    if (nextPublicApiUrl) return nextPublicApiUrl;
    
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  }
  return 'http://localhost:5000'; // Default fallback, adjust as necessary
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper function to generate anonymized student identifiers
const getAnonymizedIdentifier = (index) => {
  return `Student ${String.fromCharCode(65 + (index % 26))}${Math.floor(index / 26) > 0 ? Math.floor(index / 26) : ''}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to get color for rating
const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'text-green-600 bg-green-100';
  if (rating >= 3.5) return 'text-blue-600 bg-blue-100';
  if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const ResultsPage = () => {
  const { user, authAxios } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [error, setError] = useState(null);
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('all');  const [activeTab, setActiveTab] = useState('overview');
  // New state for detailed responses
  const [detailedResponses, setDetailedResponses] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responsesByQuestion, setResponsesByQuestion] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState('all');
  
  // AI Analysis state
  const [isAIAnalysisDialogOpen, setIsAIAnalysisDialogOpen] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState(null);
  const [aiAnalysisLoading, setAIAnalysisLoading] = useState(false);

  useEffect(() => {
    console.log('Current user:', user);
    // Only fetch data if user and department are available
    if (user) {
      fetchForms();
    } else {
      setError('User information not available. Please login again.');
      setIsLoading(false);
    }
  }, [user, authAxios]); 

  /**
   * Fetches the list of feedback forms.
   */
  const fetchForms = async () => {
    try {
      setIsLoading(true);
      
      // Debug information
      console.log('Fetching forms for user:', user);
      console.log('User role:', user?.role);
      
      const formsEndpoint = `${API_BASE_URL}/api/feedback-forms?role=teacher`;
      const formsResponse = await authAxios.get(formsEndpoint);
      
      // Log successful response
      console.log('Forms response:', formsResponse.data);
      
      if (formsResponse.data && Array.isArray(formsResponse.data)) {
        setForms(formsResponse.data);
      } else {
        console.warn('Unexpected response format for forms:', formsResponse.data);
        setForms([]);
      }
      
      // Fetch results initially for all forms
      fetchResults('all');
    } catch (err) {
      // Enhanced error logging
      console.error('Error fetching forms:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setError('Failed to fetch feedback forms. Please check your connection or try again later.');
      setIsLoading(false);
    }
  };

  /**
   * Fetches the feedback results.
   * We modified this to always use the /api/feedback-results endpoint
   * and pass the formId as a query parameter instead of a path parameter.
   */
  const fetchResults = async (formId) => {
    try {
      setIsLoading(true);
      
      // Check if user department is available
      if (!user?.department) {
        setError('User department information not available. Please make sure your account has a department assigned.');
        setIsLoading(false);
        return;
      }
      
      // Use the same endpoint for all forms, but pass formId as a query parameter when needed
      const endpoint = `${API_BASE_URL}/api/feedback-results`;
      
      // Prepare query parameters
      const params: { department: string; formId?: string } = { 
        department: user.department 
      };
      
      // Add formId parameter only if not 'all'
      if (formId !== 'all') {
        params.formId = formId;
      }
      
      console.log('Fetching results with params:', params);
      
      const response = await authAxios.get(endpoint, { params });
      
      const data = response.data;
      const feedbackCounts = {
        Excellent: 0,
        Good: 0,
        Average: 0,
        Poor: 0
      };
      const questionRatings: Record<string, { total: number; count: number; questionText: string }> = {};
      
      // Store original data for detailed responses view
      setDetailedResponses(data);
      
      // Extract questions and create a map for question ID to question text
      const questionMap = {};
      const extractedQuestions = [];
      
      // Process responses
      if (data && typeof data === 'object' && 'responses' in data && Array.isArray(data.responses)) {
        // First, extract all unique questions from the responses
        data.responses.forEach(response => {
          if (response.answers && Array.isArray(response.answers)) {
            response.answers.forEach(answer => {
              if (answer.questionId && answer.questionText) {
                // Add question to map if not already there
                if (!questionMap[answer.questionId]) {
                  questionMap[answer.questionId] = answer.questionText;
                  extractedQuestions.push({
                    id: answer.questionId,
                    text: answer.questionText
                  });
                }
              }
            });
          }
        });
        
        // Set questions state
        setQuestions(extractedQuestions);
        
        // Now process responses for ratings and group responses by question
        const responsesByQuestionMap = {};
        
        data.responses.forEach((response, responseIndex) => {
          // Process each answer in the response
          if (response.answers && Array.isArray(response.answers)) {
            response.answers.forEach(answer => {
              const questionId = answer.questionId;
              const questionText = answer.questionText || questionMap[questionId] || `Question ${questionId}`;
              
              // Initialize question responses array if not exists
              if (!responsesByQuestionMap[questionId]) {
                responsesByQuestionMap[questionId] = [];
              }
              
              // Add response to question
              responsesByQuestionMap[questionId].push({
                studentId: getAnonymizedIdentifier(responseIndex),
                responseId: response.id || `response-${responseIndex}`,
                submittedAt: response.submittedAt || new Date().toISOString(),
                rating: typeof answer.response === 'number' ? answer.response : 
                       (typeof answer.response === 'string' && !isNaN(parseFloat(answer.response)) ? 
                        parseFloat(answer.response) : null),
                textResponse: answer.comments || null,
                fullResponse: answer
              });
              
              // Check if the answer has a response field that could be interpreted as a rating
              if (questionId && answer.response !== undefined) {
                // Try to interpret the response as a rating if it's a number
                const rating = typeof answer.response === 'number' ? 
                  answer.response : 
                  (typeof answer.response === 'string' && !isNaN(parseFloat(answer.response)) ? 
                    parseFloat(answer.response) : null);
                
                if (rating !== null) {
                  // Calculate overall rating
                  // Add to appropriate category
                  if (rating >= 4.5) feedbackCounts.Excellent++;
                  else if (rating >= 3.5) feedbackCounts.Good++;
                  else if (rating >= 2.5) feedbackCounts.Average++;
                  else feedbackCounts.Poor++;
                  
                  // Process question-specific ratings
                  const questionKey = questionId;
                  if (!questionRatings[questionKey]) {
                    questionRatings[questionKey] = {
                      total: 0,
                      count: 0,
                      questionText: questionText
                    };
                  }
                  questionRatings[questionKey].total += rating;
                  questionRatings[questionKey].count++;
                }
              }
            });
          }
        });
        
        // Set responses by question state
        setResponsesByQuestion(responsesByQuestionMap);
      }
      
      // Calculate averages per question
      const questionLabels = [];
      const questionAverages = [];
      Object.entries(questionRatings).forEach(([questionId, data]) => {
        const average = data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0;
        questionLabels.push(data.questionText);
        questionAverages.push(average);
      });
      
      setFeedbackData({
        labels: ['Excellent', 'Good', 'Average', 'Poor'],
        datasets: [{
          label: 'Student Feedback',
          data: [
            feedbackCounts.Excellent,
            feedbackCounts.Good,
            feedbackCounts.Average,
            feedbackCounts.Poor
          ],
          backgroundColor: [
            '#4CAF50',  // Excellent - Green
            '#8BC34A',  // Good - Light Green
            '#FFC107',  // Average - Amber
            '#F44336'   // Poor - Red
          ],
          borderWidth: 1,
          borderColor: '#ffffff',
        }]
      });
      
      setRatingData({
        labels: questionLabels,
        datasets: [{
          label: 'Average Rating',
          data: questionAverages,
          backgroundColor: 'rgba(53, 162, 235, 0.7)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      });
      
      setRadarData({
        labels: questionLabels,
        datasets: [{
          label: 'Rating',
          data: questionAverages,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
        }]
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching feedback results:', err.response || err);
      setError(`Failed to fetch feedback results: ${err.response?.data?.message || err.message}`);
      setIsLoading(false);
      setFeedbackData(null);
      setRatingData(null);
      setRadarData(null);
      setDetailedResponses(null);
      setQuestions([]);
      setResponsesByQuestion({});
    }
  };

  const handleFormChange = (value) => {
    setSelectedForm(value);
    fetchResults(value);
  };

  const handleQuestionChange = (value) => {
    setSelectedQuestion(value);
  };
  const refreshResults = () => {
    fetchResults(selectedForm);
  };

  // AI Analysis handler function
  const handleAIAnalysis = async () => {
    try {
      setAIAnalysisLoading(true);
      setIsAIAnalysisDialogOpen(true);
      
      // Prepare feedback data for AI analysis
      const analysisData = {
        totalResponses: feedbackData ? feedbackData.datasets[0].data.reduce((sum, val) => sum + val, 0) : 0,
        ratingDistribution: feedbackData ? {
          excellent: feedbackData.datasets[0].data[0],
          good: feedbackData.datasets[0].data[1], 
          average: feedbackData.datasets[0].data[2],
          poor: feedbackData.datasets[0].data[3]
        } : null,
        questionRatings: ratingData ? ratingData.labels.map((label, index) => ({
          question: label,
          rating: ratingData.datasets[0].data[index]
        })) : [],        textualFeedback: Object.entries(responsesByQuestion).map(([questionId, responses]) => {
          const question = questions.find(q => q.id === questionId) || { text: `Question ${questionId}` };
          const comments = Array.isArray(responses) 
            ? responses.filter((r: any) => r.textResponse && r.textResponse.trim().length > 0)
                      .map((r: any) => r.textResponse)
            : [];
          return {
            question: question.text,
            comments: comments
          };
        }).filter(item => item.comments.length > 0),
        formTitle: forms.find(f => f._id === selectedForm)?.title || 'Selected Form',
        department: user?.department || 'Unknown Department'
      };      const response = await authAxios.post(`${API_BASE_URL}/api/ai/feedback-response-analysis`, {
        feedbackData: analysisData
      });

      if (response.data && (response.data as any).analysis) {
        setAIAnalysis((response.data as any).analysis);
      } else {
        throw new Error('Invalid AI analysis response format');
      }
    } catch (error) {
      console.error('Error getting AI feedback analysis:', error);
      setAIAnalysis('Sorry, I encountered an error while analyzing the feedback data. Please try again later.');
    } finally {
      setAIAnalysisLoading(false);
    }
  };

  const calculateSummaryStats = () => {
    if (!feedbackData || !ratingData) return { totalResponses: 0, satisfactionRate: '0%', averageRating: '0.0' };
    const totalResponses = feedbackData.datasets[0].data.reduce((sum, val) => sum + val, 0);
    const positive = feedbackData.datasets[0].data[0] + feedbackData.datasets[0].data[1];
    const satisfactionRate = totalResponses > 0 ? `${Math.round((positive / totalResponses) * 100)}%` : '0%';
    const ratings = ratingData.datasets[0].data;
    const averageRating = ratings.length > 0 
      ? (ratings.reduce((sum, val) => sum + parseFloat(val.toString()), 0) / ratings.length).toFixed(1)
      : '0.0';
    return { totalResponses, satisfactionRate, averageRating };
  };

  // Helper to get responses for the currently selected question
  const getFilteredResponses = () => {
    if (selectedQuestion === 'all') {
      // If "All Questions" is selected, return all responses grouped by question
      return Object.entries(responsesByQuestion).map(([questionId, responses]) => {
        const question = questions.find(q => q.id === questionId) || { text: `Question ${questionId}` };
        return {
          questionId,
          questionText: question.text,
          responses
        };
      });
    } else {
      // Return responses only for the selected question
      const questionResponses = responsesByQuestion[selectedQuestion] || [];
      const question = questions.find(q => q.id === selectedQuestion) || { text: `Question ${selectedQuestion}` };
      return [{
        questionId: selectedQuestion,
        questionText: question.text,
        responses: questionResponses
      }];
    }
  };

  const { totalResponses, satisfactionRate, averageRating } = calculateSummaryStats();

  return (
    <AppLayout pageTitle="Feedback Results">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Feedback Results {user?.department ? `- ${user.department}` : ''}
            </h1>
            <p className="text-gray-500">View and analyze student feedback for your courses</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-64">
              <Select value={selectedForm} onValueChange={handleFormChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feedback form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form._id} value={form._id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>            </div>
            <Button onClick={refreshResults} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={handleAIAnalysis} 
              variant="outline" 
              className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
              disabled={!feedbackData || totalResponses === 0 || aiAnalysisLoading}
            >
              <Sparkles className="h-4 w-4" />
              {aiAnalysisLoading ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-blue-500 font-medium">Loading feedback data...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-lg flex items-center gap-3 border border-red-200">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-6 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center gap-3 border border-blue-200 text-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 text-lg">No Feedback Forms Found</h3>
              <p className="mt-1">Create a feedback form to start collecting responses from students.</p>
              <Button className="mt-4" onClick={() => window.location.href = '/teacher/create-form'}>
                Create Feedback Form
              </Button>
            </div>
          </div>
        ) : !feedbackData || totalResponses === 0 ? (
          <div className="p-6 bg-yellow-50 text-yellow-600 rounded-lg flex flex-col items-center gap-3 border border-yellow-200 text-center">
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 text-lg">No Feedback Data Available</h3>
              <p className="mt-1">There are no responses yet for the selected feedback form.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Responses</p>
                      <p className="text-3xl font-bold text-blue-800 mt-1">{totalResponses}</p>
                    </div>
                    <div className="bg-blue-200 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Satisfaction Rate</p>
                      <p className="text-3xl font-bold text-green-800 mt-1">{satisfactionRate}</p>
                    </div>
                    <div className="bg-green-200 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 01-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Average Rating</p>
                      <p className="text-3xl font-bold text-purple-800 mt-1">{averageRating}/5</p>
                    </div>
                    <div className="bg-purple-200 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full md:w-3/4 lg:w-1/2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
                <TabsTrigger value="radar">Radar Analysis</TabsTrigger>
                <TabsTrigger value="detailed" className="text-blue-600">Detailed Responses</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback Distribution</CardTitle>
                    <CardDescription>
                      Overall rating distribution across all student responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="w-full max-w-md">
                      {feedbackData && feedbackData.datasets[0].data.reduce((sum, value) => sum + value, 0) > 0 ? (
                        <Pie 
                          data={feedbackData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: { position: 'bottom' },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? Math.round((Number(value) / Number(total)) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-64 text-gray-500">
                          No feedback data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Question Ratings</CardTitle>
                    <CardDescription>
                      Average ratings for individual questions across all responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratingData && ratingData.labels.length > 0 ? (
                      <Bar 
                        data={ratingData}
                        options={{
                          responsive: true,
                          scales: {
                            y: { 
                              beginAtZero: true,
                              max: 5,
                              ticks: { stepSize: 1 }
                            }
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Average: ${context.raw}/5`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-500">
                        No question ratings available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="radar" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Radar Analysis</CardTitle>
                    <CardDescription>
                      Comparative view of all question categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {radarData && radarData.labels.length > 0 ? (
                      <div className="flex justify-center">
                        <div className="w-full max-w-2xl">
                          <Radar 
                            data={radarData}
                            options={{
                              responsive: true,
                              scales:{
                                r: {
                                  beginAtZero: true,
                                  min: 0,
                                  max: 5,
                                  ticks: { stepSize: 1 }
                                }
                              },
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `Rating: ${context.raw}/5`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-64 text-gray-500">
                        No data available for radar chart
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* New Tab: Detailed Responses */}
              <TabsContent value="detailed" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Detailed Student Responses</CardTitle>
                      <CardDescription>
                        View individual student responses and comments for each question
                      </CardDescription>
                    </div>
                    <div className="mt-4 md:mt-0 w-full md:w-64">
                      <Select value={selectedQuestion} onValueChange={handleQuestionChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by question" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Questions</SelectItem>
                          {questions.map((question) => (
                            <SelectItem key={question.id} value={question.id}>
                              {question.text.length > 30 ? `${question.text.substring(0, 30)}...` : question.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {questions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No questions found in this feedback form
                      </div>
                    ) : getFilteredResponses().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No responses available for the selected question
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {getFilteredResponses().map((questionData) => (
                          <div key={questionData.questionId} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow duration-300">
                            <div className="mb-4">
                              <h3 className="text-lg font-bold text-gray-800">{questionData.questionText}</h3>
                              <div className="flex items-center mt-2">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {questionData.responses.length} {questionData.responses.length === 1 ? 'Response' : 'Responses'}
                                </Badge>
                                {questionData.responses.length > 0 && (
                                  <div className="ml-3 flex items-center text-sm">
                                    <span className="text-gray-500 mr-2">Avg Rating:</span>
                                    <span className="font-medium px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                                      {(questionData.responses.reduce((sum, r) => sum + (r.rating || 0), 0) / 
                                        questionData.responses.filter(r => r.rating !== null).length || 0).toFixed(1)}/5
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <Accordion type="single" collapsible className="w-full">
                              {questionData.responses.map((response, idx) => {
                                const hasComment = response.textResponse && response.textResponse.trim().length > 0;
                                return (
                                  <AccordionItem key={`${response.responseId}-${idx}`} value={`${response.responseId}-${idx}`}>
                                    <AccordionTrigger className="hover:bg-gray-50 px-4 py-2 rounded-lg">
                                      <div className="flex flex-col md:flex-row md:items-center w-full text-left">
                                        <div className="flex items-center">
                                          <Avatar className="h-8 w-8 mr-3 bg-gray-200">
                                            <div className="text-xs font-medium">{response.studentId.substring(0, 2)}</div>
                                          </Avatar>
                                          <span className="font-medium text-gray-700">{response.studentId}</span>
                                        </div>
                                        <div className="md:ml-auto flex items-center mt-2 md:mt-0">
                                          {'rating' in response && response.rating !== null && (
                                            <span className={`px-2 py-1 rounded-md text-sm font-medium ${getRatingColor(response.rating)}`}>
                                              Rating: {response.rating}/5
                                            </span>
                                          )}
                                          {hasComment && (
                                            <span className="ml-3 flex items-center text-blue-600">
                                              <MessageSquare className="h-4 w-4 mr-1" />
                                              <span className="text-xs">Has comment</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 py-3 bg-gray-50 rounded-lg mt-2">
                                      <div className="space-y-3">
                                        <div className="text-sm text-gray-500">
                                          Submitted: {formatDate(response.submittedAt)}
                                        </div>
                                        
                                        {'rating' in response && response.rating !== null && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Rating:</div>
                                            <div className="flex items-center">
                                              {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="mr-1">
                                                  {i < Math.floor(response.rating) ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                  ) : i === Math.floor(response.rating) && response.rating % 1 !== 0 ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                  ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                    </svg>
                                                  )}
                                                </div>
                                              ))}
                                              <span className="ml-2 text-sm font-medium">{response.rating}/5</span>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {hasComment && (
                                          <div>
                                            <div className="text-sm font-medium mb-1">Comments:</div>
                                            <div className="p-3 bg-white rounded border border-gray-200 text-gray-700">
                                              {response.textResponse}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {!hasComment && response.rating === null && (
                                          <div className="italic text-gray-500">No detailed response provided</div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Detailed Feedback Insights */}
            {feedbackData && (
              <Card className="mt-6 hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Feedback Insights</CardTitle>
                  <CardDescription>
                    Detailed breakdown of feedback statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Rating Distribution</h3>
                      <div className="space-y-3">
                        {['Excellent', 'Good', 'Average', 'Poor'].map((rating, index) => {
                          const count = feedbackData.datasets[0].data[index];
                          const total = feedbackData.datasets[0].data.reduce((sum, val) => sum + val, 0);
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          const colors = ['bg-green-500', 'bg-green-300', 'bg-yellow-400', 'bg-red-500'];
                          return (
                            <div key={rating} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{rating}</span>
                                <span>{count} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${colors[index]} h-2 rounded-full transition-all duration-500 ease-in-out`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Question Insights</h3>
                      {ratingData && ratingData.labels.length > 0 && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-green-700 mb-2">Top Rated Areas</h4>
                            <div className="space-y-2">
                              {ratingData.labels
                                .map((label, index) => ({ label, rating: ratingData.datasets[0].data[index] }))
                                .sort((a, b) => Number(b.rating) - Number(a.rating))
                                .slice(0, 2)
                                .map((item, i) => (
                                  <div key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors duration-200">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    <span className="font-medium text-green-700 px-2 py-1 bg-green-200 rounded-md">{item.rating}/5</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-red-700 mb-2">Areas for Improvement</h4>
                            <div className="space-y-2">
                              {ratingData.labels
                                .map((label, index) => ({ label, rating: ratingData.datasets[0].data[index] }))
                                .sort((a, b) => Number(a.rating) - Number(b.rating))
                                .slice(0, 2)
                                .map((item, i) => (
                                  <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors duration-200">
                                    <span className="text-sm font-medium">{item.label}</span>
                                    <span className="font-medium text-red-700 px-2 py-1 bg-red-200 rounded-md">{item.rating}/5</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Additional card for comment analysis */}
            {feedbackData && Object.values(responsesByQuestion).some(responses => 
              (Array.isArray(responses) && responses.some((r: { textResponse?: string }) => r.textResponse && r.textResponse.trim().length > 0))
            ) && (
              <Card className="mt-6 hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Student Comments Overview</CardTitle>
                  <CardDescription>
                    Summary of written feedback from students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(responsesByQuestion)
                      .filter(([_, responses]) => 
                        Array.isArray(responses) && responses.some((r: { textResponse?: string }) => r.textResponse && r.textResponse.trim().length > 0)
                      )
                      .slice(0, 3) // Limit to 3 questions for better UI
                      .map(([questionId, responses]) => {
                        const question = questions.find(q => q.id === questionId) || { text: `Question ${questionId}` };
                        const commentsForQuestion = (responses as { textResponse?: string }[]).filter(r => r.textResponse && r.textResponse.trim().length > 0);
                        
                        return (
                          <div key={questionId} className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="font-medium text-gray-800 mb-3">{question.text}</h3>
                            <div className="space-y-3">
                              {commentsForQuestion.slice(0, 3).map((response, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <Avatar className="h-6 w-6 mr-2 bg-blue-100">
                                        <div className="text-xs font-medium text-blue-700">{'studentId' in response ? (response.studentId as string).substring(0, 2) : 'N/A'}</div>
                                      </Avatar>
                                      <span className="text-sm text-gray-600">{'studentId' in response ? String(response.studentId) : 'N/A'}</span>
                                    </div>
                                    {'rating' in response && response.rating !== null && (
                                      <Badge variant="outline" className={getRatingColor(response.rating)}>
                                        {response.rating !== undefined ? `${response.rating}/5` : 'No Rating'}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-700 text-sm">{response.textResponse}</p>
                                </div>
                              ))}
                              
                              {commentsForQuestion.length > 3 && (
                                <div className="text-center">
                                  <Button 
                                    variant="outline" 
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={() => {
                                      setSelectedQuestion(questionId);
                                      setActiveTab('detailed');
                                    }}
                                  >
                                    View {commentsForQuestion.length - 3} more comments
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                    <div className="text-center mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => setActiveTab('detailed')}
                        className="mx-auto flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View All Student Responses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}          </>
        )}
      </div>

      {/* AI Analysis Dialog */}
      <Dialog open={isAIAnalysisDialogOpen} onOpenChange={setIsAIAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Feedback Response Analysis
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {aiAnalysisLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Generating AI analysis...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="prose max-w-none">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 mb-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">AI-Generated Insights</h4>
                  <p className="text-xs text-purple-600">This analysis is generated by AI based on the feedback data and should be reviewed by educators for accuracy.</p>
                </div>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {aiAnalysis}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Click "AI Analysis" to generate insights about the feedback responses.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ResultsPage;