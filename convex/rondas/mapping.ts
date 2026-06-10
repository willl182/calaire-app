import type { Doc } from '../_generated/dataModel'

export function mapDirectorioParticipante(row: Doc<'directorioParticipantes'>) {
  return {
    id: row._id,
    nit: row.nit,
    correo: row.correo,
    nombre_laboratorio: row.nombreLaboratorio ?? null,
    nombre_responsable: row.nombreResponsable ?? null,
    cargo: row.cargo ?? null,
    ciudad: row.ciudad ?? null,
    departamento: row.departamento ?? null,
    telefono: row.telefono ?? null,
    workos_user_id: row.workosUserId ?? null,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  }
}
