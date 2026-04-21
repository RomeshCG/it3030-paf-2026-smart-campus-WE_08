import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ResourceList } from './components/ResourceList';
import { ResourceDetails } from './components/ResourceDetails';
import { Navbar } from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TicketsLayout from './layouts/TicketsLayout';
import TicketsIndexPage from './pages/tickets/TicketsIndexPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import TicketManagementPage from './pages/tickets/TicketManagementPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminAnalyticsDashboard } from './pages/AdminAnalyticsDashboard';
import { AdminBookingPage } from './pages/AdminBookingPage';
import { ADMIN_ROLES, AUTHENTICATED_ROLES } from './constants/roles';
import './App.css';
import './index.css';

function AppLayout({ children }) {
  return (
    <div className="App legacy-module">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'white',
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding/invite/:token" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <TicketsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TicketsIndexPage />} />
          <Route
            path="my"
            element={
              <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manage"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN', 'SUPER_ADMIN']}>
                <TicketManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="new" element={<CreateTicketPage />} />
          <Route path=":id" element={<TicketDetailPage />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="/"
          element={(
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <AppLayout><ResourceList /></AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/resources/:id"
          element={(
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <AppLayout><ResourceDetails /></AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/resources"
          element={(
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <AppLayout><ResourceList /></AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/bookings/my"
          element={(
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MyBookingsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/analytics"
          element={(
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AppLayout><AdminAnalyticsDashboard /></AppLayout>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/bookings"
          element={(
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminBookingPage />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
