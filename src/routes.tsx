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
import { ConfigurationHubPage } from './features/settings/ConfigurationHubPage';
import { GeneralSettingsPage } from './features/settings/GeneralSettingsPage';
import { InputSettingsPage } from './features/settings/InputSettingsPage';
import { SubCurrencySettingsPage } from './features/settings/SubCurrencySettingsPage';
import { CategoryManagerPage } from './features/categories/CategoryManagerPage';
import { SubcategoryManagerPage } from './features/categories/SubcategoryManagerPage';
import { PasscodeSettingsPage } from './features/settings/PasscodeSettingsPage';
import { CalcBoxPage } from './features/settings/CalcBoxPage';
import { BackupSettingsPage } from './features/settings/BackupSettingsPage';
import { HelpPage } from './features/settings/HelpPage';
import { FeedbackPage } from './features/settings/FeedbackPage';
import { RecommendPage } from './features/settings/RecommendPage';
import { PCManagerPage } from './features/settings/PCManagerPage';

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

      // Module 4: Settings & More Subsystem Routes
      {
        path: 'more',
        children: [
          {
            index: true,
            element: <MorePage />,
          },
          {
            path: 'configuration',
            element: <ConfigurationHubPage />,
          },
          {
            path: 'configuration/general',
            element: <GeneralSettingsPage />,
          },
          {
            path: 'configuration/input',
            element: <InputSettingsPage />,
          },
          {
            path: 'configuration/sub-currency',
            element: <SubCurrencySettingsPage />,
          },
          {
            path: 'categories',
            element: <CategoryManagerPage />,
          },
          {
            path: 'categories/:categoryId/subcategories',
            element: <SubcategoryManagerPage />,
          },
          {
            path: 'passcode',
            element: <PasscodeSettingsPage />,
          },
          {
            path: 'calcbox',
            element: <CalcBoxPage />,
          },
          {
            path: 'backup',
            element: <BackupSettingsPage />,
          },
          {
            path: 'help',
            element: <HelpPage />,
          },
          {
            path: 'feedback',
            element: <FeedbackPage />,
          },
          {
            path: 'recommend',
            element: <RecommendPage />,
          },
          {
            path: 'pc-manager',
            element: <PCManagerPage />,
          },
        ],
      },
    ],
  },

  // Catch-all Redirect
  {
    path: '*',
    element: <Navigate to="/trans" replace />,
  },
]);
