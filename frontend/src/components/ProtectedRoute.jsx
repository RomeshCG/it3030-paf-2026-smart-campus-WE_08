import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '@/lib/api';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, syncSessionUser } = useAuth();
  const [isChecking, setIsChecking] = useState(Boolean(token));
  const [sessionValid, setSessionValid] = useState(Boolean(token));

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setSessionValid(false);
      setIsChecking(false);
      return () => {};
    }

    setIsChecking(true);
    api.get('/api/auth/me')
      .then((res) => {
        if (cancelled) return;
        syncSessionUser(res.data);
        setSessionValid(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSessionValid(false);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, syncSessionUser]);

  if (!token || !sessionValid) {
    return <Navigate to="/login" replace />;
  }

  if (isChecking) {
    return null;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
