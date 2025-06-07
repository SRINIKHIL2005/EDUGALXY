import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  FileText, 
  Settings,
  Target,
  Star,
  Lightbulb,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Send,
  Edit3,
  Save,
  Eye,
  BarChart3,
  Layers,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Sparkles,
  Layout,
  BookOpen,
  Gem,
  Rocket
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Use a single API_BASE_URL for all API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


interface Student {
  _id: string;
  name: string;
  email: string;
  department: string;
}

type QuestionType = 'multipleChoice' | 'shortAnswer' | 'trueFalse' | 'ratingScale';

interface Question {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
}

const TeacherFeedbackManagement = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: 'multipleChoice',
    text: '',
    options: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [aiDescriptionSuggestions, setAIDescriptionSuggestions] = useState<string[]>([]);
  const [isAIDescriptionDialogOpen, setIsAIDescriptionDialogOpen] = useState(false);
  const [aiDescriptionError, setAIDescriptionError] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Get course data from navigation state
  const courseData = location.state as {
    courseId?: string;
    courseName?: string;
    courseCode?: string;
    department?: string;
  } | null;

  const [formData, setFormData] = useState({
    title: courseData?.courseName ? `Feedback for ${courseData.courseName}` : '',
    description: courseData?.courseName ? `Feedback form for ${courseData.courseName} (${courseData.courseCode})` : '',
    department: courseData?.department || user?.department || '',
    deadline: '',
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState({
    title: false,
    deadline: false,
  });

  // Create authenticated axios instance
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.department || !token) {
        setIsLoadingStudents(false);
        return;
      }
      try {
        setIsLoadingStudents(true);
        const response = await fetch(`${API_BASE_URL}/api/students?department=${encodeURIComponent(user.department)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data: Student[] = await response.json();
        setStudents(data);
      } catch (error) {
        setStudents([]);
        toast.error('Failed to fetch students.');
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [user?.department, token]);

  const addQuestion = () => {
    if (currentQuestion.text.trim()) {
      setQuestions([...questions, currentQuestion]);
      setCurrentQuestion({
        type: 'multipleChoice',
        text: '',
        options: [],
      });
    } else {
      toast.error('Question text cannot be empty');
    }
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: user?.department || '',
      deadline: '',
    });
    setQuestions([]);
    setSelectedStudents([]);
    setCurrentQuestion({
      type: 'multipleChoice',
      text: '',
      options: [],
    });
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {
      title: formData.title.trim() === '',
      deadline: formData.deadline === '',
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Make sure you're using the correct API URL
      const apiUrl = `${API_BASE_URL}/api/feedback-forms`;
      console.log('Submitting form to:', apiUrl);
      
      // Format the form data correctly
      const submissionData = {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        department: formData.department,
        students: selectedStudents,
        questions: questions.map(q => ({
          type: q.type,
          text: q.text,
          options: q.options
        }))
      };
      
      console.log('Form data being sent:', submissionData);
      
      // Make the request with proper authentication
      const response = await authAxios.post(apiUrl, submissionData);
      console.log('Form creation successful:', response.data);
      
      // Update local state with backend's returned form (with real question _id values)
      const returnedForm = response.data as any;
      if (returnedForm && returnedForm.questions && Array.isArray(returnedForm.questions)) {
        setQuestions(returnedForm.questions);
      }
      
      // Show success message and reset form
      toast.success("Feedback form has been created successfully.");
      resetForm();
      navigate('/teacher/dashboard');
      
    } catch (error: any) {
      console.error('Error creating form:', error);
      console.error('Error response:', error.response?.data);
      
      // Show error message with more details
      toast.error(`Failed to create feedback form: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout pageTitle="Create Feedback Form">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl" />
        
        {/* Main Container with proper dimensions */}
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section */}
          <section className="w-full max-w-6xl mx-auto mb-8">
            <div className="relative rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row items-center md:items-end gap-8 p-8 md:p-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
                Feedback Form Creation
              </h1>
              <p className="text-lg md:text-2xl text-white/80 mb-6 max-w-2xl mx-auto md:mx-0">
                Design, customize, and assign feedback forms to your students with a seamless, modern interface. Empower your teaching with actionable insights.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg">
                  <Star className="h-4 w-4" /> Professional
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium shadow-lg">
                  <Sparkles className="h-4 w-4" /> Innovative
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-medium shadow-lg">
                  <Layout className="h-4 w-4" /> Creative
                </span>
              </div>
            </div>
            <div className="hidden md:block flex-shrink-0">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80 blur-2xl animate-pulse" />
            </div>
          </div>
        </section>

        {/* Main Content Grid with improved layout */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stepper - Hidden on mobile, visible on large screens */}
          <aside className="hidden lg:flex flex-col items-start col-span-1">
            <div className="sticky top-8 w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-6 text-lg">Progress Steps</h3>
                <div className="flex flex-col gap-6">
                  {[
                    { icon: <FileText className='h-5 w-5' />, label: 'Form Details', active: true },
                    { icon: <Target className='h-5 w-5' />, label: 'Questions', active: false },
                    { icon: <Users className='h-5 w-5' />, label: 'Assign Students', active: false },
                    { icon: <CheckCircle className='h-5 w-5' />, label: 'Publish', active: false },
                  ].map((step, idx) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 transition-all duration-300 ${step.active ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' : 'bg-white/20 text-white/60'}`}>
                        {step.icon}
                      </div>
                      <span className={`text-sm font-medium ${step.active ? 'text-white' : 'text-white/60'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Form Card */}
          <main className="col-span-1 lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
              {/* Form Configuration */}
              <motion.div
                initial={{ opacity: 0, x: -30, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="space-y-8"
              >
                <Card className="overflow-hidden border-0 bg-white/5 backdrop-blur-xl shadow-xl rounded-2xl">
                  {/* Card Header with improved spacing */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative pb-6 border-b border-white/10">
                      <CardTitle className="flex items-center gap-3 text-2xl text-white">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        Form Configuration
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="ml-auto"
                        >
                          <Gem className="h-5 w-5 text-purple-400" />
                        </motion.div>
                      </CardTitle>
                      <CardDescription className="text-white/70 text-lg mt-2">
                        Configure your feedback form with intelligent precision and style
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Enhanced Title Field */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="space-y-3 group"
                      >
                        <Label htmlFor="title" className="flex items-center text-white font-semibold text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <Star className="h-4 w-4 text-white" />
                          </div>
                          Form Title
                          <Badge variant="destructive" className="ml-3 bg-red-500/20 text-red-300 border-red-400/30">Required</Badge>
                        </Label>
                        <div className="relative">
                          <Input
                            id="title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`text-lg py-4 transition-all duration-300 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 rounded-xl ${formErrors.title ? "border-red-400 ring-red-400/20" : ""}`}
                            placeholder="Enter a compelling and descriptive title..."
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                        {formErrors.title && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-300 flex items-center gap-2 text-sm bg-red-500/10 p-3 rounded-lg border border-red-400/30"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Title is required for form creation
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Enhanced Description Field */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="space-y-3 group"
                      >
                        <Label htmlFor="description" className="flex items-center text-white font-semibold text-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                            <Lightbulb className="h-4 w-4 text-white" />
                          </div>
                          Description
                          <Button
                            type="button"
                            size="sm"
                            className="ml-4 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-xs font-semibold shadow-md hover:from-indigo-700 hover:to-purple-700"
                            disabled={isGeneratingDescription || !formData.title.trim()}
                            onClick={async () => {
                              if (!formData.title.trim()) {
                                toast.error('Please enter a form title first.');
                                return;
                              }
                              setIsGeneratingDescription(true);
                              setAIDescriptionError(null);
                              try {
                                // Request more creative, engaging, and detailed suggestions from the AI
                                const res = await fetch(`${API_BASE_URL}/api/ai-form-description`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ 
                                    title: formData.title,
                                    prompt: `Generate a creative and engaging description for a feedback form. The description should be detailed, informative, and encourage students to provide thoughtful feedback. Focus on the following aspects:
Title: ${formData.title}`
                                  })
                                });
                                if (!res.ok) {
                                  const err = await res.text();
                                  throw new Error(err);
                                }
                                const data = await res.json();
                                if (Array.isArray(data.suggestions)) {
                                  setAIDescriptionSuggestions(data.suggestions);
                                  setIsAIDescriptionDialogOpen(true);
                                } else if (data.suggestions) {
                                  setAIDescriptionSuggestions([data.suggestions]);
                                  setIsAIDescriptionDialogOpen(true);
                                } else {
                                  throw new Error('No suggestions returned');
                                }
                              } catch (err: any) {
                                setAIDescriptionError('Failed to generate suggestions.');
                                toast.error('Failed to generate suggestions.');
                              } finally {
                                setIsGeneratingDescription(false);
                              }
                            }}
                          >
                            {isGeneratingDescription ? 'Generating...' : 'Generate with AI'}
                          </Button>
                        </Label>
                        <div className="relative">
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="text-lg py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 rounded-xl resize-none transition-all duration-300"
                            placeholder="Provide detailed context and objectives for this feedback form..."
                            rows={4}
                            disabled={isGeneratingDescription}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                      </motion.div>

                      {/* Enhanced Department and Deadline Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="space-y-3 group"
                        >
                          <Label htmlFor="department" className="flex items-center text-white font-semibold text-lg">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                              <Settings className="h-4 w-4 text-white" />
                            </div>
                            Department
                          </Label>
                          <div className="relative">
                            <Input
                              id="department"
                              required
                              value={formData.department}
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                              readOnly={!!user?.department}
                              className="text-lg py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 rounded-xl transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="space-y-3 group"
                        >
                          <Label htmlFor="deadline" className="flex items-center text-white font-semibold text-lg">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                            Deadline
                            <Badge variant="destructive" className="ml-3 bg-red-500/20 text-red-300 border-red-400/30">Required</Badge>
                          </Label>
                          <div className="relative">
                            <Input
                              id="deadline"
                              type="datetime-local"
                              required
                              value={formData.deadline}
                              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                              className={`text-lg py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 rounded-xl transition-all duration-300 ${formErrors.deadline ? "border-red-400 ring-red-400/20" : ""}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                          </div>
                          {formErrors.deadline && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-300 flex items-center gap-2 text-sm bg-red-500/10 p-3 rounded-lg border border-red-400/30"
                            >
                              <AlertCircle className="h-4 w-4" />
                              Deadline is required
                            </motion.p>
                          )}
                        </motion.div>
                      </div>

                      {/* Enhanced Submit Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-end gap-4 pt-6"
                      >
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => navigate('/teacher/dashboard')}
                          className="px-8 py-3 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/40 rounded-xl font-semibold transition-all duration-300"
                        >
                          Cancel
                        </Button>
                        <motion.div 
                          whileHover={{ scale: 1.05 }} 
                          whileTap={{ scale: 0.95 }}
                          className="transform-gpu"
                        >
                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="group relative overflow-hidden px-8 py-3 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 hover:from-emerald-700 hover:via-blue-700 hover:to-purple-700 text-white border-0 rounded-xl font-semibold shadow-2xl transition-all duration-300"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="relative flex items-center gap-3">
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                  Publishing Magic...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-5 w-5" />
                                  Publish Feedback
                                  <Rocket className="h-4 w-4 group-hover:animate-bounce" />
                                </>
                              )}
                            </div>
                          </Button>
                        </motion.div>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div> {/* closes main form card container */}

            {/* Questions Section with improved layout */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card className="shadow-xl border-0 bg-white/5 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <Target className="h-5 w-5 text-purple-400" />
                    Feedback Questions
                    <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                      {questions.length} Questions
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Add and manage your feedback questions with AI assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Existing Questions */}
                <AnimatePresence mode="popLayout">
                  {questions.map((question, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="group"
                    >
                      <Card className="border-l-4 border-l-purple-400 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-indigo-200 mb-2">{question.text}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs bg-indigo-800/80 text-indigo-200 border-indigo-400/40">
                                  {question.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Badge>
                                {question.options && question.options.length > 0 && (
                                  <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-200 border-purple-400/30">
                                    {question.options.length} options
                                  </Badge>
                                )}
                              </div>
                              {question.options && question.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-indigo-300 mb-1">Options:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {question.options.map((option, optIndex) => (
                                      <span 
                                        key={optIndex}
                                        className="inline-block text-xs bg-indigo-800/80 text-indigo-200 px-2 py-1 rounded border border-indigo-400/20"
                                      >
                                        {option}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* No Questions State */}
                {questions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-white/60"
                  >
                    <Target className="h-12 w-12 mx-auto mb-3 text-white/30" />
                    <p className="text-lg font-medium mb-2">No questions added yet</p>
                    <p className="text-sm text-white/40">
                      Start by adding your first feedback question below
                    </p>
                  </motion.div>
                )}

                {/* Add New Question Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-6 border-2 border-dashed border-indigo-700/40 rounded-xl bg-gradient-to-br from-indigo-900/90 to-purple-900/80 hover:border-purple-400/60 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-purple-300" />
                    <Label className="text-lg font-medium text-indigo-200">Add New Question</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div whileHover={{ scale: 1.01 }}>
                      <Label className="text-sm font-medium mb-2 block text-indigo-200">Question Type</Label>
                      <Select
                        value={currentQuestion.type}
                        onValueChange={(value) =>
                          setCurrentQuestion({ ...currentQuestion, type: value as QuestionType })
                        }
                      >
                        <SelectTrigger className="bg-indigo-800/80 border-indigo-400/40 text-indigo-100 focus:border-purple-400 placeholder-indigo-300">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent className="bg-indigo-900 text-indigo-100">
                          <SelectItem value="multipleChoice">📋 Multiple Choice</SelectItem>
                          <SelectItem value="shortAnswer">✍️ Short Answer</SelectItem>
                          <SelectItem value="trueFalse">✅ True/False</SelectItem>
                          <SelectItem value="ratingScale">⭐ Rating Scale</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.01 }}>
                      <Label className="text-sm font-medium mb-2 block text-indigo-200">Question Text</Label>
                      <Input
                        placeholder="Enter your question..."
                        value={currentQuestion.text}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                        }
                        className="bg-indigo-800/80 border-indigo-400/40 text-indigo-100 placeholder-indigo-300 focus:border-purple-400"
                      />
                    </motion.div>
                  </div>

                  {['multipleChoice', 'ratingScale'].includes(currentQuestion.type) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <Label className="text-sm font-medium text-indigo-200">Options (comma separated)</Label>
                      <Input
                        placeholder="Option 1, Option 2, Option 3, Option 4"
                        value={currentQuestion.options?.join(', ') || ''}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            options: e.target.value.split(',').map((opt) => opt.trim()),
                          })
                        }
                        className="bg-indigo-800/80 border-indigo-400/40 text-indigo-100 placeholder-indigo-300 focus:border-purple-400"
                      />
                    </motion.div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <Button 
                      type="button" 
                      onClick={addQuestion} 
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-indigo-100 border-0 shadow-lg"
                      disabled={!currentQuestion.text.trim()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question to Form
                    </Button>
                  </motion.div>
                </motion.div>
                </CardContent>
              </Card>
          </motion.div>
        </main> {/* closes main */}

        {/* Students Selection Section */}
        <section className="col-span-1 lg:col-span-4 mt-8">
          <Card className="shadow-xl border-0 bg-white/5 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Users className="h-5 w-5 text-emerald-400" />
                Select Students
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30">
                  {students.length} Students
                </Badge>
              </CardTitle>
              <CardDescription className="text-white/70">
                Choose which students will receive this feedback form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center mb-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-emerald-700/80 text-white hover:bg-emerald-800/90"
                  onClick={() => setSelectedStudents(students.map(s => s._id))}
                  disabled={students.length === 0}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-indigo-700/80 text-white hover:bg-indigo-800/90"
                  onClick={() => setSelectedStudents([])}
                  disabled={selectedStudents.length === 0}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-purple-700/80 text-white hover:bg-purple-800/90"
                  onClick={async () => {
                    setIsLoadingStudents(true);
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/students?department=${encodeURIComponent(user.department)}`, {
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                      });
                      if (!response.ok) throw new Error(await response.text());
                      const data = await response.json();
                      setStudents(data);
                      toast.success('Student list refreshed!');
                    } catch (error) {
                      toast.error('Failed to refresh students.');
                    } finally {
                      setIsLoadingStudents(false);
                    }
                  }}
                  disabled={isLoadingStudents}
                >
                  Refresh
                </Button>
              </div>
              {isLoadingStudents ? (
                <div className="text-indigo-200 text-center py-8">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="text-indigo-200 text-center py-8">No students found for this department.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {students.map((student) => (
                    <label
                      key={student._id}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition border-2 border-transparent bg-gradient-to-br from-indigo-900/80 to-purple-900/80 hover:border-emerald-400/60 shadow-md ${selectedStudents.includes(student._id) ? 'ring-2 ring-emerald-400 border-emerald-400/60' : ''}`}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student._id)}
                        onCheckedChange={(checked) => {
                          setSelectedStudents((prev) =>
                            checked
                              ? [...prev, student._id]
                              : prev.filter((id) => id !== student._id)
                          );
                        }}
                        className="accent-emerald-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{student.name}</span>
                        <span className="text-indigo-200 text-xs">{student.email}</span>
                        <span className="text-indigo-300 text-xs">{student.department}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* AI Description Suggestions Dialog */}
        <Dialog open={isAIDescriptionDialogOpen} onOpenChange={setIsAIDescriptionDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Description Suggestions</DialogTitle>
              <DialogDescription>
                Select a suggestion to use as your feedback form description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {aiDescriptionError && (
                <div className="text-red-500 text-sm">{aiDescriptionError}</div>
              )}
              {aiDescriptionSuggestions.length > 0 ? (
                (() => {
                  // Deep flatten and extract strings from any type of nested or stringified array
                  const extractStringsRecursive = (input: any): string[] => {
                    const result: string[] = [];

                    const process = (item: any) => {
                      if (typeof item === 'string') {
                        // Try to parse JSON-like strings
                        const trimmed = item.trim();
                        try {
                          const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
                          process(parsed);
                        } catch {
                          if (
                            trimmed &&
                            !['[', ']', '""', 'json'].includes(trimmed.toLowerCase()) &&
                            !trimmed.startsWith('```json') &&
                            !((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']')))
                          ) {
                            result.push(trimmed);
                          }
                        }
                      } else if (Array.isArray(item)) {
                        item.forEach(process);
                      }
                    };

                    process(input);
                    return result;
                  };

                  const allSuggestions: string[] = ([] as string[]).concat(
                    ...aiDescriptionSuggestions.map(extractStringsRecursive)
                  );

                  return allSuggestions.slice(0, 3).map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="bg-indigo-900/90 border border-emerald-400/40 rounded-lg p-4 text-white font-medium cursor-pointer hover:bg-emerald-900/80 transition shadow-lg"
                      onClick={() => {
                        setFormData(fd => ({ ...fd, description: suggestion }));
                        setIsAIDescriptionDialogOpen(false);
                        toast.success('Description applied!');
                      }}
                    >
                      {suggestion}
                    </div>
                  ));
                })()
              ) : (
                <div className="text-sm text-muted-foreground">No suggestions available.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div> {/* closes main content grid */}
      </div> {/* closes container mx-auto */}
    </div> {/* closes min-h-screen gradient background */}
  </AppLayout>
  );
};

export default TeacherFeedbackManagement;
