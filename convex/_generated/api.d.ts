/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_sgc_catalog from "../_lib/sgc/catalog.js";
import type * as _lib_sgc_checklist from "../_lib/sgc/checklist.js";
import type * as agent_auth from "../agent/auth.js";
import type * as agent_definitions from "../agent/definitions.js";
import type * as agent_fichas from "../agent/fichas.js";
import type * as agent_index from "../agent/index.js";
import type * as agent_mutations from "../agent/mutations.js";
import type * as agent_participantes from "../agent/participantes.js";
import type * as agent_pt from "../agent/pt.js";
import type * as agent_resultados from "../agent/resultados.js";
import type * as agent_rondas from "../agent/rondas.js";
import type * as agent_sgc from "../agent/sgc.js";
import type * as agent_sgcMutations from "../agent/sgcMutations.js";
import type * as agent_shared from "../agent/shared.js";
import type * as fichas_index from "../fichas/index.js";
import type * as migrations from "../migrations.js";
import type * as pt_index from "../pt/index.js";
import type * as rondas_cleanup from "../rondas/cleanup.js";
import type * as rondas_codes from "../rondas/codes.js";
import type * as rondas_definitions from "../rondas/definitions.js";
import type * as rondas_directorio from "../rondas/directorio.js";
import type * as rondas_directorio_definitions from "../rondas/directorio_definitions.js";
import type * as rondas_fichas from "../rondas/fichas.js";
import type * as rondas_index from "../rondas/index.js";
import type * as rondas_mapping from "../rondas/mapping.js";
import type * as rondas_mutations from "../rondas/mutations.js";
import type * as rondas_reads from "../rondas/reads.js";
import type * as rondas_resultados from "../rondas/resultados.js";
import type * as rondas_state from "../rondas/state.js";
import type * as rondas_validators from "../rondas/validators.js";
import type * as sgc_audit from "../sgc/audit.js";
import type * as sgc_casos from "../sgc/casos.js";
import type * as sgc_comentarios from "../sgc/comentarios.js";
import type * as sgc_comunicaciones from "../sgc/comunicaciones.js";
import type * as sgc_documentos from "../sgc/documentos.js";
import type * as sgc_evidencias from "../sgc/evidencias.js";
import type * as sgc_hitos from "../sgc/hitos.js";
import type * as sgc_index from "../sgc/index.js";
import type * as sgc_maestro from "../sgc/maestro.js";
import type * as sgc_notificaciones from "../sgc/notificaciones.js";
import type * as sgc_panel from "../sgc/panel.js";
import type * as sgc_plan from "../sgc/plan.js";
import type * as sgc_publicaciones from "../sgc/publicaciones.js";
import type * as sgc_revision from "../sgc/revision.js";
import type * as sgc_shared from "../sgc/shared.js";
import type * as sgc_snapshots from "../sgc/snapshots.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/sgc/catalog": typeof _lib_sgc_catalog;
  "_lib/sgc/checklist": typeof _lib_sgc_checklist;
  "agent/auth": typeof agent_auth;
  "agent/definitions": typeof agent_definitions;
  "agent/fichas": typeof agent_fichas;
  "agent/index": typeof agent_index;
  "agent/mutations": typeof agent_mutations;
  "agent/participantes": typeof agent_participantes;
  "agent/pt": typeof agent_pt;
  "agent/resultados": typeof agent_resultados;
  "agent/rondas": typeof agent_rondas;
  "agent/sgc": typeof agent_sgc;
  "agent/sgcMutations": typeof agent_sgcMutations;
  "agent/shared": typeof agent_shared;
  "fichas/index": typeof fichas_index;
  migrations: typeof migrations;
  "pt/index": typeof pt_index;
  "rondas/cleanup": typeof rondas_cleanup;
  "rondas/codes": typeof rondas_codes;
  "rondas/definitions": typeof rondas_definitions;
  "rondas/directorio": typeof rondas_directorio;
  "rondas/directorio_definitions": typeof rondas_directorio_definitions;
  "rondas/fichas": typeof rondas_fichas;
  "rondas/index": typeof rondas_index;
  "rondas/mapping": typeof rondas_mapping;
  "rondas/mutations": typeof rondas_mutations;
  "rondas/reads": typeof rondas_reads;
  "rondas/resultados": typeof rondas_resultados;
  "rondas/state": typeof rondas_state;
  "rondas/validators": typeof rondas_validators;
  "sgc/audit": typeof sgc_audit;
  "sgc/casos": typeof sgc_casos;
  "sgc/comentarios": typeof sgc_comentarios;
  "sgc/comunicaciones": typeof sgc_comunicaciones;
  "sgc/documentos": typeof sgc_documentos;
  "sgc/evidencias": typeof sgc_evidencias;
  "sgc/hitos": typeof sgc_hitos;
  "sgc/index": typeof sgc_index;
  "sgc/maestro": typeof sgc_maestro;
  "sgc/notificaciones": typeof sgc_notificaciones;
  "sgc/panel": typeof sgc_panel;
  "sgc/plan": typeof sgc_plan;
  "sgc/publicaciones": typeof sgc_publicaciones;
  "sgc/revision": typeof sgc_revision;
  "sgc/shared": typeof sgc_shared;
  "sgc/snapshots": typeof sgc_snapshots;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
