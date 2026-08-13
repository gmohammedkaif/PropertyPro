import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Drawer } from '@/components/ui/Drawer'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar'
import { useUiStore } from '@/stores/uiStore'
import { useLocalPropertiesStore } from '@/stores/localPropertiesStore'
import { useListingsStore } from '@/stores/listingsStore'
import { useRentalRequestsStore } from '@/stores/rentalRequestsStore'
import { useTenanciesStore } from '@/stores/tenanciesStore'
import { usePaymentsStore } from '@/stores/paymentsStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'

export function DashboardLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen)

  const fetchProperties = useLocalPropertiesStore((state) => state.fetch)
  const fetchListings = useListingsStore((state) => state.fetch)
  const fetchRequests = useRentalRequestsStore((state) => state.fetch)
  const fetchTenancies = useTenanciesStore((state) => state.fetch)
  const fetchPayments = usePaymentsStore((state) => state.fetch)
  const fetchMaintenance = useMaintenanceStore((state) => state.fetch)

  useEffect(() => {
    fetchProperties()
    fetchListings()
    fetchRequests()
    fetchTenancies()
    fetchPayments()
    fetchMaintenance()
  }, [fetchProperties, fetchListings, fetchRequests, fetchTenancies, fetchPayments, fetchMaintenance])

  return (
    <div className="min-h-screen bg-bg">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
      />

      <Sidebar collapsed={collapsed} />

      <Drawer
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        side="left"
        className="max-w-[280px] p-0"
      >
        <SidebarContent collapsed={false} onNavigate={() => setMobileSidebarOpen(false)} />
      </Drawer>

      <div
        className={cn(
          'relative transition-[padding] duration-300 ease-[var(--ease-out)]',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} onCollapseToggle={toggleSidebar} />

        <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
