import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { TransPage } from './features/transactions/TransPage';
import { StatsPage } from './features/stats/StatsPage';
import { AccountsPage } from './features/accounts/AccountsPage';
import { MorePage } from './features/settings/MorePage';

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Protected Core Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/trans" replace />,
      },
      {
        path: 'trans/*',
        element: <TransPage />,
      },
      {
        path: 'stats/*',
        element: <StatsPage />,
      },
      {
        path: 'accounts/*',
        element: <AccountsPage />,
      },
      {
        path: 'more/*',
        element: <MorePage />,
      },
    ],
  },

  // Catch-all Redirect
  {
    path: '*',
    element: <Navigate to="/trans" replace />,
  },
]);
