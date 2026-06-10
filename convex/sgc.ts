import { mutation, query } from './_generated/server'

import { getPanelSgcConfig, generateUploadUrlConfig, transitionRondaToDocumentacionPendienteConfig, transitionRondaToCerradaConfig, reabrirRondaSgcConfig, inicializarPanelSgcConfig, listRondasSgcResumenConfig } from './sgc/panel'
import { getPlanRondaConfig, createOrUpdatePlanRondaConfig, finalizarPlanRondaConfig } from './sgc/plan'
import { getRevisionDatosConfig, getRevisionHomogeneidadConfig, createOrUpdateRevisionDatosConfig, finalizarRevisionDatosConfig, createOrUpdateRevisionHomogeneidadConfig, finalizarRevisionHomogeneidadConfig } from './sgc/revision'
import { listHitosRondaConfig, createHitoRondaConfig, updateHitoRondaConfig, getHitosVisibleParticipanteConfig } from './sgc/hitos'
import { listEvidenciaSeriesConfig, listEvidenciaVersionesConfig, getDownloadUrlConfig, getEvidenciaVersionContextConfig, createEvidenciaSeriesConfig, registrarEvidenciaVersionConfig, retirarEvidenciaVersionConfig, upsertJustificacionConfig, retirarJustificacionConfig, getEvidenciasPublicasConfig } from './sgc/evidencias'
import { listDocumentosSgcConfig, listMatrizDocumentalSgcConfig, listDocumentoSgcVersionesConfig, getDocumentoSgcDownloadUrlConfig, upsertDocumentoSgcConfig, registrarDocumentoSgcVersionConfig, retirarDocumentoSgcVersionConfig } from './sgc/documentos'
import { listAuditLogConfig } from './sgc/audit'
import { listSnapshotsConfig } from './sgc/snapshots'
import { listComunicacionesConfig, createComunicacionConfig, updateComunicacionConfig, deleteComunicacionConfig } from './sgc/comunicaciones'
import { listPublicacionesConfig, createPublicacionConfig, deletePublicacionConfig } from './sgc/publicaciones'
import { listComentariosRondaConfig, listMisComentariosRondaConfig, createComentarioRondaConfig, responderComentarioRondaConfig } from './sgc/comentarios'
import { crearNotificacionConfig, listMisNotificacionesConfig, marcarNotificacionLeidaConfig } from './sgc/notificaciones'
import { upsertResultadoPtAppConfig, crearCasoSgcConfig, actualizarCasoSgcConfig } from './sgc/casos'

export const getPanelSgc = query(getPanelSgcConfig)
export const getPlanRonda = query(getPlanRondaConfig)
export const getRevisionDatos = query(getRevisionDatosConfig)
export const getRevisionHomogeneidad = query(getRevisionHomogeneidadConfig)
export const listHitosRonda = query(listHitosRondaConfig)
export const listEvidenciaSeries = query(listEvidenciaSeriesConfig)
export const listEvidenciaVersiones = query(listEvidenciaVersionesConfig)
export const listDocumentosSgc = query(listDocumentosSgcConfig)
export const listMatrizDocumentalSgc = query(listMatrizDocumentalSgcConfig)
export const listDocumentoSgcVersiones = query(listDocumentoSgcVersionesConfig)
export const getDocumentoSgcDownloadUrl = query(getDocumentoSgcDownloadUrlConfig)
export const listAuditLog = query(listAuditLogConfig)
export const listSnapshots = query(listSnapshotsConfig)
export const getDownloadUrl = query(getDownloadUrlConfig)
export const getEvidenciaVersionContext = query(getEvidenciaVersionContextConfig)
export const generateUploadUrl = mutation(generateUploadUrlConfig)
export const upsertDocumentoSgc = mutation(upsertDocumentoSgcConfig)
export const registrarDocumentoSgcVersion = mutation(registrarDocumentoSgcVersionConfig)
export const retirarDocumentoSgcVersion = mutation(retirarDocumentoSgcVersionConfig)
export const createOrUpdatePlanRonda = mutation(createOrUpdatePlanRondaConfig)
export const finalizarPlanRonda = mutation(finalizarPlanRondaConfig)
export const createOrUpdateRevisionDatos = mutation(createOrUpdateRevisionDatosConfig)
export const finalizarRevisionDatos = mutation(finalizarRevisionDatosConfig)
export const createOrUpdateRevisionHomogeneidad = mutation(createOrUpdateRevisionHomogeneidadConfig)
export const finalizarRevisionHomogeneidad = mutation(finalizarRevisionHomogeneidadConfig)
export const createHitoRonda = mutation(createHitoRondaConfig)
export const updateHitoRonda = mutation(updateHitoRondaConfig)
export const createEvidenciaSeries = mutation(createEvidenciaSeriesConfig)
export const registrarEvidenciaVersion = mutation(registrarEvidenciaVersionConfig)
export const retirarEvidenciaVersion = mutation(retirarEvidenciaVersionConfig)
export const upsertJustificacion = mutation(upsertJustificacionConfig)
export const retirarJustificacion = mutation(retirarJustificacionConfig)
export const transitionRondaToDocumentacionPendiente = mutation(transitionRondaToDocumentacionPendienteConfig)
export const transitionRondaToCerrada = mutation(transitionRondaToCerradaConfig)
export const reabrirRondaSgc = mutation(reabrirRondaSgcConfig)
export const inicializarPanelSgc = mutation(inicializarPanelSgcConfig)
export const listComunicaciones = query(listComunicacionesConfig)
export const createComunicacion = mutation(createComunicacionConfig)
export const updateComunicacion = mutation(updateComunicacionConfig)
export const deleteComunicacion = mutation(deleteComunicacionConfig)
export const listRondasSgcResumen = query(listRondasSgcResumenConfig)
export const getHitosVisibleParticipante = query(getHitosVisibleParticipanteConfig)
export const getEvidenciasPublicas = query(getEvidenciasPublicasConfig)
export const listPublicaciones = query(listPublicacionesConfig)
export const createPublicacion = mutation(createPublicacionConfig)
export const deletePublicacion = mutation(deletePublicacionConfig)
export const listComentariosRonda = query(listComentariosRondaConfig)
export const listMisComentariosRonda = query(listMisComentariosRondaConfig)
export const createComentarioRonda = mutation(createComentarioRondaConfig)
export const responderComentarioRonda = mutation(responderComentarioRondaConfig)
export const crearNotificacion = mutation(crearNotificacionConfig)
export const listMisNotificaciones = query(listMisNotificacionesConfig)
export const marcarNotificacionLeida = mutation(marcarNotificacionLeidaConfig)
export const upsertResultadoPtApp = mutation(upsertResultadoPtAppConfig)
export const crearCasoSgc = mutation(crearCasoSgcConfig)
export const actualizarCasoSgc = mutation(actualizarCasoSgcConfig)
