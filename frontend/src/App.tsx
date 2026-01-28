import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing.tsx";
import PMDashboard from "./pages/PMDashboard.tsx";
import PMRegistrationPage from "./pages/PMRegistrationPage.tsx";
import InstructorDashboard from "./pages/InstructorDashboard.tsx";
import StepDetailPage from "./pages/StepDetailPage.tsx";
import TaskModulePage from "./pages/TaskModulePage.tsx";
import RegisterInstructorPage from "./pages/RegisterInstructorPage.tsx";
import PMInstructorDetailPage from "./pages/PMInstructorDetailPage.tsx";
import PMStepDefinitionPage from "./pages/PMStepDefinitionPage.tsx";
import PMContentManagementPage from "./pages/PMContentManagementPage.tsx";
import PMTrackManagementPage from "./pages/PMTrackManagementPage.tsx";
import PMInstructorEditPage from "./pages/PMInstructorEditPage.tsx";
import PMInstructorStepsEditPage from "./pages/PMInstructorStepsEditPage.tsx";
import PMAuditLogPage from "./pages/PMAuditLogPage.tsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.tsx";
import EmailVerificationInfoPage from "./pages/EmailVerificationInfoPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import DeleteAccountPage from "./pages/DeleteAccountPage.tsx";
import PMSettingsPage from "./pages/PMSettingsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy load PMStepManagementPage to avoid blocking app startup if @dnd-kit is not installed
const PMStepManagementPage = lazy(() => import("./pages/PMStepManagementPage.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Landing />} />
            
            {/* PM Flow */}
            <Route path="/pm/register-account" element={<PMRegistrationPage />} />
            <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
            <Route path="/auth/verify-email-info" element={<EmailVerificationInfoPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pm/dashboard" element={<ProtectedRoute requiredRole="PM"><PMDashboard /></ProtectedRoute>} />
            <Route path="/pm/settings" element={<ProtectedRoute requiredRole="PM"><PMSettingsPage /></ProtectedRoute>} />
            <Route path="/pm/delete-account" element={<ProtectedRoute requiredRole="PM"><DeleteAccountPage /></ProtectedRoute>} />
            <Route path="/pm/audit-logs" element={<ProtectedRoute requiredRole="PM"><PMAuditLogPage /></ProtectedRoute>} />
            <Route path="/pm/steps" element={<ProtectedRoute requiredRole="PM"><Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}><PMStepManagementPage /></Suspense></ProtectedRoute>} />
            <Route path="/pm/steps/definitions" element={<ProtectedRoute requiredRole="PM"><PMStepDefinitionPage /></ProtectedRoute>} />
            <Route path="/pm/tracks" element={<ProtectedRoute requiredRole="PM"><PMTrackManagementPage /></ProtectedRoute>} />
            <Route path="/pm/course/:track/instructor/:id" element={<ProtectedRoute requiredRole="PM"><PMContentManagementPage /></ProtectedRoute>} />
            <Route path="/pm/register" element={<ProtectedRoute requiredRole="PM"><RegisterInstructorPage /></ProtectedRoute>} />
            <Route path="/pm/instructor/:id" element={<ProtectedRoute requiredRole="PM"><PMInstructorDetailPage /></ProtectedRoute>} />
            <Route path="/pm/instructor/:id/edit" element={<ProtectedRoute requiredRole="PM"><PMInstructorEditPage /></ProtectedRoute>} />
            <Route path="/pm/instructor/:id/steps" element={<ProtectedRoute requiredRole="PM"><PMInstructorStepsEditPage /></ProtectedRoute>} />
            
            {/* Instructor Flow */}
            <Route path="/instructor" element={<ProtectedRoute requiredRole="INSTRUCTOR"><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/instructor/step/:stepNumber" element={<ProtectedRoute requiredRole="INSTRUCTOR"><StepDetailPage /></ProtectedRoute>} />
            <Route path="/instructor/step/:stepNumber/task/:taskId" element={<ProtectedRoute requiredRole="INSTRUCTOR"><TaskModulePage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
