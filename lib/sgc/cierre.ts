// Logica pura del cierre documental SGC (sin dependencias de Convex) para poder
// testearla directamente. `convex/sgc/shared.ts` re-exporta estos helpers y los
// combina con la lectura de `ctx.db` en `collectDriveCierreCalidad`.

export function normalizeCodigoDocumento(codigo: string) {
  return codigo.trim().toUpperCase()
}

export type DriveCierreRecursoInput = {
  codigo: string
  estado: string
  webUrl?: string | null
  notas?: string | null
  definitivo?: { webUrl?: string | null; storageId?: string | null } | null
  critico?: boolean | null
}

export type DriveCierreEtapaInput = {
  documentos: readonly { codigo: string; nombre: string }[]
}

export type DriveCierreCalidad = {
  totalDocumentos: number
  recursosDocumentales: number
  bloqueantes: string[]
  advertencias: string[]
}

/**
 * Evalua el expediente Drive contra el catalogo de etapas y devuelve bloqueantes
 * y advertencias de cierre. Sin expediente inicializado emite un unico bloqueante
 * accionable en vez de uno por documento del catalogo (fix Fase 7 F1).
 */
export function evaluateDriveCierreCalidad(
  documentos: readonly DriveCierreRecursoInput[],
  etapas: readonly DriveCierreEtapaInput[]
): DriveCierreCalidad {
  const totalDocumentos = etapas.reduce((total, etapa) => total + etapa.documentos.length, 0)
  if (documentos.length === 0) {
    return {
      totalDocumentos,
      recursosDocumentales: 0,
      bloqueantes: ['Expediente Drive no inicializado: inicialice o repare el expediente documental antes de cerrar.'],
      advertencias: [],
    }
  }

  const byCodigo = new Map(documentos.map((recurso) => [normalizeCodigoDocumento(recurso.codigo), recurso]))
  const bloqueantes: string[] = []
  const advertencias: string[] = []

  for (const etapa of etapas) {
    for (const documento of etapa.documentos) {
      const codigo = normalizeCodigoDocumento(documento.codigo)
      const recurso = byCodigo.get(codigo)
      const label = `${codigo} ${documento.nombre}`
      if (!recurso) {
        bloqueantes.push(`${label}: recurso Drive faltante`)
        continue
      }

      const tieneEditable = Boolean(recurso.webUrl?.trim())
      const tieneJustificacion = Boolean(recurso.notas?.trim())
      const tieneDefinitivo = Boolean(recurso.definitivo?.webUrl?.trim() || recurso.definitivo?.storageId)
      const esCritico = recurso.critico === true

      if (recurso.estado === 'retirado') {
        bloqueantes.push(`${label}: recurso retirado`)
        continue
      }

      if (recurso.estado === 'no_aplica') {
        if (!tieneJustificacion) bloqueantes.push(`${label}: no aplica sin justificacion`)
        continue
      }

      if (recurso.estado === 'reemplazado') {
        if (!tieneEditable || !tieneJustificacion) {
          bloqueantes.push(`${label}: reemplazado sin enlace vigente o motivo`)
        }
        continue
      }

      if (!tieneEditable) {
        bloqueantes.push(`${label}: falta enlace editable`)
        continue
      }

      if (esCritico && recurso.estado !== 'diligenciado') {
        bloqueantes.push(`${label}: formato critico no diligenciado`)
        continue
      }

      if ((recurso.estado === 'diligenciado' || recurso.estado === 'creado') && !tieneDefinitivo) {
        advertencias.push(`${label}: definitivo recomendado ausente`)
      }
    }
  }

  return {
    totalDocumentos,
    recursosDocumentales: documentos.length,
    bloqueantes,
    advertencias,
  }
}
