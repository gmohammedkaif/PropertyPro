import { Outlet } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { Drawer } from '@/components/ui/Drawer'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar'
import { useUiStore } from '@/stores/uiStore'

export function DashboardLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen)

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
