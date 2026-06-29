import type { ReactNode } from 'react'

import { canViewSgcMaestro, isAdmin, requireAuth } from '@/lib/auth'

import { Sidebar } from './SidebarNav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const auth = await requireAuth()
  const admin = isAdmin(auth)

  if (!admin) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-[100%] bg-[var(--background)]">
      <Sidebar canViewSgcMaestro={canViewSgcMaestro(auth)} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
