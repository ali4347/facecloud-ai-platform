import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ModeratorAccessGate } from './components/layout/ModeratorAccessGate'

// Public & Auth pages
import Landing from './pages/Landing'
import About from './pages/About'
import Contact from './pages/Contact'
import ModeratorRole from './pages/ModeratorRole'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Unauthorized from './pages/Unauthorized'
import AdminLogin from './pages/admin/AdminLogin'
import ModeratorLogin from './pages/moderator/ModeratorLogin'

// User pages
import Dashboard from './pages/user/Dashboard'
import UploadCenter from './pages/user/UploadCenter'
import UploadSingle from './pages/user/UploadSingle'
import UploadMultiple from './pages/user/UploadMultiple'
import UploadZip from './pages/user/UploadZip'
import ProcessingPage from './pages/user/ProcessingPage'
import MyImages from './pages/user/MyImages'
import ImageDetail from './pages/user/ImageDetail'
import IdentityGroups from './pages/user/IdentityGroups'
import GroupDetail from './pages/user/GroupDetail'
import Downloads from './pages/user/Downloads'
import Notifications from './pages/user/Notifications'
import ActivityLogs from './pages/user/ActivityLogs'
import Settings from './pages/user/Settings'
import LiveEnhancement from './pages/user/LiveEnhancement'
import ProcessingJobs from './pages/user/ProcessingJobs'

// Admin pages
import AdminOverview from './pages/admin/AdminOverview'
import UsersPage from './pages/admin/Users'
import AuditLogs from './pages/admin/AuditLogs'
import Security from './pages/admin/Security'
import Moderators from './pages/admin/Moderators'
import SystemMonitoring from './pages/admin/SystemMonitoring'
import UploadStatistics from './pages/admin/UploadStatistics'
import RejectionSummary from './pages/admin/RejectionSummary'
import ImageMonitoring from './pages/admin/ImageMonitoring'

// Moderator pages
import ModeratorDashboard from './pages/moderator/ModeratorDashboard'
import ReviewQueue from './pages/moderator/ReviewQueue'
import ModeratorImageReview from './pages/moderator/ModeratorImageReview'
import ModeratorAudit from './pages/moderator/ModeratorAudit'
import ModeratorSettings from './pages/moderator/ModeratorSettings'
import MemberManagement from './pages/moderator/MemberManagement'
import BatchManagement from './pages/moderator/BatchManagement'
import NotificationCenter from './pages/moderator/NotificationCenter'
import ReportsExports from './pages/moderator/ReportsExports'
import NotFound from './pages/NotFound'

import { ScrollToTop } from './components/layout/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Marketing & Auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* An information page about the role. Deliberately not under /moderator,
            which is the protected portal. */}
        <Route path="/roles/moderator" element={<ModeratorRole />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Admin & Moderator Login Paths */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/moderator/login" element={<ModeratorLogin />} />

        {/* User Dashboard Protected Pipeline */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="user">
              <AppShell role="user" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadCenter />} />
          <Route path="upload/single" element={<UploadSingle />} />
          <Route path="upload/multiple" element={<UploadMultiple />} />
          <Route path="upload/zip" element={<UploadZip />} />
          <Route path="processing/:id" element={<ProcessingPage />} />
          <Route path="images" element={<MyImages />} />
          <Route path="images/:id" element={<ImageDetail />} />
          <Route path="groups" element={<IdentityGroups />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="settings" element={<Settings />} />
          <Route path="live-enhancement" element={<LiveEnhancement />} />
          <Route path="jobs" element={<ProcessingJobs />} />
        </Route>

        {/* Admin Dashboard Protected Pipeline */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AppShell role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="security" element={<Security />} />
          <Route path="moderators" element={<Moderators />} />
          <Route path="api-docs" element={<Navigate to="/admin" replace />} />
          <Route path="api-test" element={<Navigate to="/admin" replace />} />
          <Route path="system" element={<SystemMonitoring />} />
          <Route path="upload-statistics" element={<UploadStatistics />} />
          <Route path="rejection-summary" element={<RejectionSummary />} />
          <Route path="images" element={<ImageMonitoring />} />
          <Route path="logs" element={<Navigate to="/admin/audit-logs" replace />} />
        </Route>

        {/* Moderator Dashboard Protected Pipeline */}
        <Route 
          path="/moderator" 
          element={
            <ModeratorAccessGate>
              <AppShell role="moderator" />
            </ModeratorAccessGate>
          }
        >
          <Route index element={<ModeratorDashboard />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="queue" element={<ReviewQueue />} />
          <Route path="images/:id" element={<ModeratorImageReview />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="reports" element={<ReportsExports />} />
          <Route path="audit" element={<ModeratorAudit />} />
          <Route path="settings" element={<ModeratorSettings />} />
        </Route>

        {/* Fallback 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
