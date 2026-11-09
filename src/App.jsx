import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Auth.jsx';
import { ToastProvider } from './context/Toast.jsx';
import { SlowBanner, Splash } from './components/ui.jsx';
import { RequireRole, RedirectIfLoggedIn } from './components/Guards.jsx';
import RouteAnalytics from './components/RouteAnalytics.jsx';
import AnalyticsErrorBoundary from './components/AnalyticsErrorBoundary.jsx';

import Register from './pages/Register.jsx';
import Registered from './pages/Registered.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import NotFound from './pages/NotFound.jsx';

import MemberLayout from './components/MemberLayout.jsx';
import MemberDashboard from './pages/member/Dashboard.jsx';
import MemberProfile from './pages/member/Profile.jsx';
import MemberOpportunities from './pages/member/Opportunities.jsx';
import BrandGigInterests from './pages/member/BrandGigInterests.jsx';
import MemberAbout from './pages/member/About.jsx';
import MemberScore from './pages/member/Score.jsx';
import MemberNotifications from './pages/member/Notifications.jsx';
import MemberResources from './pages/member/Resources.jsx';
import MemberTraining from './pages/member/training/Training.jsx';
import TrainingClassList from './pages/member/training/Classes.jsx';
import TrainingClassDetail from './pages/member/training/ClassDetail.jsx';
import TrainingUpdates from './pages/member/training/Updates.jsx';
import CreatorDirectory from './pages/member/CreatorDirectory.jsx';
import CreatorDirectoryProfile from './pages/member/CreatorDirectoryProfile.jsx';
import Collaborations from './pages/member/Collaborations.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import AdminOverview from './pages/admin/Overview.jsx';
import AdminRegistrations from './pages/admin/Registrations.jsx';
import AdminResources from './pages/admin/Resources.jsx';
import AdminOptions from './pages/admin/Options.jsx';
import AdminOpportunities from './pages/admin/Opportunities.jsx';
import AdminOpportunityInterests from './pages/admin/OpportunityInterests.jsx';
import AdminAdmins from './pages/admin/Admins.jsx';
import AdminAccessCodes from './pages/admin/AccessCodes.jsx';
import AdminTraining from './pages/admin/Training.jsx';
import AdminCollaborations from './pages/admin/Collaborations.jsx';
import AdminCreatorEmail from './pages/admin/CreatorEmail.jsx';
import AdminAnalytics from './pages/admin/Analytics.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'));

export default function App() {
  return (
    <BrowserRouter>
      <RouteAnalytics />
      <ToastProvider>
        <AuthProvider>
          <SlowBanner />
          <AnalyticsErrorBoundary>
          <Routes>
            <Route path="/" element={<Suspense fallback={<Splash />}><Landing /></Suspense>} />
            <Route path="/privacy-policy" element={<Suspense fallback={<Splash />}><PrivacyPolicy /></Suspense>} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route element={<RedirectIfLoggedIn />}>
              <Route path="/register/brand" element={<Register kind="brand" />} />
              <Route path="/register/creator" element={<Register kind="creator" />} />
              <Route path="/registered" element={<Registered />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route element={<RequireRole roles={['brand', 'creator']} />}>
              <Route path="/app" element={<MemberLayout />}>
                <Route index element={<MemberDashboard />} />
                <Route path="profile" element={<MemberProfile />} />
                <Route path="resources" element={<MemberResources />} />
                <Route path="resources/orders/:orderNumber" element={<MemberResources />} />
                <Route path="creators" element={<CreatorDirectory />} />
                <Route path="creators/:id" element={<CreatorDirectoryProfile />} />
                <Route element={<RequireRole roles={['creator']} />}>
                  <Route path="collaborations" element={<Collaborations />} />
                </Route>
                <Route path="opportunities" element={<MemberOpportunities />} />
                <Route path="opportunities/:id/interests" element={<BrandGigInterests />} />
                <Route path="about" element={<MemberAbout />} />
                <Route path="score" element={<MemberScore />} />
                <Route path="notifications" element={<MemberNotifications />} />
                <Route element={<RequireRole roles={['creator']} />}>
                  <Route path="training" element={<MemberTraining />} />
                  <Route path="training/classes" element={<TrainingClassList />} />
                  <Route path="training/classes/:id" element={<TrainingClassDetail />} />
                  <Route path="training/updates" element={<TrainingUpdates />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="access-codes" element={<AdminAccessCodes />} />
                <Route path="resources" element={<AdminResources />} />
                <Route path="options" element={<AdminOptions />} />
                <Route path="opportunities" element={<AdminOpportunities />} />
                <Route path="opportunities/:id/interests" element={<AdminOpportunityInterests />} />
                <Route path="admins" element={<AdminAdmins />} />
                <Route path="training" element={<AdminTraining />} />
                <Route path="collaborations" element={<AdminCollaborations />} />
                <Route path="creator-email" element={<AdminCreatorEmail />} />
                <Route path="notifications" element={<MemberNotifications />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </AnalyticsErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
