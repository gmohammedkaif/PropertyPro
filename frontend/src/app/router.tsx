import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AuthGuard } from '@/components/shared/AuthGuard'
import { PublicOnlyGuard } from '@/components/shared/PublicOnlyGuard'
import { AdminGuard, TenantGuard, SuperAdminGuard } from '@/components/shared/RoleGuard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BrowsePage } from '@/pages/BrowsePage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { isAdmin, useAuthStore } from '@/stores/authStore'

// ── Lazy-loaded Page Chunks for Performance & Bundle Code Splitting ─────────
const lazyLoad = (Component: React.ComponentType<any>) => (props: any) => (
  <Suspense
    fallback={
      <div className="flex h-64 w-full items-center justify-center p-8 text-center text-sm font-semibold text-muted">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading module...</span>
        </div>
      </div>
    }
  >
    <Component {...props} />
  </Suspense>
)

const DashboardPage = lazyLoad(lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))))
const TenantDashboardPage = lazyLoad(lazy(() => import('@/pages/TenantDashboardPage').then((m) => ({ default: m.TenantDashboardPage }))))
const PropertyListPage = lazyLoad(lazy(() => import('@/pages/PropertyListPage').then((m) => ({ default: m.PropertyListPage }))))
const PropertyDetailPage = lazyLoad(lazy(() => import('@/pages/PropertyDetailPage').then((m) => ({ default: m.PropertyDetailPage }))))
const TenanciesPage = lazyLoad(lazy(() => import('@/pages/TenanciesPage').then((m) => ({ default: m.TenanciesPage }))))
const PaymentsPage = lazyLoad(lazy(() => import('@/pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))))
const MaintenancePage = lazyLoad(lazy(() => import('@/pages/MaintenancePage').then((m) => ({ default: m.MaintenancePage }))))
const AnalyticsPage = lazyLoad(lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))))
const SettingsPage = lazyLoad(lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))))
const OwnerRequestsPage = lazyLoad(lazy(() => import('@/pages/OwnerRequestsPage').then((m) => ({ default: m.OwnerRequestsPage }))))
const OwnersPage = lazyLoad(lazy(() => import('@/pages/OwnersPage').then((m) => ({ default: m.OwnersPage }))))
const TenantsPage = lazyLoad(lazy(() => import('@/pages/TenantsPage').then((m) => ({ default: m.TenantsPage }))))
const AuditLogsPage = lazyLoad(lazy(() => import('@/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage }))))
const TenantRequestsPage = lazyLoad(lazy(() => import('@/pages/TenantRequestsPage').then((m) => ({ default: m.TenantRequestsPage }))))
const TenantRentPage = lazyLoad(lazy(() => import('@/pages/TenantRentPage').then((m) => ({ default: m.TenantRentPage }))))
const TenantReportIssuePage = lazyLoad(lazy(() => import('@/pages/TenantReportIssuePage').then((m) => ({ default: m.TenantReportIssuePage }))))
const TenantLeasePage = lazyLoad(lazy(() => import('@/pages/TenantLeasePage').then((m) => ({ default: m.TenantLeasePage }))))
const PlaceholderPage = lazyLoad(lazy(() => import('@/pages/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage }))))

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
  { path: '/browse/:id', element: <PropertyDetailPage /> },

  // Role shortcut path redirects -> send to authenticated dashboard app
  { path: '/tenant', element: <Navigate to="/app" replace /> },
  { path: '/owner', element: <Navigate to="/app" replace /> },
  { path: '/admin', element: <Navigate to="/app" replace /> },

  {
    path: '/app',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      // Smart dashboard — renders admin or tenant view automatically based on credentials
      { index: true, element: <SmartDashboard /> },

      // Shared — both roles can access
      { path: 'properties', element: <PropertyListPage /> },
      { path: 'properties/:id', element: <PropertyDetailPage /> },
      { path: 'property/:id', element: <PropertyDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },

      // ── Super Admin Only routes ───────────────────────────────────────────
      {
        path: 'owner-requests',
        element: (
          <SuperAdminGuard>
            <OwnerRequestsPage />
          </SuperAdminGuard>
        ),
      },
      {
        path: 'owners',
        element: (
          <SuperAdminGuard>
            <OwnersPage />
          </SuperAdminGuard>
        ),
      },
      {
        path: 'tenants',
        element: (
          <SuperAdminGuard>
            <TenantsPage />
          </SuperAdminGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <SuperAdminGuard>
            <AuditLogsPage />
          </SuperAdminGuard>
        ),
      },

      // ── Admin/Owner routes ─────────────────────────────────────────────────
      {
        path: 'tenant-requests',
        element: (
          <AdminGuard>
            <TenantRequestsPage />
          </AdminGuard>
        ),
      },
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
            <TenantLeasePage />
          </TenantGuard>
        ),
      },

      { path: ':feature', element: <PlaceholderPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
