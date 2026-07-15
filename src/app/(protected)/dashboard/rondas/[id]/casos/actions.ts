'use server'
import { revalidatePath } from 'next/cache'
import { linkPtVerification, reviewPtCase } from '@/server/rondas'

export async function reviewCaseAction(rondaId: string, casoId: string, data: FormData) {
  const decision = String(data.get('decision'))
  if (decision !== 'aceptar' && decision !== 'ajustes') throw new Error('Decisión inválida.')
  await reviewPtCase(casoId, decision, String(data.get('observacion') ?? ''))
  revalidatePath(`/dashboard/rondas/${rondaId}/casos`)
}

export async function linkVerificationAction(rondaId: string, casoId: string, originId: string, data: FormData) {
  await linkPtVerification({ casoId, originId, posteriorId: String(data.get('posterior_id') ?? ''), motivo: String(data.get('motivo') ?? '') })
  revalidatePath(`/dashboard/rondas/${rondaId}/casos/${casoId}`)
}
