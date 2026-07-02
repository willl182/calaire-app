import { redirect } from 'next/navigation'

export default function LegacySgcExpedientesPage() {
  redirect('/dashboard?tab=rondas')
}
