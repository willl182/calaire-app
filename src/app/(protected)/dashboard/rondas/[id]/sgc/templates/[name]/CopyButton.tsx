'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-line-soft bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface active:bg-surface-muted"
      type="button"
    >
      {copied ? 'Copiado' : 'Copiar texto'}
    </button>
  )
}
