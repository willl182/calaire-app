import type { ReactNode } from 'react'

export default function SgcLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
        {children}
      </div>
    </div>
  )
}
