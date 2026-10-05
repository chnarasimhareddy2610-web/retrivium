import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import BrowsePage from "./pages/BrowsePage";
import ReportsPage from "./pages/ReportsPage";
import ClaimsPage from "./pages/ClaimsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/auth/LoginPage";
import ReportFormPage from "./pages/ReportFormPage";

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Routes>
          {/* Public & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<LoginPage mode="register" />} />

          {/* Main Application Shell (Authenticated / Primary Navigation) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reports/lost" element={<ReportFormPage mode="Lost" />} />
              <Route path="/reports/found" element={<ReportFormPage mode="Found" />} />
              <Route path="/claims" element={<ClaimsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
