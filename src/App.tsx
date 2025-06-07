import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ThankYou from "./pages/ThankYou";
import StudentDashboard from "./pages/student/StudentDashboard";
import Results from "./pages/feedback/Results";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import HodDashboard from "./pages/hod/HodDashboard";
import StudentFeedback from "./pages/feedback/StudentFeedback";
import TeacherFeedbackManagement from "./pages/feedback/TeacherFeedbackManagement";
import RouteGuard from "./components/RouteGuard";
import Attendance from "./pages/feedback/attendance";
import StudentAttendancePage from "./pages/student/Attendance";
import Profile from "./pages/feedback/Profile";
import CoursesStudent from "./pages/feedback/CoursesStudent"; 
import CoursesTeacher from "./pages/feedback/CoursesTeacher";
import ManageStudents from "./pages/teacher/ManageStudents";
import AILearningCompanion from "./pages/ai/AILearningCompanion";
import AIQuizArena from "./pages/ai/AIQuizArena";
const GOOGLE_CLIENT_ID = "848808041308-um447s2kvr380bn3bnk7u9emlv7acsba.apps.googleusercontent.com";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/Results" element={<Results />} />

                {/* Student routes */}
                <Route path="/student/dashboard" element={
                  <RouteGuard allowedRoles={['student']}>
                    <StudentDashboard />
                  </RouteGuard>
                } />
                <Route path="/student/feedback" element={
                  <RouteGuard allowedRoles={['student']}>
                    <StudentFeedback />
                  </RouteGuard>
                } />
                <Route path="/student/Courses" element={
                  <RouteGuard allowedRoles={['student']}>
                    <CoursesStudent />
                  </RouteGuard>
                } />
                <Route path="/student/attendance" element={  
                  <RouteGuard allowedRoles={['student']}>
                    <StudentAttendancePage />
                  </RouteGuard>
                } />

                {/* AI Features - Available to all authenticated users */}
                <Route path="/ai/learning-companion" element={
                  <RouteGuard allowedRoles={['student', 'teacher', 'hod']}>
                    <AILearningCompanion />
                  </RouteGuard>
                } />
                <Route path="/ai/quiz-arena" element={
                  <RouteGuard allowedRoles={['student', 'teacher', 'hod']}>
                    <AIQuizArena />
                  </RouteGuard>
                } />

                {/* Teacher routes */}
                <Route path="/teacher/dashboard" element={
                  <RouteGuard allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </RouteGuard>
                } />
                <Route path="/teacher/Courses" element={
                  <RouteGuard allowedRoles={['teacher']}>
                    <CoursesTeacher />
                  </RouteGuard>
                } />
                <Route path="/teacher/courses/:courseId/students" element={
                  <RouteGuard allowedRoles={['teacher']}>
                    <ManageStudents />
                  </RouteGuard>
                } />
                <Route path="/teacher/feedback" element={
                  <RouteGuard allowedRoles={['teacher']}>
                    <TeacherFeedbackManagement />
                  </RouteGuard>
                } />
                <Route path="/teacher/attendance" element={
                  <RouteGuard allowedRoles={['teacher']}>
                    <Attendance />
                  </RouteGuard>
                } />
                <Route path="/teacher/profile" element={
                    <Profile />
                } />

                {/* HOD routes */}
                <Route path="/hod/dashboard" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />
                <Route path="/hod/courses" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />
                <Route path="/hod/teachers" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />
                <Route path="/hod/students" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />
                <Route path="/hod/feedback" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />
                <Route path="/hod/analytics" element={
                  <RouteGuard allowedRoles={['hod']}>
                    <HodDashboard />
                  </RouteGuard>
                } />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
