import 'server-only'

import { SGC_RONDA_ETAPAS } from '@/lib/sgc/catalog'
import {
  copyGoogleDriveFile,
  createGoogleDriveFolder,
  extractGoogleDriveIdFromRef,
  findGoogleDriveFolder,
  getGoogleDriveConfigStatus,
  googleDriveRootFolderId,
  parseGoogleDriveTemplateMap,
} from '@/lib/google-drive'
import {
  getDriveTreeSgc,
  inicializarDriveRonda,
  registrarAutomatizacionDrive,
  upsertDriveRecurso,
  type SgcDriveRecurso,
} from '@/lib/sgc'

type AutomatizarDriveResult = {
  rootCreado: boolean
  rootReutilizado: boolean
  carpetasCreadas: number
  carpetasReutilizadas: number
  documentosCopiados: number
  documentosReutilizados: number
  pendientesSinPlantilla: number
  fallidos: Array<{ codigo: string; error: string }>
}

// Nombre fisico de la subcarpeta en Google Drive por codigo de etapa (p. ej. `01_planificacion_ronda`).
// Se resuelve desde el catalogo y NO desde `notas`: `notas` es un campo libre que se sobrescribe con
// mensajes de estado/error en cada corrida, y usarlo como nombre corromperia la carpeta en reintentos.
const CARPETA_DRIVE_NOMBRE = new Map(
  SGC_RONDA_ETAPAS.map((etapa) => [etapa.key.trim().toUpperCase(), etapa.carpeta])
)
const CARPETA_DRIVE_NOMBRES = new Set(SGC_RONDA_ETAPAS.map((etapa) => etapa.carpeta))
const AUTOMATION_NOTE_PREFIX = '[Google Drive API] '
const GENERATED_NOTE_PREFIXES = [
  AUTOMATION_NOTE_PREFIX,
  'Carpeta raiz creada automaticamente',
  'Carpeta raiz reutilizada',
  'Subcarpeta creada automaticamente',
  'Subcarpeta reutilizada',
  'Copia creada automaticamente',
  'Pendiente: no hay plantilla Drive',
  'Fallo Google Drive API:',
]

function childrenOf(recursos: SgcDriveRecurso[], parentId: string | null) {
  return recursos.filter((recurso) => (recurso.parentId ?? null) === parentId)
}

function buildFolderName(folder: SgcDriveRecurso) {
  return CARPETA_DRIVE_NOMBRE.get(folder.codigo.trim().toUpperCase()) ?? folder.nombre
}

function buildDocumentoName(rondaCodigo: string, recurso: SgcDriveRecurso) {
  return `${rondaCodigo} - ${recurso.codigo} - ${recurso.nombre}`
}

function buildRootFolderName(rondaCodigo: string, rondaNombre: string | null | undefined, fallback: string) {
  const nombre = rondaNombre?.trim()
  return nombre ? `${rondaCodigo} - ${nombre}` : fallback
}

function driveOpenUrl(id: string) {
  return `https://drive.google.com/open?id=${id}`
}

function resolveTemplateId(recurso: SgcDriveRecurso, templateMap: Record<string, string>) {
  const codigo = recurso.codigo.toUpperCase()
  const formato = recurso.formatoRelacionado?.toUpperCase()
  const templateRef = recurso.templateUrl?.toUpperCase()
  const mapped = templateMap[codigo] ?? (formato ? templateMap[formato] : null) ?? (templateRef ? templateMap[templateRef] : null)
  return extractGoogleDriveIdFromRef(mapped ?? recurso.templateUrl ?? null)
}

async function saveRecursoLink(args: {
  recurso: SgcDriveRecurso
  webUrl: string | null
  estado: string | null
  tipo?: SgcDriveRecurso['tipo']
}) {
  await upsertDriveRecurso({
    recursoId: args.recurso._id,
    rondaId: args.recurso.rondaId,
    parentId: args.recurso.parentId ?? null,
    codigo: args.recurso.codigo,
    nombre: args.recurso.nombre,
    fase: args.recurso.fase ?? null,
    tipo: args.tipo ?? args.recurso.tipo,
    formatoRelacionado: args.recurso.formatoRelacionado ?? null,
    webUrl: args.webUrl,
    templateUrl: args.recurso.templateUrl ?? null,
    notas: mergeAutomationNotas(args.recurso.notas ?? null, args.estado),
    definitivo: args.recurso.definitivo ?? null,
  })
}

function isGeneratedNoteLine(line: string) {
  const value = line.trim()
  if (!value) return true
  return CARPETA_DRIVE_NOMBRES.has(value) || GENERATED_NOTE_PREFIXES.some((prefix) => value.startsWith(prefix))
}

function mergeAutomationNotas(existing: string | null, estado: string | null) {
  const status = estado?.trim()
  const statusLine = status ? `${AUTOMATION_NOTE_PREFIX}${status}` : null
  const manual = (existing ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !isGeneratedNoteLine(line))
    .join('\n')
    .trim()

  if (manual && statusLine) return `${manual}\n${statusLine}`
  return manual || statusLine
}

function buildAuditDetail(result: AutomatizarDriveResult) {
  const fallos = result.fallidos.map((fallo) => `${fallo.codigo}: ${fallo.error}`).join(' | ')
  return [
    `root=${result.rootCreado ? 'creado' : result.rootReutilizado ? 'reutilizado' : 'sin_cambio'}`,
    `carpetas_creadas=${result.carpetasCreadas}`,
    `carpetas_reutilizadas=${result.carpetasReutilizadas}`,
    `documentos_copiados=${result.documentosCopiados}`,
    `documentos_reutilizados=${result.documentosReutilizados}`,
    `sin_plantilla=${result.pendientesSinPlantilla}`,
    `fallidos=${result.fallidos.length}`,
    fallos ? `detalle_fallos=${fallos}` : null,
  ].filter(Boolean).join('; ')
}

export function getDriveGoogleAutomationStatus() {
  const status = getGoogleDriveConfigStatus()
  return {
    ...status,
    ready: status.clientEmail && status.privateKey && status.rootFolderId,
  }
}

export async function automatizarDriveRondaSgc(
  rondaId: string,
  rondaCodigo: string,
  rondaNombre?: string | null
): Promise<AutomatizarDriveResult> {
  await inicializarDriveRonda(rondaId)
  let tree = await getDriveTreeSgc(rondaId)
  const root = tree.root
  if (!root) throw new Error('El expediente Drive no tiene recurso raiz.')

  const result: AutomatizarDriveResult = {
    rootCreado: false,
    rootReutilizado: false,
    carpetasCreadas: 0,
    carpetasReutilizadas: 0,
    documentosCopiados: 0,
    documentosReutilizados: 0,
    pendientesSinPlantilla: 0,
    fallidos: [],
  }

  let rootFolderId = root.driveFolderId ?? null
  let rootWebUrl = root.webUrl ?? (rootFolderId ? driveOpenUrl(rootFolderId) : null)
  if (!rootFolderId && root.webUrl) {
    rootFolderId = extractGoogleDriveIdFromRef(root.webUrl)
    rootWebUrl = rootFolderId ? root.webUrl : null
  }

  if (rootFolderId && rootWebUrl) {
    result.rootReutilizado = true
    if (!root.driveFolderId || !root.webUrl) {
      await saveRecursoLink({
        recurso: root,
        webUrl: rootWebUrl,
        estado: 'Carpeta raiz reutilizada desde enlace existente.',
        tipo: 'carpeta',
      })
      tree = await getDriveTreeSgc(rondaId)
    }
  } else {
    const created = await createGoogleDriveFolder({
      name: buildRootFolderName(rondaCodigo, rondaNombre, root.nombre),
      parentId: googleDriveRootFolderId(),
    })
    rootFolderId = created.id
    await saveRecursoLink({
      recurso: root,
      webUrl: created.webUrl,
      estado: 'Carpeta raiz creada automaticamente.',
      tipo: 'carpeta',
    })
    result.rootCreado = true
    tree = await getDriveTreeSgc(rondaId)
  }

  const templateMap = parseGoogleDriveTemplateMap()
  const recursos = tree.recursos
  const rootActual = tree.root
  if (!rootActual) throw new Error('No fue posible recargar el recurso raiz Drive.')

  const folders = childrenOf(recursos, rootActual._id)
    .filter((recurso) => recurso.tipo === 'carpeta')
    .sort((a, b) => a.codigo.localeCompare(b.codigo))

  const folderIds = new Map<string, string>()
  for (const folder of folders) {
    try {
      const folderId = folder.driveFolderId ?? extractGoogleDriveIdFromRef(folder.webUrl)
      const folderWebUrl = folder.webUrl ?? (folderId ? driveOpenUrl(folderId) : null)
      if (folderId && folderWebUrl) {
        folderIds.set(folder._id, folderId)
        if (!folder.driveFolderId || !folder.webUrl) {
          await saveRecursoLink({
            recurso: folder,
            webUrl: folderWebUrl,
            estado: 'Subcarpeta reutilizada desde enlace existente.',
            tipo: 'carpeta',
          })
        }
        result.carpetasReutilizadas += 1
        continue
      }
      const folderName = buildFolderName(folder)
      const existingFolder = await findGoogleDriveFolder({
        name: folderName,
        parentId: rootFolderId,
      })
      const created = existingFolder ?? await createGoogleDriveFolder({
        name: folderName,
        parentId: rootFolderId,
      })
      folderIds.set(folder._id, created.id)
      await saveRecursoLink({
        recurso: folder,
        webUrl: created.webUrl,
        estado: existingFolder ? 'Subcarpeta reutilizada desde carpeta existente.' : 'Subcarpeta creada automaticamente.',
        tipo: 'carpeta',
      })
      if (existingFolder) result.carpetasReutilizadas += 1
      else result.carpetasCreadas += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido creando carpeta.'
      result.fallidos.push({ codigo: folder.codigo, error: message })
      await saveRecursoLink({
        recurso: folder,
        webUrl: null,
        estado: `Fallo: ${message}`,
        tipo: 'carpeta',
      })
    }
  }

  const refreshed = await getDriveTreeSgc(rondaId)
  for (const folder of childrenOf(refreshed.recursos, refreshed.root?._id ?? null).filter((recurso) => recurso.tipo === 'carpeta')) {
    if (folder.driveFolderId) folderIds.set(folder._id, folder.driveFolderId)
  }

  const documentos = refreshed.recursos
    .filter((recurso) => recurso.tipo !== 'carpeta')
    .sort((a, b) => a.codigo.localeCompare(b.codigo))

  for (const recurso of documentos) {
    if (recurso.webUrl || recurso.estado === 'diligenciado' || recurso.estado === 'retirado' || recurso.estado === 'no_aplica') {
      result.documentosReutilizados += 1
      continue
    }

    const parentFolderId = recurso.parentId ? folderIds.get(recurso.parentId) : null
    if (!parentFolderId) {
      const message = 'No hay carpeta padre creada en Google Drive.'
      result.fallidos.push({ codigo: recurso.codigo, error: message })
      await saveRecursoLink({ recurso, webUrl: null, estado: `Fallo: ${message}` })
      continue
    }

    const templateFileId = resolveTemplateId(recurso, templateMap)
    if (!templateFileId) {
      result.pendientesSinPlantilla += 1
      await saveRecursoLink({
        recurso,
        webUrl: null,
        estado: 'Pendiente: no hay plantilla Drive mapeada para copia automatica.',
      })
      continue
    }

    try {
      const copy = await copyGoogleDriveFile({
        templateFileId,
        parentId: parentFolderId,
        name: buildDocumentoName(rondaCodigo, recurso),
      })
      await saveRecursoLink({
        recurso,
        webUrl: copy.webUrl,
        estado: 'Copia creada automaticamente desde plantilla Drive.',
      })
      result.documentosCopiados += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido copiando plantilla.'
      result.fallidos.push({ codigo: recurso.codigo, error: message })
      await saveRecursoLink({
        recurso,
        webUrl: null,
        estado: `Fallo: ${message}`,
      })
    }
  }

  const huboProgreso =
    result.rootCreado ||
    result.rootReutilizado ||
    result.carpetasCreadas > 0 ||
    result.carpetasReutilizadas > 0 ||
    result.documentosCopiados > 0 ||
    result.documentosReutilizados > 0

  await registrarAutomatizacionDrive({
    rondaId,
    evento: result.fallidos.length > 0
      ? huboProgreso
        ? 'sgc.drive.google_api_parcial'
        : 'sgc.drive.google_api_fallo'
      : 'sgc.drive.google_api_completado',
    detalle: buildAuditDetail(result),
    targetId: tree.root?._id ?? root._id,
  })

  return result
}
