import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./store/slices/authSlice";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import SubmitProposal from "./pages/student/SubmitProposal";
import UploadFiles from "./pages/student/UploadFiles";
import SupervisorPage from "./pages/student/SupervisorPage";
import FeedbackPage from "./pages/student/FeedbackPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import PendingRequests from "./pages/teacher/PendingRequests";
import AssignedStudents from "./pages/teacher/AssignedStudents";
import TeacherFiles from "./pages/teacher/TeacherFiles";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import AssignSupervisor from "./pages/admin/AssignSupervisor";
import DeadlinesPage from "./pages/admin/DeadlinesPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import { Slide, ToastContainer } from "react-toastify";
import {
  getAllUsers,
  getAllProjects,
  getDashboardStats,
} from "./store/slices/adminSlice";

const App = () => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  useEffect(() => {
    if (authUser?.role === "Admin") {
      dispatch(getAllUsers());
      dispatch(getAllProjects());
      dispatch(getDashboardStats());
    }
  }, [authUser, dispatch]);

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const userRole = authUser?.role?.toLowerCase();

    if (!authUser) {
      return <Navigate to="/login" replace />;
    }

    if (
      allowedRoles?.length &&
      userRole &&
      !allowedRoles.map((role) => role.toLowerCase()).includes(userRole)
    ) {
      const redirectPath =
        userRole === "student"
          ? "/student"
          : userRole === "teacher"
            ? "/teacher"
            : userRole === "admin"
              ? "/admin"
              : "/login";

      return <Navigate to={redirectPath} replace />;
    }

    return children;
  };

  if (isCheckingAuth && !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="text-center">
          <div className="loader mb-4"></div>
          <p className="text-gray-500 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/password/reset/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <DashboardLayout userRole={authUser?.role || "Student"} />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="submit-proposal" element={<SubmitProposal />} />
          <Route path="upload-files" element={<UploadFiles />} />
          <Route path="supervisor" element={<SupervisorPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <DashboardLayout userRole={authUser?.role || "Teacher"} />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="pending-requests" element={<PendingRequests />} />
          <Route path="assigned-students" element={<AssignedStudents />} />
          <Route path="files" element={<TeacherFiles />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout userRole={authUser?.role || "Admin"} />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="assign-supervisor" element={<AssignSupervisor />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
      </Routes>

      <ToastContainer theme="dark" transition={Slide} />
    </BrowserRouter>
  );
};

export default App;
