import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TicketsLayout from './layouts/TicketsLayout';
import TicketsIndexPage from './pages/tickets/TicketsIndexPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import TicketManagementPage from './pages/tickets/TicketManagementPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'TECHNICIAN', 'SUPER_ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tickets"
          element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'TECHNICIAN', 'SUPER_ADMIN']}>
              <TicketsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TicketsIndexPage />} />
          <Route
            path="my"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
