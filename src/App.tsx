import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SchoolProvider } from "@/context/SchoolContext";
import Index from "./pages/Index";
import OurTeam from "./pages/OurTeam";
import AdmissionForm from "./pages/AdmissionForm";
import NotFound from "./pages/NotFound";
import PortalLoginPage from "./pages/portal/LoginPage";
import Dashboard from "./pages/portal/Dashboard";
import StaffPage from "./pages/portal/StaffPage";
import StudentsPage from "./pages/portal/StudentsPage";
import FeesPage from "./pages/portal/FeesPage";
import SalaryPage from "./pages/portal/SalaryPage";
import ParentDashboard from "./pages/portal/ParentDashboard";
import TeacherDashboard from "./pages/portal/TeacherDashboard";
import WebsiteManagePage from "./pages/portal/WebsiteManagePage";
import ExaminationsPage from "./pages/portal/ExaminationsPage";
import ClassTeacherPage from "./pages/portal/ClassTeacherPage";
import SubjectAssignmentPage from "./pages/portal/SubjectAssignmentPage";
import NoticesPage from "./pages/portal/NoticesPage";

const queryClient = new QueryClient();

function PortalRoutes() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <PortalLoginPage />;
  return <SchoolProvider><AuthenticatedPortalRoutes role={user?.role} /></SchoolProvider>;
}

function AuthenticatedPortalRoutes({ role }: { role?: string }) {
  if (role === "parent") {
    return <Routes><Route path="/" element={<ParentDashboard />} /><Route path="*" element={<Navigate to="/portal" />} /></Routes>;
  }
  if (role === "teacher") {
    return <Routes><Route path="/" element={<TeacherDashboard />} /><Route path="/students" element={<StudentsPage />} /><Route path="*" element={<Navigate to="/portal" />} /></Routes>;
  }
  if (role === "cashier") {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/portal/students" />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/fees" element={<FeesPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="*" element={<Navigate to="/portal/students" />} />
      </Routes>
    );
  }
  if (role === "exam_incharge") {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/portal/examinations" />} />
        <Route path="/examinations" element={<ExaminationsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="*" element={<Navigate to="/portal/examinations" />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/staff" element={<StaffPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/fees" element={<FeesPage />} />
      <Route path="/salary" element={<SalaryPage />} />
      <Route path="/notices" element={<NoticesPage />} />
      <Route path="/website" element={<WebsiteManagePage />} />
      <Route path="/examinations" element={<ExaminationsPage />} />
      <Route path="/class-teachers" element={<ClassTeacherPage />} />
      <Route path="/subject-assignments" element={<SubjectAssignmentPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/our-team" element={<OurTeam />} />
            <Route path="/admission-form" element={<AdmissionForm />} />
            <Route path="/portal/*" element={<PortalRoutes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
