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
import VerifyEmailChange from './pages/VerifyEmailChange'
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
import Albums from './pages/user/Albums'
import AlbumDetail from './pages/user/AlbumDetail'
import Trash from './pages/user/Trash'
import Duplicates from './pages/user/Duplicates'
import Moments, { EventDetail, MemoryDetail } from './pages/user/Moments'
import Search from './pages/user/Search'
import FolderHistory from './pages/user/FolderHistory'
import ComparePage from './pages/user/ComparePage'
import MyImages from './pages/user/MyImages'
import ImageDetail from './pages/user/ImageDetail'
import PhotoEditor from './pages/user/PhotoEditor'
import PersonReview from './pages/user/PersonReview'
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
import OrganizationHome from './pages/user/OrganizationHome'
import LeaveRequests from './pages/moderator/LeaveRequests'
import Organizations from './pages/admin/Organizations'
import InvitationAccept from './pages/InvitationAccept'
import AcceptInvitation from './pages/AcceptInvitation'
import IdentityReview from './pages/moderator/IdentityReview'
import ModerationLogs from './pages/moderator/ModerationLogs'
import RejectedImages from './pages/moderator/RejectedImages'
import Statistics from './pages/admin/Statistics'
import UsersPage from './pages/admin/Users'
import AuditLogs from './pages/admin/AuditLogs'
import Security from './pages/admin/Security'
import Moderators from './pages/admin/Moderators'
import ModerationOverview from './pages/admin/ModerationOverview'
import Invitations from './pages/admin/Invitations'
import SystemMonitoring from './pages/admin/SystemMonitoring'
import UploadStatistics from './pages/admin/UploadStatistics'
import RejectionSummary from './pages/admin/RejectionSummary'
import ImageMonitoring from './pages/admin/ImageMonitoring'
import PrivacyAudit from './pages/admin/PrivacyAudit'
import ContactInbox from './pages/admin/ContactInbox'

// Moderator pages
import ModeratorDashboard from './pages/moderator/ModeratorDashboard'
import ReviewQueue from './pages/moderator/ReviewQueue'
import ModeratorImageReview from './pages/moderator/ModeratorImageReview'
import ModeratorAudit from './pages/moderator/ModeratorAudit'
import ModeratorSettings from './pages/moderator/ModeratorSettings'
import AdminSettings from './pages/admin/AdminSettings'
import MemberManagement from './pages/moderator/MemberManagement'
import BatchManagement from './pages/moderator/BatchManagement'
import NotificationCenter from './pages/moderator/NotificationCenter'
import DownloadRequestQueue from './pages/moderator/DownloadRequestQueue'
import DownloadRequestReview from './pages/moderator/DownloadRequestReview'
import DownloadRequests from './pages/user/DownloadRequests'
import DownloadRequestDetail from './pages/user/DownloadRequestDetail'
import ReportsExports from './pages/moderator/ReportsExports'
import NotFound from './pages/NotFound'

import { ScrollToTop } from './components/layout/ScrollToTop'
import { RouteSeo } from './components/seo/RouteSeo'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteSeo />
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
        {/* The link emailed to a new address after the email was changed; opening it confirms the address. */}
        <Route path="/verify-email-change/:uid/:token" element={<VerifyEmailChange />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Admin & Moderator Login Paths */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/moderator/login" element={<ModeratorLogin />} />
        <Route path="/invitations/:token" element={<InvitationAccept />} />
        {/* The administrator's account invitation (create the account, choose a password), emailed as /accept-invitation?token=…
            Not the team invitation above. Public, and it never signs anyone in: each account type signs in on its own page. */}
        <Route path="/accept-invitation" element={<AcceptInvitation />} />

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
          <Route path="images/:id/edit" element={<PhotoEditor />} />
          <Route path="images/:id/compare" element={<ComparePage />} />
          <Route path="albums" element={<Albums />} />
          <Route path="albums/:id" element={<AlbumDetail />} />
          <Route path="trash" element={<Trash />} />
          <Route path="duplicates" element={<Duplicates />} />
          <Route path="places" element={<Navigate to="/dashboard/images" replace />} />
          <Route path="moments" element={<Moments />} />
          <Route path="moments/memories/:id" element={<MemoryDetail />} />
          <Route path="moments/events/:id" element={<EventDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="groups" element={<IdentityGroups />} />
          <Route path="groups/review" element={<PersonReview />} />
          <Route path="groups/history" element={<FolderHistory />} />
          <Route path="groups/:id" element={<GroupDetail />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="download-requests" element={<DownloadRequests />} />
          <Route path="download-requests/:id" element={<DownloadRequestDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="organization" element={<OrganizationHome />} />
          <Route path="settings" element={<Settings />} />
          {/* The separate uploader page was folded into the Upload screens (preset and lighting are chosen there); keep old bookmarks working. */}
          <Route path="enhance" element={<Navigate to="/dashboard/upload" replace />} />
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
          <Route path="statistics" element={<Statistics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="inbox" element={<ContactInbox />} />
          <Route path="security" element={<Security />} />
          <Route path="privacy" element={<PrivacyAudit />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="moderators" element={<Moderators />} />
          <Route path="moderation" element={<ModerationOverview />} />
          <Route path="invitations" element={<Invitations />} />
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
          <Route path="logs" element={<ModerationLogs />} />
          <Route path="identity" element={<IdentityReview />} />
          <Route path="rejected" element={<RejectedImages />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="download-requests" element={<DownloadRequestQueue />} />
          <Route path="leave-requests" element={<LeaveRequests />} />
          {/* Links from notifications carry ?organization=<id>; the page switches the panel to it. */}
          <Route path="download-requests/:id" element={<DownloadRequestReview />} />
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
