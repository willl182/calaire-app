import { redirect } from 'next/navigation'

export default function RegistrosPage() {
  redirect('/dashboard?tab=registros')
}
