import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Auth.jsx';
import { ToastProvider } from './context/Toast.jsx';
import { SlowBanner } from './components/ui.jsx';
import { RequireRole, RedirectIfLoggedIn } from './components/Guards.jsx';

import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Registered from './pages/Registered.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ResendVerification from './pages/ResendVerification.jsx';
import NotFound from './pages/NotFound.jsx';

import MemberLayout from './components/MemberLayout.jsx';
import MemberProfile from './pages/member/Profile.jsx';
import MemberOpportunities from './pages/member/Opportunities.jsx';
import MemberAbout from './pages/member/About.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import AdminRegistrations from './pages/admin/Registrations.jsx';
import AdminOptions from './pages/admin/Options.jsx';
import AdminOpportunities from './pages/admin/Opportunities.jsx';
import AdminAdmins from './pages/admin/Admins.jsx';
import AdminAccessCodes from './pages/admin/AccessCodes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SlowBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
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
                <Route index element={<MemberProfile />} />
                <Route path="opportunities" element={<MemberOpportunities />} />
                <Route path="about" element={<MemberAbout />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminRegistrations />} />
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="access-codes" element={<AdminAccessCodes />} />
                <Route path="options" element={<AdminOptions />} />
                <Route path="opportunities" element={<AdminOpportunities />} />
                <Route path="admins" element={<AdminAdmins />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
