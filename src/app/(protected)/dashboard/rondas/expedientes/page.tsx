import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Expedientes de rondas' }

export default function LegacyRondaExpedientesPage() {
  redirect('/dashboard/rondas')
}
