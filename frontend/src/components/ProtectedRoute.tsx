import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Protected Route Component
 *
 * Wraps routes that require authentication and/or specific user roles.
 * Automatically redirects unauthorized users to the landing page.
 *
 * Features:
 * - Authentication check
 * - Role-based access control
 * - Loading state during auth initialization
 * - Automatic redirect for unauthorized access
 *
 * @component
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <InstructorDashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Require PM role
 * <ProtectedRoute requiredRole="PM">
 *   <PMDashboard />
 * </ProtectedRoute>
 */

// Constants
/**
 * Auth initialization delay in milliseconds
 * Allows time for localStorage to be read
 */
const AUTH_INIT_DELAY = 100;

/**
 * Route to redirect unauthorized users
 */
const UNAUTHORIZED_REDIRECT = '/';

/**
 * ProtectedRoute component props
 */
interface ProtectedRouteProps {
  /** Child components to render if authorized */
  children: React.ReactNode;
  /** Optional role requirement (PM or INSTRUCTOR) */
  requiredRole?: UserRole;
}

/**
 * Protected Route Component
 *
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected content or redirect
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Waits for auth state to be loaded from localStorage
   * Prevents flash of unauthorized content
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, AUTH_INIT_DELAY);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Checks if user has the required role
   * @returns {boolean} True if no role required or user has required role
   */
  const hasRequiredRole = (): boolean => {
    if (!requiredRole) return true;
    return role === requiredRole;
  };

  // Show loading spinner during auth initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-muted-foreground" role="status">로딩 중...</span>
      </div>
    );
  }

  // Redirect unauthenticated users to landing page
  if (!isAuthenticated) {
    return <Navigate to={UNAUTHORIZED_REDIRECT} replace />;
  }

  // Redirect users without required role
  if (!hasRequiredRole()) {
    return <Navigate to={UNAUTHORIZED_REDIRECT} replace />;
  }

  return <>{children}</>;
}
