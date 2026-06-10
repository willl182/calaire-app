'use client'

import { useState, type ReactNode } from 'react'

type TabKey = 'cobertura' | 'documentos'

type Props = {
  cobertura: ReactNode
  documentos: ReactNode
}

const TABS: Array<{ key: TabKey; label: string }> = [
  {
    key: 'cobertura',
    label: 'Cobertura por Ronda',
  },
  {
    key: 'documentos',
    label: 'Documentos',
  },
]

export default function SgcTabs({ cobertura, documentos }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('cobertura')

  return (
    <div className="min-w-0 space-y-4">
      <nav
        role="tablist"
        aria-label="Secciones SGC"
        className="w-full min-w-0 overflow-hidden rounded-xl border border-[var(--border)] shadow-sm"
        style={{ background: 'linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)' }}
      >
        <div className="flex gap-0 overflow-x-auto px-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`sgc-tabpanel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-[var(--pt-primary)] font-semibold text-[var(--foreground)]'
                    : 'border-transparent text-[var(--foreground-muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div role="tabpanel" id={`sgc-tabpanel-${activeTab}`} className="min-w-0 space-y-4">
        {activeTab === 'cobertura' ? cobertura : documentos}
      </div>
    </div>
  )
}
