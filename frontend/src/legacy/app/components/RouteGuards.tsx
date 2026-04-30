import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import {
  canAccessRole,
  getPostAuthRoute,
  getStoredAuthUser,
  isAuthenticated,
  type Profession,
} from '../services/auth';

interface GuardProps {
  children: ReactNode;
}

interface RoleGuardProps extends GuardProps {
  allowedRoles: Profession[];
}

export function RequireAuth({ children }: GuardProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

export function RequireRole({ children, allowedRoles }: RoleGuardProps) {
  const user = getStoredAuthUser();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const hasAllowedRole = allowedRoles.some((role) => canAccessRole(user, role));

  if (!hasAllowedRole) {
    return <Navigate to={getPostAuthRoute(user.profession)} replace />;
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: GuardProps) {
  const user = getStoredAuthUser();

  if (user) {
    return <Navigate to={getPostAuthRoute(user.profession)} replace />;
  }

  return <>{children}</>;
}
