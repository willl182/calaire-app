import { v } from 'convex/values'

export const contaminanteValidator = v.union(
  v.literal('CO'),
  v.literal('SO2'),
  v.literal('O3'),
  v.literal('NO'),
  v.literal('NO2')
)

export const rondaEstadoValidator = v.union(
  v.literal('borrador'),
  v.literal('activa'),
  v.literal('documentacion_pendiente'),
  v.literal('cerrada')
)

export const participantProfileValidator = v.union(v.literal('member'), v.literal('member_special'))
export const replicasValidator = v.union(v.literal(2), v.literal(3))
