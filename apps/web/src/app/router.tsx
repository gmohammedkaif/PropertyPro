import { createBrowserRouter } from 'react-router-dom'

import { AuthGuard } from '@/components/shared/AuthGuard'
import { PublicOnlyGuard } from '@/components/shared/PublicOnlyGuard'
import { AdminGuard, TenantGuard } from '@/components/shared/RoleGuard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BrowsePage } from '@/pages/BrowsePage'
import { PropertyListPage } from '@/pages/PropertyListPage'
import { PropertyDetailPage } from '@/pages/PropertyDetailPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TenantDashboardPage } from '@/pages/TenantDashboardPage'
import { TenantRentPage } from '@/pages/TenantRentPage'
import { TenantReportIssuePage } from '@/pages/TenantReportIssuePage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { TenanciesPage } from '@/pages/TenanciesPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { MaintenancePage } from '@/pages/MaintenancePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { isAdmin } from '@/stores/authStore'
import { useAuthStore } from '@/stores/authStore'

// Smart dashboard: renders admin or tenant dashboard based on role
function SmartDashboard() {
  const user = useAuthStore((state) => state.user)
  return isAdmin(user) ? <DashboardPage /> : <TenantDashboardPage />
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/login',
    element: (
      <PublicOnlyGuard>
        <LoginPage />
      </PublicOnlyGuard>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyGuard>
        <RegisterPage />
      </PublicOnlyGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyGuard>
        <ForgotPasswordPage />
      </PublicOnlyGuard>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicOnlyGuard>
        <ResetPasswordPage />
      </PublicOnlyGuard>
    ),
  },
  { path: '/browse', element: <BrowsePage /> },
  {
    path: '/app',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      // Smart dashboard — renders admin or tenant view automatically
      { index: true, element: <SmartDashboard /> },

      // Shared — both roles can access
      { path: 'properties', element: <PropertyListPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },

      // ── Admin-only routes ─────────────────────────────────────────────────
      {
        path: 'tenancies',
        element: (
          <AdminGuard>
            <TenanciesPage />
          </AdminGuard>
        ),
      },
      {
        path: 'payments',
        element: (
          <AdminGuard>
            <PaymentsPage />
          </AdminGuard>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <AdminGuard>
            <MaintenancePage />
          </AdminGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <AdminGuard>
            <AnalyticsPage />
          </AdminGuard>
        ),
      },

      // ── Tenant-only routes ────────────────────────────────────────────────
      {
        path: 'my-rent',
        element: (
          <TenantGuard>
            <TenantRentPage />
          </TenantGuard>
        ),
      },
      {
        path: 'report-issue',
        element: (
          <TenantGuard>
            <TenantReportIssuePage />
          </TenantGuard>
        ),
      },
      {
        path: 'my-lease',
        element: (
          <TenantGuard>
            <PlaceholderPage />
          </TenantGuard>
        ),
      },

      { path: ':feature', element: <PlaceholderPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
