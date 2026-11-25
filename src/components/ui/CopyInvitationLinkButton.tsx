'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function CopyInvitationLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--pt-primary)] hover:bg-[var(--pt-primary-subtle)]"
      title={url}
    >
      {copied ? <><Icon name="check" /> Copiado</> : 'Copiar enlace'}
    </button>
  )
}
