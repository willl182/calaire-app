import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Expedientes SGC' }

export default function LegacySgcExpedientesPage() {
  redirect('/dashboard/rondas')
}
