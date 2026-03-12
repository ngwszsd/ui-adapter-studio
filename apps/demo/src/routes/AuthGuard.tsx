import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { LS_KEYS, REDIRECT_WHITE_LIST_KEYS } from '@/constants';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const token = localStorage.getItem(LS_KEYS.TOKEN);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  if (!token) {
    const params = new URLSearchParams();
    REDIRECT_WHITE_LIST_KEYS.forEach((key) => {
      if (searchParams.has(key)) {
        params.set(key, searchParams.get(key) as string);
      }
    });
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  return <>{children}</>;
};
