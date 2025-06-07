
export type UserRole = 'student' | 'teacher' | 'hod';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePic?: string;
  department?: string;
  joinedOn?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  credits: number;
  department: string;
  description?: string;
  schedule?: string[];
}

export interface Attendance {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface AttendanceSummary {
  courseId: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface Academic {
  id: string;
  studentId: string;
  courseId: string;
  assignmentScore?: number;
  quizScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  grade?: string;
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  questions: FeedbackQuestion[];
  assignedTo: string[];
  status: 'draft' | 'published' | 'closed';
}

export interface FeedbackQuestion {
  id: string;
  type: 'text' | 'rating' | 'multiple-choice';
  question: string;
  options?: string[];
  required: boolean;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  studentId: string;
  submittedAt: string;
  responses: {
    questionId: string;
    answer: string | number | string[];
  }[];
  comments?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

export interface DashboardSummary {
  courses: number;
  attendance: number;
  feedbackPending: number;
  upcomingAssignments: number;
  averageGrade?: string;
}
