import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, User, CheckCircle, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow, format, parseISO, isPast } from 'date-fns';
import Spinner from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  _id?: string;
  type: 'multipleChoice' | 'shortAnswer' | 'trueFalse' | 'ratingScale';
  text: string;
  options?: string[];
  correctAnswer?: string;
}

interface Form {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  createdBy: string;
  questions: Question[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  department: string;
}

interface Answer {
  questionId: string;
  response: string | string[];
  rating?: number;
}

interface FeedbackResponse {
  formId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  _id?: string;
}

interface FeedbackFormCardProps {
  form: Form;
  teacher?: Teacher;
  userResponse?: FeedbackResponse;
  readOnly?: boolean;
  isSubmitting?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (answers: Answer[]) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getFormattedDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'PPP');
  } catch (e) {
    return dateString;
  }
};

const getTimeRemaining = (deadline: string) => {
  try {
    const deadlineDate = parseISO(deadline);
    if (isPast(deadlineDate)) {
      return 'Expired';
    }
    return formatDistanceToNow(deadlineDate, { addSuffix: true });
  } catch (e) {
    return 'Invalid date';
  }
};

const FeedbackFormCard: React.FC<FeedbackFormCardProps> = ({ 
  form, 
  teacher, 
  userResponse, 
  readOnly = false,
  isSubmitting = false,
  isOpen = false,
  onOpenChange,
  onSubmit 
}) => {
  const { refreshToken } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(isOpen);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  
  // Update internal state when external state changes
  useEffect(() => {
    setDialogOpen(isOpen);
  }, [isOpen]);
  
  // Initialize answers when dialog opens
  useEffect(() => {
    if (dialogOpen && !readOnly && !userResponse) {
      // Create initial answers for each question
      const initialAnswers = form.questions.map(question => ({
        questionId: question._id || '',
        response: ''
      }));
      setAnswers(initialAnswers);
    }
  }, [dialogOpen, form.questions, readOnly, userResponse]);
  
  const isExpired = isPast(parseISO(form.deadline));
  const isCompleted = !!userResponse;
  
  // Check for invalid question IDs
  const hasInvalidQuestionIds = form.questions.some(q => !q._id || typeof q._id !== 'string' || q._id.length < 8);

  // Helper: check if at least one answer is filled
  const hasAtLeastOneAnswer = answers.some(a => a.response && (typeof a.response === 'string' ? a.response.trim() !== '' : Array.isArray(a.response) ? a.response.length > 0 : false));

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  
  const handleAnswerChange = (questionId: string, response: string | string[], rating?: number) => {
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === questionId);
      
      if (existingIndex >= 0) {
        // Update existing answer
        const newAnswers = [...prev];
        newAnswers[existingIndex] = { 
          ...newAnswers[existingIndex], 
          response,
          ...(rating !== undefined && { rating })
        };
        return newAnswers;
      } else {
        // Add new answer
        return [...prev, { 
          questionId, 
          response,
          ...(rating !== undefined && { rating })
        }];
      }
    });
  };
  
  const handleSubmit = async () => {
    if (hasInvalidQuestionIds) {
      alert('This feedback form is misconfigured (missing question IDs). Please contact your teacher.');
      return;
    }
    if (!onSubmit) return;
    // Only submit answers that are filled
    const nonEmptyAnswers = answers.filter(a => a.response && (typeof a.response === 'string' ? a.response.trim() !== '' : Array.isArray(a.response) ? a.response.length > 0 : false));
    if (nonEmptyAnswers.length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }
    try {
      await onSubmit(nonEmptyAnswers);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };
  
  // Helper to get the user's answer for a specific question
  const getUserAnswer = (questionId: string) => {
    if (!userResponse) return null;
    return userResponse.answers.find(answer => answer.questionId === questionId)?.response;
  };
  
  // Add AI suggestion logic
  const getAISuggestion = (question: Question) => {
    // Placeholder: In real use, call an AI API here
    if (question.type === 'ratingScale') return '5';
    if (question.type === 'multipleChoice' && question.options?.length) return question.options[0];
    if (question.type === 'trueFalse') return 'true';
    return 'Great experience!';
  };

  const getAISuggestionsFromAPI = async () => {
    setAiLoading(true);
    try {
      let token = localStorage.getItem('eduToken');
      if (!token) {
        throw new Error('Please log in to use AI suggestions');
      }

      // Validate questions before sending
      const validQuestions = form.questions.filter(q => q._id && q.text);
      if (validQuestions.length === 0) {
        throw new Error('No valid questions found in this form');
      }

      const response = await fetch(`${API_BASE_URL}/api/ai-feedback-suggest`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          questions: validQuestions.map(q => ({ 
            id: q._id, 
            text: q.text, 
            type: q.type, 
            options: q.options 
          })) 
        })
      });

      if (!response.ok && response.status === 403) {
        // Token might be expired, refresh token
        refreshToken();
        return; // Exit early as user will be redirected to login
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusText = response.status === 401 ? 'Authentication failed' : 
                          response.status === 403 ? 'Access denied' :
                          response.status === 500 ? 'AI service temporarily unavailable' :
                          'Network error';
        throw new Error(errorData.message || `${statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log('AI response received:', data);

      if (data && data.suggestions && typeof data.suggestions === 'object') {
        const newAnswers = form.questions.map(q => {
          const questionId = q._id || '';
          const suggestion = data.suggestions[questionId] || '';
          return {
            questionId,
            response: suggestion
          };
        });

        setAnswers(newAnswers);
        toast({
          title: "Success!",
          description: `AI suggestions generated for ${Object.keys(data.suggestions).length} questions!`,
        });
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (e) {
      console.error('AI suggestion error:', e);
      const errorMessage = e instanceof Error ? e.message : 'AI suggestion failed';
      toast({
        title: "AI Suggestion Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{form.title}</CardTitle>
            <Badge variant={isCompleted ? "secondary" : isExpired ? "destructive" : "default"}>
              {isCompleted ? "Completed" : isExpired ? "Expired" : "Active"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{form.description || 'No description provided'}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-3 text-sm">
            {teacher && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-700">
                  {teacher.name} ({teacher.department})
                </span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700">{getFormattedDate(form.deadline)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className={`${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                {getTimeRemaining(form.deadline)}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-gray-600">
                Questions: {form.questions.length}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            variant={isCompleted ? "outline" : "default"}
            onClick={() => handleOpenChange(true)}
            disabled={!isCompleted && isExpired}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                View Response
              </>
            ) : isExpired ? (
              "Deadline Passed"
            ) : (
              "Fill Feedback"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.title}</DialogTitle>
            <DialogDescription>
              {form.description || 'Please provide your feedback by answering the questions below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {form.questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No questions found in this feedback form.
              </div>
            ) : (
              <>
                {!readOnly && !isCompleted && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-blue-900 mb-1">
                          ✨ AI-Powered Suggestions
                        </h3>
                        <p className="text-xs text-blue-700">
                          Let AI generate thoughtful, constructive feedback responses for you
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={getAISuggestionsFromAPI}
                        disabled={aiLoading}
                        className="ml-4 border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {aiLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            🤖 Generate AI Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {form.questions.map((question, index) => {
                  const questionId = question._id || `question-${index}`;
                  const userAnswer = getUserAnswer(questionId);
                  
                  return (
                    <div key={questionId} className="space-y-3 border-b pb-4 last:border-b-0">
                      <h4 className="font-medium">
                        {index + 1}. {question.text}
                      </h4>
                      
                      {question.type === 'multipleChoice' && (
                        <RadioGroup 
                          disabled={readOnly || isCompleted || isSubmitting}
                          value={
                            readOnly && userAnswer 
                              ? String(userAnswer) 
                              : (answers.find(a => a.questionId === questionId)?.response as string) || ''
                          }
                          onValueChange={(value) => handleAnswerChange(questionId, value)}
                        >
                          {question.options?.map((option, optionIndex) => (
                            <div className="flex items-center space-x-2" key={optionIndex}>
                              <RadioGroupItem value={option} id={`${questionId}-option-${optionIndex}`} />
                              <Label htmlFor={`${questionId}-option-${optionIndex}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      
                      {question.type === 'shortAnswer' && (
                        <Textarea 
                          placeholder={readOnly ? "No answer provided" : "Your answer"}
                          disabled={readOnly || isCompleted || isSubmitting}
                          value={
                            readOnly && userAnswer 
                              ? String(userAnswer) 
                              : (answers.find(a => a.questionId === questionId)?.response as string) || ''
                          }
                          onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                        />
                      )}
                      
                      {question.type === 'trueFalse' && (
                        <RadioGroup 
                          disabled={readOnly || isCompleted || isSubmitting}
                          value={
                            readOnly && userAnswer 
                              ? String(userAnswer) 
                              : (answers.find(a => a.questionId === questionId)?.response as string) || ''
                          }
                          onValueChange={(value) => handleAnswerChange(questionId, value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`${questionId}-true`} />
                            <Label htmlFor={`${questionId}-true`}>True</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`${questionId}-false`} />
                            <Label htmlFor={`${questionId}-false`}>False</Label>
                          </div>
                        </RadioGroup>
                      )}
                      
                      {question.type === 'ratingScale' && (
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant={
                                (readOnly && userAnswer === String(rating)) || 
                                (!readOnly && answers.find(a => a.questionId === questionId)?.response === String(rating))
                                  ? "default" 
                                  : "outline"
                              }
                              size="sm"
                              disabled={readOnly || isCompleted || isSubmitting}
                              onClick={() => handleAnswerChange(questionId, String(rating), rating)}
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
          
          {userResponse && (
            <div className="text-sm text-gray-500 mt-2">
              Submitted on {getFormattedDate(userResponse.submittedAt)}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            {!readOnly && !isCompleted && !isSubmitting && (
              <Button onClick={handleSubmit} disabled={isSubmitting || !hasAtLeastOneAnswer || hasInvalidQuestionIds}>
                Submit Feedback
              </Button>
            )}
            {hasInvalidQuestionIds && (
              <div className="text-red-600 text-sm mt-2 text-center w-full">
                This feedback form is misconfigured (missing question IDs). Please contact your teacher.
              </div>
            )}
            {isSubmitting && (
              <Button disabled>
                <Spinner className="mr-2 h-4 w-4" />
                Submitting...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackFormCard;