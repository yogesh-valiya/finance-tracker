import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { useLockStore } from '../lock/lockStore';
import { LockScreen } from '../lock/LockScreen';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, preferences } = useAuthStore();
  const { isLocked, setLocked } = useLockStore();

  useEffect(() => {
    // Check if passcode lock should be active
    if (preferences?.is_passcode_enabled && preferences.passcode) {
      // In Capacitor or web tab visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setLocked(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [preferences, setLocked]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 gap-4 bg-background">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <div className="flex flex-col gap-2 mt-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (preferences?.is_passcode_enabled && isLocked) {
    return <LockScreen />;
  }

  return children ? <>{children}</> : null;
};
