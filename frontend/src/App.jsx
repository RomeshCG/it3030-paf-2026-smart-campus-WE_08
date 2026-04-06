import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ResourceList } from './components/ResourceList';
import { ResourceDetails } from './components/ResourceDetails';
import { Navbar } from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminAnalyticsDashboard } from './pages/AdminAnalyticsDashboard';
import { AdminBookingPage } from './pages/AdminBookingPage';
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
            <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'TECHNICIAN', 'SUPER_ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<AppLayout><ResourceList /></AppLayout>} />
        <Route path="/resources/:id" element={<AppLayout><ResourceDetails /></AppLayout>} />
        <Route path="/bookings/my" element={<AppLayout><MyBookingsPage /></AppLayout>} />
        <Route path="/admin/analytics" element={<AppLayout><AdminAnalyticsDashboard /></AppLayout>} />
        <Route path="/admin/bookings" element={<AppLayout><AdminBookingPage /></AppLayout>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
