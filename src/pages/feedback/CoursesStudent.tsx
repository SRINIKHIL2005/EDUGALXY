import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Book, Calendar, Clock, FileText, User, Sparkles, Brain, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface Course {
  _id: string;
  name: string;
  code: string;
  teacher: { _id: string; name: string; email: string } | string;
  schedule?: string[];
  description?: string;
  materials?: { title: string; url: string }[];
  assignments?: { title: string; dueDate: string }[];
  department?: string;
}

interface AICourseRecommendation {
  courseCode: string;
  courseName: string;
  reason: string;
  difficulty: string;
  connection: string;
  courseId?: string;
  actualCourse?: Course;
}

interface AIDifficultyAssessment {
  assessment: {
    difficultyLevel: string;
    suitabilityScore: number;
    prerequisitesMet: boolean;
    workloadCompatible: boolean;
    successProbability: string;
    recommendations: string[];
    potentialChallenges: string[];
    preparationSuggestions: string[];
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentCoursesPage: React.FC = () => {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Features state
  const [isAIRecommendationsDialogOpen, setIsAIRecommendationsDialogOpen] = useState(false);
  const [isAIDifficultyDialogOpen, setIsAIDifficultyDialogOpen] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AICourseRecommendation[]>([]);
  const [aiDifficultyAssessment, setAIDifficultyAssessment] = useState<AIDifficultyAssessment | null>(null);
  const [selectedCourseForAssessment, setSelectedCourseForAssessment] = useState<Course | null>(null);
  const [aiLoading, setAILoading] = useState(false);

  // Dialog state for viewing course details and materials
  const [isViewCourseDialogOpen, setIsViewCourseDialogOpen] = useState(false);
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [selectedCourseForMaterials, setSelectedCourseForMaterials] = useState<Course | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    const fetchCoursesData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const coursesResponse = await fetch(`${API_BASE_URL}/api/student/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
        // Optionally fetch teachers if needed for display
      } catch (err: any) {
        setError(err.message || 'Failed to load courses data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoursesData();
  }, [user, token]);

  // Fetch all available courses for enrollment
  useEffect(() => {
    if (!user || !token) return;
    const fetchAllCourses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch all courses');
        const data = await res.json();
        setAllCourses(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchAllCourses();
  }, [user, token]);

  // Find teacher name for a course
  const getTeacherName = (course: Course): string => {
    if (typeof course.teacher === 'object' && course.teacher !== null) {
      return course.teacher.name;
    } else if (typeof course.teacher === 'string') {
      const teacherObj = teachers.find(t => t._id === course.teacher);
      return teacherObj ? teacherObj.name : 'Unknown Teacher';
    }
    return 'Unknown Teacher';
  };
  
  // Get next upcoming assignment for a course
  const getNextAssignment = (course: Course) => {
    if (!course.assignments || course.assignments.length === 0) return null;
    
    const today = new Date();
    const futureAssignments = course.assignments
      .filter(a => new Date(a.dueDate) >= today)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return futureAssignments[0];
  };
  
  // Format date as "Apr 23, 2025"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
    // Enroll in a course
  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to enroll');
      }
      // Refresh enrolled courses
      const updatedCoursesRes = await fetch(`${API_BASE_URL}/api/student/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setCourses(await updatedCoursesRes.json());
    } catch (err: any) {
      setError(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  // AI Course Recommendations
  const handleGetAIRecommendations = async () => {
    setAILoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-course-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to get AI recommendations');
      }
      const data = await response.json();
      setAIRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      setIsAIRecommendationsDialogOpen(true);
    } catch (error: any) {
      setError(error.message || 'Failed to get AI course recommendations. Please try again.');
      setAIRecommendations([]);
      setIsAIRecommendationsDialogOpen(true);
    } finally {
      setAILoading(false);
    }
  };

  // AI Course Difficulty Assessment
  const handleGetAIDifficultyAssessment = async (course: Course) => {
    setSelectedCourseForAssessment(course);
    setAILoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-course-difficulty`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course._id,
          courseName: course.name,
          courseCode: course.code,
          description: course.description,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to get AI difficulty assessment');
      }
      const data = await response.json();
      let assessment = data.assessment;
      if (!assessment && data.difficulty) {
        assessment = {
          difficultyLevel: data.difficulty,
          suitabilityScore: 7,
          prerequisitesMet: true,
          workloadCompatible: true,
          successProbability: 'Likely',
          recommendations: [data.recommendedPreparation || 'Review prerequisites.'],
          potentialChallenges: [],
          preparationSuggestions: [data.reasoning || 'Prepare as needed.'],
        };
      }
      setAIDifficultyAssessment({ assessment });
      setIsAIDifficultyDialogOpen(true);
    } catch (error: any) {
      setError(error.message || 'Failed to get AI difficulty assessment. Please try again.');
      setAIDifficultyAssessment(null);
      setIsAIDifficultyDialogOpen(true);
    } finally {
      setAILoading(false);
    }
  };
  // Enroll from AI recommendations
  const handleEnrollFromRecommendation = async (recommendation: AICourseRecommendation) => {
    if (recommendation.courseId) {
      await handleEnroll(recommendation.courseId);
      setIsAIRecommendationsDialogOpen(false);
    }
  };

  // Handler for View Course
  const handleViewCourse = (course: Course) => {
    setSelectedCourseForView(course);
    setIsViewCourseDialogOpen(true);
  };
  // Handler for Materials
  const handleViewMaterials = (course: Course) => {
    setSelectedCourseForMaterials(course);
    setIsMaterialsDialogOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout pageTitle="My Courses">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading courses data...</p>
        </div>
      </AppLayout>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <AppLayout pageTitle="My Courses">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </AppLayout>
    );
  }

  // Show all available courses for enrollment if not already enrolled
  const availableCourses = allCourses.filter(
    (c) => !courses.some((enrolled) => enrolled._id === c._id)
  );
  return (
    <AppLayout pageTitle="My Courses">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">My Courses</h2>
          <p className="text-gray-500">View and manage your enrolled courses</p>
        </div>
        <Button 
          onClick={handleGetAIRecommendations} 
          className="bg-edu-primary hover:bg-edu-primary-dark"
          disabled={aiLoading}
        >
          <Sparkles size={16} className="mr-1" /> 
          {aiLoading ? 'Loading...' : 'AI Course Recommendations'}
        </Button>
      </div>

      {/* Enrollment section */}
      {availableCourses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Available Courses to Enroll</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <Card key={course._id} className="overflow-hidden border-2 border-dashed border-edu-primary">
                <div className="h-2 bg-edu-primary/50" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book size={18} className="text-edu-primary" />
                    <div>
                      <span className="text-sm font-normal text-gray-500 block">{course.code}</span>
                      {course.name}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">{course.description || 'No description provided.'}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={aiLoading}
                        onClick={() => handleGetAIDifficultyAssessment(course)}
                      >
                        <Brain size={14} className="mr-1" /> 
                        {aiLoading && selectedCourseForAssessment?._id === course._id ? 'Assessing...' : 'AI Assessment'}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-edu-primary hover:bg-edu-primary-dark"
                        disabled={enrolling === course._id}
                        onClick={() => handleEnroll(course._id)}
                      >
                        {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled courses section */}
      {courses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const nextAssignment = getNextAssignment(course);
            return (
              <Card key={course._id} className="overflow-hidden">
                <div className="h-2 bg-edu-primary" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book size={18} className="text-edu-primary" />
                    <div>
                      <span className="text-sm font-normal text-gray-500 block">{course.code}</span>
                      {course.name}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>{getTeacherName(course)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{course.schedule ? course.schedule.join(' / ') : 'No schedule available'}</span>
                    </div>
                    {nextAssignment && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-amber-500" />
                        <span>
                          Next due: <span className="font-medium">{nextAssignment.title}</span> - {formatDate(nextAssignment.dueDate)}
                        </span>
                      </div>
                    )}                    <div className="pt-2 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewMaterials(course)}>
                        <FileText size={16} className="mr-1" /> Materials
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        disabled={aiLoading}
                        onClick={() => handleGetAIDifficultyAssessment(course)}
                      >
                        <Target size={16} className="mr-1" /> 
                        {aiLoading && selectedCourseForAssessment?._id === course._id ? 'Analyzing...' : 'AI Analysis'}
                      </Button>
                      <Button size="sm" className="flex-1 bg-edu-primary hover:bg-edu-primary-dark" onClick={() => handleViewCourse(course)}>
                        View Course
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}      {/* AI Course Recommendations Dialog */}
      <Dialog open={isAIRecommendationsDialogOpen} onOpenChange={setIsAIRecommendationsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-edu-primary" />
              AI Course Recommendations
            </DialogTitle>
            <DialogDescription>
              Based on your academic profile and current courses, here are personalized course recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Generating recommendations...</div>
              </div>
            ) : aiRecommendations.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No recommendations available at the moment.</p>
            ) : (
              <div className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-gray-500">{rec.courseCode}</div>
                        <div className="font-semibold text-gray-800">{rec.courseName}</div>
                        <div className="text-sm text-blue-600 font-medium">Difficulty: {rec.difficulty}</div>
                      </div>
                      {rec.courseId && (
                        <Button
                          size="sm"
                          className="bg-edu-primary hover:bg-edu-primary-dark"
                          onClick={() => handleEnrollFromRecommendation(rec)}
                          disabled={enrolling === rec.courseId}
                        >
                          {enrolling === rec.courseId ? 'Enrolling...' : 'Enroll'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><span className="font-medium">Why this course:</span> {rec.reason}</div>
                      <div><span className="font-medium">Connection to your studies:</span> {rec.connection}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIRecommendationsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Difficulty Assessment Dialog */}
      <Dialog open={isAIDifficultyDialogOpen} onOpenChange={setIsAIDifficultyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-edu-primary" />
              AI Difficulty Assessment
            </DialogTitle>
            <DialogDescription>
              Detailed analysis for: <span className="font-medium">{selectedCourseForAssessment?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Analyzing course difficulty...</div>
              </div>
            ) : aiDifficultyAssessment ? (
              <div className="space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Difficulty Level</div>
                    <div className="text-lg font-semibold text-blue-700">
                      {aiDifficultyAssessment.assessment.difficultyLevel}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Suitability Score</div>
                    <div className="text-lg font-semibold text-green-700">
                      {aiDifficultyAssessment.assessment.suitabilityScore}/10
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600">Prerequisites</div>
                    <div className="text-lg font-semibold text-purple-700">
                      {aiDifficultyAssessment.assessment.prerequisitesMet ? 'Met' : 'Not Met'}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-gray-600">Success Probability</div>
                    <div className="text-lg font-semibold text-orange-700">
                      {aiDifficultyAssessment.assessment.successProbability}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {aiDifficultyAssessment.assessment.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {aiDifficultyAssessment.assessment.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Challenges */}
                {aiDifficultyAssessment.assessment.potentialChallenges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Potential Challenges
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {aiDifficultyAssessment.assessment.potentialChallenges.map((challenge, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preparation Suggestions */}
                {aiDifficultyAssessment.assessment.preparationSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Preparation Suggestions
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {aiDifficultyAssessment.assessment.preparationSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No assessment data available.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDifficultyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Course Dialog */}
      <Dialog open={isViewCourseDialogOpen} onOpenChange={setIsViewCourseDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>
              Details for: <span className="font-medium">{selectedCourseForView?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedCourseForView && (
            <div className="space-y-4">
              <div><span className="font-semibold">Code:</span> {selectedCourseForView.code}</div>
              <div><span className="font-semibold">Description:</span> {selectedCourseForView.description || 'No description provided.'}</div>
              <div><span className="font-semibold">Schedule:</span> {selectedCourseForView.schedule?.join(' / ') || 'No schedule available'}</div>
              {selectedCourseForView.assignments && selectedCourseForView.assignments.length > 0 && (
                <div>
                  <span className="font-semibold">Assignments:</span>
                  <ul className="list-disc ml-6">
                    {selectedCourseForView.assignments.map((a, i) => (
                      <li key={i}>{a.title} (Due: {formatDate(a.dueDate)})</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedCourseForView.materials && selectedCourseForView.materials.length > 0 && (
                <div>
                  <span className="font-semibold">Materials:</span>
                  <ul className="list-disc ml-6">
                    {selectedCourseForView.materials.map((m, i) => (
                      <li key={i}>{m.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewCourseDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Materials Dialog */}
      <Dialog open={isMaterialsDialogOpen} onOpenChange={setIsMaterialsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Materials</DialogTitle>
            <DialogDescription>
              Materials for: <span className="font-medium">{selectedCourseForMaterials?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedCourseForMaterials && selectedCourseForMaterials.materials && selectedCourseForMaterials.materials.length > 0 ? (
            <ul className="space-y-3">
              {selectedCourseForMaterials.materials.map((mat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>{mat.title}</span>
                  {mat.url && (
                    <a href={mat.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-600 underline">Download</a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm">No materials available.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaterialsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default StudentCoursesPage;