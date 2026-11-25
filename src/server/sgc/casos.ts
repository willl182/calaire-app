// Resultados PT en la app y casos SGC (convex/sgc/casos).
import { fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getConvexToken } from '@/server/convex'

export async function upsertResultadoPtApp(args: {
  rondaId: string
  tipoResultado: 'homogeneidad' | 'estabilidad' | 'estadistico'
  evidenciaSerieId: string
  evidenciaVersionId: string | null
  estado: 'pendiente' | 'cargado' | 'en_revision' | 'aprobado' | 'rechazado'
  observaciones: string | null
  fechaCalculo: string | null
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.upsertResultadoPtApp, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    evidenciaSerieId: args.evidenciaSerieId as Id<'sgcEvidenciaSeries'>,
    evidenciaVersionId: args.evidenciaVersionId as Id<'sgcEvidenciaVersiones'> | null
  }, { token })
}

export async function crearCasoSgc(args: {
  rondaId: string
  rondaParticipanteId: string | null
  tipo: 'consulta' | 'desviacion' | 'queja' | 'apelacion' | 'nc_capa' | 'otro'
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  titulo: string
  descripcion: string
  responsable: string
  formatoRelacionado: string | null
  evidenciaSerieId: string | null
  fechaObjetivo: string | null
}) {
  const token = await getConvexToken('operar SGC')
  return fetchMutation(api.sgc.index.crearCasoSgc, {
    ...args,
    rondaId: args.rondaId as Id<'rondas'>,
    rondaParticipanteId: args.rondaParticipanteId as Id<'rondaParticipantes'> | null,
    evidenciaSerieId: args.evidenciaSerieId as Id<'sgcEvidenciaSeries'> | null
  }, { token })
}

export async function actualizarCasoSgc(args: {
  casoId: string
  estado: 'abierto' | 'en_revision' | 'esperando_participante' | 'resuelto' | 'cerrado'
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  responsable: string
  fechaObjetivo: string | null
  resolucion: string | null
}) {
  const token = await getConvexToken('operar SGC')
  await fetchMutation(api.sgc.index.actualizarCasoSgc, {
    ...args,
    casoId: args.casoId as Id<'sgcCasos'>
  }, { token })
}
