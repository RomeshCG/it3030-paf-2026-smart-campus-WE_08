import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function TicketsIndexPage() {
  const { user } = useAuth();
  const r = user?.role;
  if (r === 'USER') {
    return <Navigate to="/tickets/my" replace />;
  }
  return <Navigate to="/tickets/manage" replace />;
}
