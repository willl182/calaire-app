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
  bloqueaCierre?: boolean | null
  modo?: string | null
  nativoCompleto?: boolean | null
}

export type DriveCierreEtapaInput = {
  documentos: readonly {
    codigo: string
    nombre: string
    critico?: boolean | null
    bloqueaCierre?: boolean | null
  }[]
}

export type DriveCierreCalidad = {
  totalDocumentos: number
  recursosDocumentales: number
  bloqueantes: string[]
  pendientesCriticos: string[]
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
      pendientesCriticos: [],
      advertencias: [],
    }
  }

  const byCodigo = new Map(documentos.map((recurso) => [normalizeCodigoDocumento(recurso.codigo), recurso]))
  const bloqueantes: string[] = []
  const pendientesCriticos: string[] = []
  const advertencias: string[] = []

  const reportarPendiente = (
    mensaje: string,
    politica: Pick<DriveCierreRecursoInput, 'critico' | 'bloqueaCierre'>
  ) => {
    const bloqueaCierre = politica.bloqueaCierre ?? true
    if (bloqueaCierre) bloqueantes.push(mensaje)
    else if (politica.critico === true) pendientesCriticos.push(mensaje)
    else advertencias.push(mensaje)
  }

  for (const etapa of etapas) {
    for (const documento of etapa.documentos) {
      const codigo = normalizeCodigoDocumento(documento.codigo)
      const recurso = byCodigo.get(codigo)
      const label = `${codigo} ${documento.nombre}`
      if (!recurso) {
        reportarPendiente(`${label}: recurso Drive faltante`, documento)
        continue
      }

      const tieneEditable = Boolean(recurso.webUrl?.trim())
      const tieneJustificacion = Boolean(recurso.notas?.trim())
      const tieneDefinitivo = Boolean(recurso.definitivo?.webUrl?.trim() || recurso.definitivo?.storageId)
      const esNativo = recurso.modo === 'nativo' || recurso.modo === 'nativo_calculado'

      if (recurso.estado === 'retirado') {
        reportarPendiente(`${label}: recurso retirado`, recurso)
        continue
      }

      if (recurso.estado === 'no_aplica') {
        if (!tieneJustificacion) reportarPendiente(`${label}: no aplica sin justificacion`, recurso)
        continue
      }

      if (recurso.estado === 'reemplazado') {
        if ((!esNativo && !tieneEditable) || !tieneJustificacion) {
          reportarPendiente(`${label}: reemplazado sin enlace vigente o motivo`, recurso)
        }
        continue
      }

      if (!esNativo && !tieneEditable) {
        reportarPendiente(`${label}: falta enlace editable`, recurso)
        continue
      }

      const completo = esNativo ? recurso.nativoCompleto === true : recurso.estado === 'diligenciado'
      if (recurso.critico === true && !completo) {
        reportarPendiente(`${label}: formato critico no diligenciado`, recurso)
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
    pendientesCriticos,
    advertencias,
  }
}
