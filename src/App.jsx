import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import AdminLayout from './components/layout/AdminLayout';
import ReceptionLayout from './components/layout/ReceptionLayout';
import { InstructorLayout } from './pages/instructor/InstructorPages';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Super Admin
import SuperGymsPage from './pages/super/GymsPage';
import { SuperReportsPage, SuperThemesPage, SuperBackupPage, SuperSettingsPage } from './pages/super/SuperPages';

// Admin
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import { AdminSessionsPage, AdminSchedulesPage, AdminInstructorsPage, AdminReceptionistsPage, AdminActiveMembershipsPage, AdminBirthdaysPage } from './pages/admin/AdminSubPages';
import { AdminPaymentsPage, AdminReportsPage, AdminValidateEntryPage, AdminAttendancePage, AdminAuditPage, AdminAttendanceCorrectionPage } from './pages/admin/AdminReportPages';
import { AdminMembershipsPage, AdminSettingsPage } from './pages/admin/AdminSettingsPages';
import WodPage from './pages/admin/WodPage';


// Recepción
import { ReceptionDashboardPage, ReceptionClientsPage, ReceptionClientDetailPage, ReceptionMembershipsPage, ReceptionPaymentsPage, ReceptionScannerPage, ReceptionSchedulesPage, ReceptionAttendancePage, ReceptionBirthdaysPage } from './pages/reception/ReceptionPages';

// Instructor
import { InstructorTodayPage, InstructorAttendancePage, InstructorProfilePage, InstructorWodPage } from './pages/instructor/InstructorPages';
// Usuario
import { UserHomePage, UserSchedulePage, UserQRPage, UserProfilePage, UserEditProfilePage, UserBookingsPage, UserPaymentHistoryPage, UserNotificationsPage, UserWodPage, UserChangePasswordPage } from './pages/user/UserPages';
import { UserPayphonePage, UserPaymentResultPage, UserAutoChargePage } from './pages/user/PayphonePages';

const Placeholder = ({ label }) => <div className="flex items-center justify-center h-64 opacity-30 text-sm">{label}</div>;

function PrivateRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) {
  const urlParams = new URLSearchParams(window.location.search);
  const gymFromUrl = urlParams.get('gym') || localStorage.getItem('gymvip_slug');
  const redirectTo = gymFromUrl ? `/login?gym=${gymFromUrl}` : '/login';
  return <Navigate to={redirectTo} replace />;
}

  if (allowedRoles && !allowedRoles.includes(role) && !user.isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, role, isSuperAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* SUPER ADMIN */}
      <Route path="/super/*" element={<PrivateRoute allowedRoles={['super_admin']}><SuperAdminLayout><Routes>
        <Route path="gyms" element={<SuperGymsPage />} />
        <Route path="reports" element={<SuperReportsPage />} />
        <Route path="themes" element={<SuperThemesPage />} />
        <Route path="backup" element={<SuperBackupPage />} />
        <Route path="settings" element={<SuperSettingsPage />} />
        <Route path="*" element={<Navigate to="/super/gyms" replace />} />
      </Routes></SuperAdminLayout></PrivateRoute>} />

      {/* ADMIN */}
      <Route path="/dashboard/*" element={<PrivateRoute allowedRoles={['admin','super_admin']}><AdminLayout><Routes>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="memberships" element={<AdminMembershipsPage />} />
        <Route path="active-memberships" element={<AdminActiveMembershipsPage />} />
        <Route path="sessions" element={<AdminSessionsPage />} />
        <Route path="workouts" element={<WodPage />} />
        <Route path="schedules" element={<AdminSchedulesPage />} />
        <Route path="instructors" element={<AdminInstructorsPage />} />
        <Route path="receptionists" element={<AdminReceptionistsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="validate" element={<AdminValidateEntryPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="attendance-correction" element={<AdminAttendanceCorrectionPage />} />
        <Route path="birthdays" element={<AdminBirthdaysPage />} />
      </Routes></AdminLayout></PrivateRoute>} />

      {/* RECEPCIÓN */}
      <Route path="/recepcion/*" element={<PrivateRoute allowedRoles={['recepcionista','admin','super_admin']}><ReceptionLayout><Routes>
        <Route index element={<ReceptionDashboardPage />} />
        <Route path="clients" element={<ReceptionClientsPage />} />
        <Route path="clients/:clientId" element={<ReceptionClientDetailPage />} />
        <Route path="memberships" element={<ReceptionMembershipsPage />} />
        <Route path="payments" element={<ReceptionPaymentsPage />} />
        <Route path="scanner" element={<ReceptionScannerPage />} />
        <Route path="schedules" element={<ReceptionSchedulesPage />} />
        <Route path="attendance" element={<ReceptionAttendancePage />} />
        <Route path="birthdays" element={<ReceptionBirthdaysPage />} />
        <Route path="*" element={<Navigate to="/recepcion" replace />} />
      </Routes></ReceptionLayout></PrivateRoute>} />

      {/* INSTRUCTOR */}
      <Route path="/instructor/*" element={<PrivateRoute allowedRoles={['instructor','admin','super_admin']}><InstructorLayout><Routes>
        <Route index element={<InstructorTodayPage />} />
        <Route path="routines" element={<InstructorRoutinesPage />} />
        <Route path="wod" element={<InstructorWodPage />} />
        <Route path="attendance" element={<InstructorAttendancePage />} />
        <Route path="profile" element={<InstructorProfilePage />} />
        <Route path="*" element={<Navigate to="/instructor" replace />} />
      </Routes></InstructorLayout></PrivateRoute>} />

      {/* USUARIO */}
      <Route path="/usuario/*" element={<PrivateRoute allowedRoles={['user','admin','super_admin']}><Routes>
        <Route path="home" element={<UserHomePage />} />
        <Route path="schedule" element={<UserSchedulePage />} />
        <Route path="qr" element={<UserQRPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="edit-profile" element={<UserEditProfilePage />} />
        <Route path="change-password" element={<UserChangePasswordPage />} />
        <Route path="bookings" element={<UserBookingsPage />} />
        <Route path="payment-history" element={<UserPaymentHistoryPage />} />
        <Route path="notifications" element={<UserNotificationsPage />} />
        <Route path="wod" element={<UserWodPage />} />
        <Route path="payphone" element={<UserPayphonePage />} />
        <Route path="payment-result" element={<UserPaymentResultPage />} />
        <Route path="auto-charge" element={<UserAutoChargePage />} />
        <Route path="*" element={<Navigate to="/usuario/home" replace />} />
      </Routes></PrivateRoute>} />

      <Route path="/" element={
        user ? (isSuperAdmin ? <Navigate to="/super/gyms" replace />
          : role === 'admin' ? <Navigate to="/dashboard" replace />
          : role === 'recepcionista' ? <Navigate to="/recepcion" replace />
          : role === 'instructor' ? <Navigate to="/instructor" replace />
          : <Navigate to="/usuario/home" replace />)
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1c1917', color: '#fff', borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
