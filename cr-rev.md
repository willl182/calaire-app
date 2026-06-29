
  638 | (\(\
  639 | (• .•)  This mutex is like your promises: not held.
  640 | 
  641 | ✔ Summarizing changes
  642 | 
  643 | ────────────────────────────────────────────────────────────────────────
  644 |   minor [potential_issue]
  645 |   → scripts/import-sgc-seeds.mjs:29-31
  646 | 
  647 |   Spawn failures are swallowed without context.
  648 | 
  649 |   When spawnSync fails to launch (e.g. pnpm not found), result.status
  650 |   is null and result.error holds the cause, but the code exits with code
  651 |   1 without surfacing result.error. Logging it would make seed-import
  652 |   failures diagnosable.
  653 | 
  654 | 
  655 |   🛡️ Proposed fix
  656 | 
  657 |      if (result.status !== 0) {
  658 |   +    if (result.error) console.error(result.error)
  659 |        process.exit(result.status ?? 1)
  660 |      }
  661 | 
  662 | 
  663 | ────────────────────────────────────────────────────────────────────────
  664 |   minor [potential_issue]
  665 |   → mapa_navegacion_sgc_pea.html:685-695
  666 | 
  667 |   Node role="button" doesn't respond to Space.
  668 | 
  669 |   Each node group is exposed as a button (role="button", tabindex="0")
  670 |   but only Enter triggers selectNode. Native buttons activate on Space
  671 |   too, so keyboard users will expect it. Also call preventDefault() for
  672 |   Space to avoid page scroll.
  673 | 
  674 | 
  675 |   ♿ Proposed fix
  676 | 
  677 |   -        g.addEventListener("keydown", e => { if (e.key === "Enter") selectNode(n.id); });
  678 |   +        g.addEventListener("keydown", e => {
  679 |   +          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectNode(n.id); }
  680 |   +        });
  681 | 
  682 | 
  683 | ────────────────────────────────────────────────────────────────────────
  684 |   major [potential_issue]
  685 |   → convex/schema.ts:624-641
  686 | 
  687 |   Make normative requirement lookups version-aware.
  688 | 
  689 |   versionNorma is part of the requirement record, but the clause lookup
  690 |   index omits it. Resolving by norma + clausula can conflate the same
  691 |   clause across different standard versions; add/use a version-aware index
  692 |   for imports and upserts.
  693 | 
  694 | 
  695 |   Proposed index addition
  696 | 
  697 |      })
  698 |        .index('by_norma', ['norma'])
  699 |        .index('by_norma_and_clausula', ['norma', 'clausula'])
  700 |   +    .index('by_norma_version_and_clausula', ['norma', 'versionNorma', 'clausula'])
  701 |        .index('by_estado', ['estado']),
  702 | 
  703 | 
  704 | ────────────────────────────────────────────────────────────────────────
  705 |   major [potential_issue]
  706 |   → lib/sgc/index.ts:217-218
  707 | 
  708 |   Align on a single version summary field.
  709 | 
  710 |   DocumentoSgcVersion still requires cambioResumen, but the new write
  711 |   path only sends resumenCambios. Since the query helpers cast responses
  712 |   to this type, callers can compile against a field that the API no longer
  713 |   guarantees and then read undefined at runtime. Keep one canonical
  714 |   property here, or make both optional until the migration is complete.
  715 | 
  716 | 
  717 | 
  718 | 
  719 | 
  720 |   Also applies to: 496-518
  721 | 
  722 | 
  723 | ────────────────────────────────────────────────────────────────────────
  724 |   major [potential_issue]
  725 |   → convex/sgc/documentos.ts:13
  726 | 
  727 |   Don't relax these reads without enforcing visibilidad.
  728 | 
  729 |   These handlers now expose the full document list, version history, and
  730 |   download URL to any requireSgcViewer caller, but none of them checks the
  731 |   document's visibilidad. That turns records marked for narrower audiences
  732 |   like interna or participantes into viewer-readable/downloadable data
  733 |   instead of keeping access scoped to the intended audience.
  734 | 
  735 | 
  736 | 
  737 | 
  738 | 
  739 |   Also applies to: 79-79, 93-96
  740 | 
  741 | 
  742 | ────────────────────────────────────────────────────────────────────────
  743 |   major [potential_issue]
  744 |   → app/(protected)/dashboard/sgc/documentos/actions.ts:71-95
  745 | 
  746 |   Move success redirects outside the try blocks.
  747 | 
  748 |   redirect() throws to control navigation, and Next.js documents that it
  749 |   should be called outside try/catch; these success redirects are caught
  750 |   and converted into error redirects. (nextjs.org)
  751 | 
  752 | 
  753 |   Proposed shape
  754 | 
  755 |   -  try {
  756 |   +  let id: string
  757 |   +  try {
  758 |   -    const id = await upsertDocumentoMaestro({
  759 |   +    id = String(await upsertDocumentoMaestro({
  760 |          ...
  761 |   -    })
  762 |   -    revalidatePath('/dashboard/sgc/documentos')
  763 |   -    redirectDocument(String(id), 'success', 'Documento maestro guardado.')
  764 |   +    }))
  765 |      } catch (error) {
  766 |        ...
  767 |      }
  768 |   +  revalidatePath('/dashboard/sgc/documentos')
  769 |   +  redirectDocument(id, 'success', 'Documento maestro guardado.')
  770 | 
  771 |   Apply the same pattern to registrarVersionOficialAction and
  772 |   crearRegistroDerivadoAction.
  773 | 
  774 | 
  775 | 
  776 | 
  777 | 
  778 | 
  779 | 
  780 | 
  781 |   Also applies to: 101-133, 139-157
  782 | 
  783 | 
  784 | ────────────────────────────────────────────────────────────────────────
  785 |   major [potential_issue]
  786 |   → app/(protected)/dashboard/sgc/normativa/actions.ts:30-47
  787 | 
  788 |   Move the success redirect after the try/catch.
  789 | 
  790 |   redirect() throws; when it runs on Line 44, the catch block handles it
  791 |   and replaces the success navigation with an error redirect. (nextjs.org)
  792 | 
  793 | 
  794 |   Proposed fix
  795 | 
  796 |      try {
  797 |        const documentoId = parseText(formData, 'documento_id')
  798 |        const requisitoId = parseText(formData, 'requisito_id')
  799 |        if (!documentoId || !requisitoId) throw new Error('Selecciona documento y requisito.')
  800 |        await upsertDocumentoRequisito({
  801 |          ...
  802 |        })
  803 |   -    revalidatePath('/dashboard/sgc/normativa')
  804 |   -    redirect('/dashboard/sgc/normativa?success=Relacion%20documento-requisito%20guardada')
  805 |      } catch (error) {
  806 |        redirect(`/dashboard/sgc/normativa?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible guardar la relacion.')}`)
  807 |      }
  808 |   +  revalidatePath('/dashboard/sgc/normativa')
  809 |   +  redirect('/dashboard/sgc/normativa?success=Relacion%20documento-requisito%20guardada')
  810 | 
  811 | 
  812 | ────────────────────────────────────────────────────────────────────────
  813 |   minor [potential_issue]
  814 |   → app/(protected)/dashboard/sgc/prototype/page.tsx:200-204
  815 | 
  816 |   Map non-error round states explicitly.
  817 | 
  818 |   stateClass() currently sends any unknown value to the rose/error
  819 |   palette, so activa and cerrada in the expedientes variant render as
  820 |   problem states. That makes the status badges misleading even when the
  821 |   round is healthy.
  822 | 
  823 | 
  824 |   Proposed fix
  825 | 
  826 |    function stateClass(state: string) {
  827 |      if (state === 'vigente' || state === 'cubierto' || state === 'completo') return 'bg-emerald-100 text-emerald-800'
  828 |      if (state === 'en_revision' || state === 'parcial' || state === 'en_progreso') return 'bg-amber-100 text-amber-800'
  829 |   +  if (state === 'activa') return 'bg-sky-100 text-sky-800'
  830 |   +  if (state === 'cerrada') return 'bg-slate-200 text-slate-700'
  831 |      if (state === 'obsoleto' || state === 'no_aplica') return 'bg-slate-200 text-slate-700'
  832 |      return 'bg-rose-100 text-rose-800'
  833 |    }
  834 | 
  835 | 
  836 | ────────────────────────────────────────────────────────────────────────
  837 |   major [potential_issue]
  838 |   → app/(protected)/dashboard/sgc/documentos/actions.ts:100-104
  839 | 
  840 |   Validate documento_id before uploading.
  841 | 
  842 |   If the form is missing or tampered with, the file is uploaded before the
  843 |   action discovers the document id is invalid, leaving an orphaned storage
  844 |   object.
  845 | 
  846 | 
  847 |   Proposed fix
  848 | 
  849 |      const documentoId = parseText(formData, 'documento_id')
  850 |      try {
  851 |   +    if (!documentoId) throw new Error('Selecciona un documento.')
  852 |        const file = formData.get('archivo')
  853 | 
  854 | 
  855 | ────────────────────────────────────────────────────────────────────────
  856 |   minor [potential_issue]
  857 |   → app/(protected)/dashboard/sgc/prototype/page.tsx:734-744
  858 | 
  859 |   Reserve space for the fixed variant switcher.
  860 | 
  861 |   The bottom switcher is fixed, but the page never adds matching bottom
  862 |   padding. On shorter viewports the last cards/buttons end up underneath the
  863 |   switcher and are harder to read or click.
  864 | 
  865 | 
  866 |   Proposed fix
  867 | 
  868 |   -    <div className="grid gap-6">
  869 |   +    <div className="grid gap-6 pb-24">
  870 | 
  871 | 
  872 | ────────────────────────────────────────────────────────────────────────
  873 |   minor [potential_issue]
  874 |   → app/(protected)/dashboard/SidebarNav.tsx:90-94
  875 | 
  876 |   Keep a fallback active state for unlisted SGC subroutes.
  877 | 
  878 |   Removing the old /dashboard/sgc prefix match means the new
  879 |   /dashboard/sgc/prototype page in this PR won't highlight any SGC tab.
  880 |   Add a final SGC fallback after the explicit route checks so new SGC pages
  881 |   still preserve location context.
  882 | 
  883 | 
  884 |   Proposed fix
  885 | 
  886 |   -    if (item.tabKey === '__sgc_home__') return pathname === '/dashboard/sgc'
  887 |        if (item.tabKey === '__sgc_documentos__') return pathname.startsWith('/dashboard/sgc/documentos')
  888 |        if (item.tabKey === '__sgc_normativa__') return pathname.startsWith('/dashboard/sgc/normativa')
  889 |        if (item.tabKey === '__sgc_mapa__') return pathname.startsWith('/dashboard/sgc/mapa')
  890 |   +    if (item.tabKey === '__sgc_home__') {
  891 |   +      return pathname === '/dashboard/sgc' || pathname.startsWith('/dashboard/sgc/')
  892 |   +    }
  893 | 
  894 | 
  895 | ────────────────────────────────────────────────────────────────────────
  896 |   major [potential_issue]
  897 |   → convex/sgc/maestro.ts:679-687
  898 | 
  899 |   Make non-replacement map imports idempotent.
  900 | 
  901 |   When reemplazar is false, re-running the same seed appends duplicate
  902 |   map relations. Upsert by a stable key such as `(bloque, origenCodigo,
  903 |   destinoCodigo, tipoRelacion)` or reject duplicates before insert.
  904 | 
  905 | 
  906 | ────────────────────────────────────────────────────────────────────────
  907 |   major [potential_issue]
  908 |   → convex/sgc/maestro.ts:565-571
  909 | 
  910 |   Resolve requisito map targets or reject them.
  911 | 
  912 |   The validator accepts destinoTipo: 'requisito', but both importers
  913 |   always write requisitoId: null and may still mark the relation as
  914 |   resolved. That makes requisito map edges non-navigable.
  915 | 
  916 | 
  917 | 
  918 | 
  919 | 
  920 | 
  921 |   Also applies to: 694-700
  922 | 
  923 | 
  924 | ────────────────────────────────────────────────────────────────────────
  925 |   minor [potential_issue]
  926 |   → convex/sgc/maestro.ts:81-83
  927 | 
  928 |   Do not return a capped value as the record count.
  929 | 
  930 |   take(50) makes registros report 50 for any document with more than
  931 |   50 records. If this is a count, compute an exact count/aggregate; if it is
  932 |   a preview, rename the field to avoid misleading consumers.
  933 | 
  934 | 
  935 | ────────────────────────────────────────────────────────────────────────
  936 |   minor [potential_issue]
  937 |   → convex/sgc/maestro.ts:361-365
  938 | 
  939 |   Reject blank derived-record codes and names.
  940 | 
  941 |   Unlike document upsert, this mutation can insert an empty normalized
  942 |   codigo or blank nombre.
  943 | 
  944 | 
  945 |   Proposed fix
  946 | 
  947 |   +    const codigo = normalizeCodigoDocumento(args.codigo)
  948 |   +    const nombre = args.nombre.trim()
  949 |   +    if (!codigo || !nombre) throw new Error('Codigo y nombre son obligatorios.')
  950 |        const id = await ctx.db.insert('registrosSgc', {
  951 |          documentoId: args.documentoId,
  952 |          versionBaseId: args.versionBaseId,
  953 |   -      codigo: normalizeCodigoDocumento(args.codigo),
  954 |   -      nombre: args.nombre.trim(),
  955 |   +      codigo,
  956 |   +      nombre,
  957 | 
  958 | 
  959 | ────────────────────────────────────────────────────────────────────────
  960 |   major [potential_issue]
  961 |   → convex/sgc/maestro.ts:550-553
  962 | 
  963 |   Do not delete all map relations during a generic seed import.
  964 | 
  965 |   importarSeedSgcConfig always wipes mapaSgcRelaciones, unlike the
  966 |   map-only importer which has reemplazar. This can remove manually curated
  967 |   relations when importing document/requisito seeds.
  968 | 
  969 | 
  970 |   Proposed fix
  971 | 
  972 |   -    const existingRelaciones = await ctx.db.query('mapaSgcRelaciones').collect()
  973 |   -    for (const relacion of existingRelaciones) {
  974 |   -      await ctx.db.delete(relacion._id)
  975 |   -    }
  976 |   +    // Prefer an explicit `reemplazarMapa` argument, or only delete rows owned by this seed source.
  977 | 
  978 | 
  979 | ────────────────────────────────────────────────────────────────────────
  980 |   major [potential_issue]
  981 |   → convex/sgc/maestro.ts:401-424
  982 | 
  983 |   Validate both sides before inserting a normativa relation.
  984 | 
  985 |   v.id() validates ID shape, not that the document/requisito exists. This
  986 |   can create dangling documentoRequisitos rows.
  987 | 
  988 | 
  989 |   Proposed fix
  990 | 
  991 |        const actor = await requireSgcAdmin(ctx)
  992 |   +    const [documento, requisito] = await Promise.all([
  993 |   +      ctx.db.get(args.documentoId),
  994 |   +      ctx.db.get(args.requisitoId),
  995 |   +    ])
  996 |   +    if (!documento) throw new Error('Documento SGC no encontrado.')
  997 |   +    if (!requisito) throw new Error('Requisito normativo no encontrado.')
  998 |        const existing = await ctx.db
  999 | 
  1000 | 
  1001 | ────────────────────────────────────────────────────────────────────────
  1002 |   major [potential_issue]
  1003 |   → convex/sgc/maestro.ts:358-363
  1004 | 
  1005 |   Ensure versionBaseId belongs to the selected document.
  1006 | 
  1007 |   versionBaseId is inserted without checking ownership, so a record for
  1008 |   document A can reference a version from document B.
  1009 | 
  1010 | 
  1011 |   Proposed fix
  1012 | 
  1013 |        const documento = await ctx.db.get(args.documentoId)
  1014 |        if (!documento) throw new Error('Documento SGC no encontrado.')
  1015 |   +    if (args.versionBaseId) {
  1016 |   +      const versionBase = await ctx.db.get(args.versionBaseId)
  1017 |   +      if (!versionBase || versionBase.documentoId !== args.documentoId) {
  1018 |   +        throw new Error('La version base no pertenece al documento SGC seleccionado.')
  1019 |   +      }
  1020 |   +    }
  1021 |        const now = Date.now()
  1022 | 
  1023 | 
  1024 | ────────────────────────────────────────────────────────────────────────
  1025 |   major [potential_issue]
  1026 |   → convex/sgc/maestro.ts:128-140
  1027 | 
  1028 |   Keep unlinked requirements in the “pendiente” filter.
  1029 | 
  1030 |   Line 129 filters relations first, then Line 140 removes rows with no
  1031 |   matching relation. That excludes requirements with zero relations, even
  1032 |   though Line 145 classifies them as pending.
  1033 | 
  1034 | 
  1035 |   Proposed fix
  1036 | 
  1037 |   -        let relaciones = await ctx.db.query('documentoRequisitos').withIndex('by_requisitoId', (q) => q.eq('requisitoId', requisito._id)).collect()
  1038 |   -        if (args.estadoCobertura) relaciones = relaciones.filter((relacion) => relacion.estadoCobertura === args.estadoCobertura)
  1039 |   +        const todasRelaciones = await ctx.db.query('documentoRequisitos').withIndex('by_requisitoId', (q) => q.eq('requisitoId', requisito._id)).collect()
  1040 |   +        const relaciones = args.estadoCobertura
  1041 |   +          ? todasRelaciones.filter((relacion) => relacion.estadoCobertura === args.estadoCobertura)
  1042 |   +          : todasRelaciones
  1043 |            const documentos = await Promise.all(relaciones.map((relacion) => ctx.db.get(relacion.documentoId)))
  1044 |            return {
  1045 |              requisito,
  1046 |              relaciones,
  1047 |   +          matchesEstadoCobertura:
  1048 |   +            !args.estadoCobertura ||
  1049 |   +            relaciones.length > 0 ||
  1050 |   +            (args.estadoCobertura === 'pendiente' && todasRelaciones.length === 0),
  1051 |              documentos: documentos.filter((documento): documento is NonNullable<typeof documento> => documento !== null),
  1052 |            }
  1053 |   @@
  1054 |   -      rows: rows.filter((row) => !args.estadoCobertura || row.relaciones.length > 0),
  1055 |   +      rows: rows.filter((row) => row.matchesEstadoCobertura),
  1056 | 
  1057 | 
  1058 | ────────────────────────────────────────────────────────────────────────
  1059 |   major [potential_issue]
  1060 |   → convex/sgc/maestro.ts:308-311
  1061 | 
  1062 |   Validate and de-duplicate official version numbers.
  1063 | 
  1064 |   A caller can pass 0, a fractional value, or a version number already
  1065 |   used by the document. That breaks controlled-document history.
  1066 | 
  1067 | 
  1068 |   Proposed fix
  1069 | 
  1070 |   +    const version = args.version ?? Math.max(0, ...anteriores.map((item) => item.version ?? 0)) + 1
  1071 |   +    if (!Number.isInteger(version) || version < 1) throw new Error('La version debe ser un entero positivo.')
  1072 |   +    if (anteriores.some((item) => item.version === version)) throw new Error('Ya existe una version con ese numero para este documento.')
  1073 |        const id = await ctx.db.insert('documentoSgcVersiones', {
  1074 |          documentoId: args.documentoId,
  1075 |   -      version: args.version ?? anteriores.length + 1,
  1076 |   +      version,
  1077 | 
  1078 | 
  1079 | ────────────────────────────────────────────────────────────────────────
  1080 |   minor [potential_issue]
  1081 |   → tests/e2e/sgc-cobertura-screenshots.auth.spec.ts:25-28
  1082 | 
  1083 |   Wait for the document table before capturing the center screenshot.
  1084 | 
  1085 |   This step takes 07-centro-documental.png as soon as the heading appears,
  1086 |   so the artifact can be captured before the table/data finishes rendering.
  1087 |   Gate the screenshot on the same ready signal the auth spec uses.
  1088 | 
  1089 | 
  1090 | 
  1091 | 
  1092 | 
  1093 | 
  1094 |   Suggested fix
  1095 | 
  1096 |      await page.goto('/dashboard/sgc/documentos')
  1097 |      await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  1098 |   +  await expect(page.getByRole('table')).toBeVisible()
  1099 |      await page.screenshot({
  1100 |        path: `${screenshotDir}/07-centro-documental.png`,
  1101 | 
  1102 | 
  1103 | ────────────────────────────────────────────────────────────────────────
  1104 |   minor [potential_issue]
  1105 |   → tests/e2e/sgc-fase3-screenshots.auth.spec.ts:13-16
  1106 | 
  1107 |   Move the table wait ahead of the screenshot.
  1108 | 
  1109 |   Right now the screenshot is taken before the document table is confirmed
  1110 |   visible, so 02-matriz-documental-maestra.png can capture a partially
  1111 |   rendered state.
  1112 | 
  1113 | 
  1114 | 
  1115 | 
  1116 | 
  1117 | 
  1118 |   Suggested fix
  1119 | 
  1120 |      await page.goto('/dashboard/sgc/documentos')
  1121 |      await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  1122 |   +  await expect(page.getByRole('table')).toBeVisible()
  1123 |      await page.screenshot({ path: `${screenshotDir}/02-matriz-documental-maestra.png`, fullPage: false })
  1124 |   -  await expect(page.getByRole('table')).toBeVisible()
  1125 | 
  1126 | 
  1127 | ────────────────────────────────────────────────────────────────────────
  1128 |   minor [potential_issue]
  1129 |   → qms_swe.md:5-10
  1130 | 
  1131 |   Replace the agent-local provenance paths.
  1132 | 
  1133 |   /root/agent-files/... ties the report to one machine and won't be useful
  1134 |   to repo readers. Please switch to repo-relative references or a small
  1135 |   provenance table so the source list survives outside this environment.
  1136 | 
  1137 | 
  1138 | ────────────────────────────────────────────────────────────────────────
  1139 |   minor [potential_issue]
  1140 |   → calaire-app_tune.md:106-111
  1141 | 
  1142 |   Gate F-PSEA-03 creation on the pending format decision.
  1143 | 
  1144 |   The recommendation to create the master file and update the checklist/map
  1145 |   conflicts with the later open decision at Lines 238-244 about whether
  1146 |   F-PSEA-03 is standalone, a report, or a section of an existing form.
  1147 |   Please make this conditional so the document doesn't prescribe a structure
  1148 |   before it's chosen.
  1149 | 
  1150 | 
  1151 | ────────────────────────────────────────────────────────────────────────
  1152 |   minor [potential_issue]
  1153 |   → documento-sgc.md:295-305
  1154 | 
  1155 |   Normalize the round-root directory name.
  1156 | 
  1157 |   This tree introduces 02_prueba_piloto_rondas, but the later “Estado
  1158 |   actual” section and the surrounding narrative use 02_despliegue_rondas.
  1159 |   Please keep one canonical path or mark the older one explicitly as
  1160 |   historical to avoid confusing readers.
  1161 | 
  1162 | 
  1163 | ────────────────────────────────────────────────────────────────────────
  1164 |   major [potential_issue]
  1165 |   → logs/plans/260628_1856_plan_sgc-maestro-protv2.md:36-37
  1166 | 
  1167 |   Move expedientes out of the SGC route list.
  1168 | 
  1169 |   This plan still treats expedientes as part of SGC, but the corrected
  1170 |   contract in the rest of this change set makes it a round-dashboard route
  1171 |   (/dashboard/rondas/expedientes) with /dashboard/sgc/expedientes only
  1172 |   as a compatibility redirect. Leaving it here will send future work back to
  1173 |   the old split.
  1174 | 
  1175 | 
  1176 |   Suggested update
  1177 | 
  1178 |   -| 2.2 | Rutas SGC | Implementar | Centro documental, detalle, normativa, expedientes, mapa. |
  1179 |   +| 2.2 | Rutas SGC | Implementar | Centro documental, detalle, normativa, mapa. |
  1180 |   +| 2.3 | Dashboard documental por ronda | Implementar | Expedientes bajo `/dashboard/rondas/expedientes`. |
  1181 | 
  1182 | 
  1183 | ────────────────────────────────────────────────────────────────────────
  1184 |   major [potential_issue]
  1185 |   → app/(protected)/dashboard/sgc/normativa/page.tsx:101-113
  1186 | 
  1187 |   Don't derive the matrix status from relaciones[0].
  1188 | 
  1189 |   A requirement can have several linked documents, and picking the first
  1190 |   relation makes the badge depend on query order instead of the actual
  1191 |   aggregate coverage. Compute an explicit precedence across all relaciones
  1192 |   before rendering the row.
  1193 | 
  1194 | 
  1195 | ────────────────────────────────────────────────────────────────────────
  1196 |   major [potential_issue]
  1197 |   → app/(protected)/dashboard/sgc/mapa/page.tsx:85-89
  1198 | 
  1199 |   Treat externalUrl as untrusted data before linking to it.
  1200 | 
  1201 |   If this field ever contains a javascript:/data: URL, the map renders
  1202 |   it as a clickable stored XSS gadget. Validate schemes on ingestion and
  1203 |   only render an anchor for safe http(s) URLs; otherwise show plain text
  1204 |   instead of '#'.
  1205 | 
  1206 | 
  1207 | ────────────────────────────────────────────────────────────────────────
  1208 |   minor [potential_issue]
  1209 |   → app/(protected)/dashboard/sgc/documentos/[id]/versiones/[versionId]/download/route.ts:17-20
  1210 | 
  1211 |   Verify that the requested version belongs to the requested document.
  1212 | 
  1213 |   Line 18 ignores id, so /documentos/A/versiones/B/download will still
  1214 |   redirect to B even if that version belongs to a different document.
  1215 |   Please fetch or validate by both ids before issuing the redirect so the
  1216 |   nested route contract stays true.
  1217 | 
  1218 | 
  1219 | ────────────────────────────────────────────────────────────────────────
  1220 |   major [potential_issue]
  1221 |   → app/(protected)/dashboard/sgc/documentos/[id]/page.tsx:95-125
  1222 | 
  1223 |   Add programmatic labels to these forms.
  1224 | 
  1225 |   Most controls here are placeholder-only, and the selects/file input have
  1226 |   no accessible name at all. That makes the update/version/registro flows
  1227 |   difficult to complete with assistive tech once fields are focused or
  1228 |   filled. Add associated ` elements (visible or sr-only`) for every
  1229 |   control.
  1230 | 
  1231 | 
  1232 | 
  1233 | 
  1234 | 
  1235 |   Also applies to: 132-155, 161-183
  1236 | 
  1237 | 
  1238 | ────────────────────────────────────────────────────────────────────────
  1239 |   major [potential_issue]
  1240 |   → app/(protected)/dashboard/sgc/documentos/[id]/page.tsx:68-69
  1241 | 
  1242 |   Validate editor-supplied URLs before persisting or rendering them.
  1243 | 
  1244 |   These hrefs are fed from form fields on Lines 119 and 180, so an editor
  1245 |   can store a javascript:/data: URL and turn it into a click-triggered
  1246 |   stored XSS for every viewer. Enforce an http:/https: allowlist in the
  1247 |   server action and render unsafe values as plain text instead of links.
  1248 | 
  1249 | 
  1250 | 
  1251 | 
  1252 | 
  1253 |   Also applies to: 119-120, 180-181, 221-221────────────────────────────────────────
  1254 | CodeRabbit Review
  1255 | 
  1256 | Diff      : all local changes (committed + uncommitted)
  1257 | Compare   : feature/sgc-maestro-protv2 → main
  1258 | Directory : calaire-app
  1259 | ────────────────────────────────────────
  1260 | 
  1261 | (\(\
  1262 | (• .•)  This mutex is like your promises: not held.
  1263 | 
  1264 | ✔ Summarizing changes
  1265 | 
  1266 | ────────────────────────────────────────────────────────────────────────
  1267 |   minor [potential_issue]
  1268 |   → scripts/import-sgc-seeds.mjs:29-31
  1269 | 
  1270 |   Spawn failures are swallowed without context.
  1271 | 
  1272 |   When spawnSync fails to launch (e.g. pnpm not found), result.status
  1273 |   is null and result.error holds the cause, but the code exits with code
  1274 |   1 without surfacing result.error. Logging it would make seed-import
  1275 |   failures diagnosable.
  1276 | 
  1277 | 
  1278 |   🛡️ Proposed fix
  1279 | 
  1280 |      if (result.status !== 0) {
  1281 |   +    if (result.error) console.error(result.error)
  1282 |        process.exit(result.status ?? 1)
  1283 |      }
  1284 | 
  1285 | 
  1286 | ────────────────────────────────────────────────────────────────────────
  1287 |   minor [potential_issue]
  1288 |   → mapa_navegacion_sgc_pea.html:685-695
  1289 | 
  1290 |   Node role="button" doesn't respond to Space.
  1291 | 
  1292 |   Each node group is exposed as a button (role="button", tabindex="0")
  1293 |   but only Enter triggers selectNode. Native buttons activate on Space
  1294 |   too, so keyboard users will expect it. Also call preventDefault() for
  1295 |   Space to avoid page scroll.
  1296 | 
  1297 | 
  1298 |   ♿ Proposed fix
  1299 | 
  1300 |   -        g.addEventListener("keydown", e => { if (e.key === "Enter") selectNode(n.id); });
  1301 |   +        g.addEventListener("keydown", e => {
  1302 |   +          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectNode(n.id); }
  1303 |   +        });
  1304 | 
  1305 | 
  1306 | ────────────────────────────────────────────────────────────────────────
  1307 |   major [potential_issue]
  1308 |   → convex/schema.ts:624-641
  1309 | 
  1310 |   Make normative requirement lookups version-aware.
  1311 | 
  1312 |   versionNorma is part of the requirement record, but the clause lookup
  1313 |   index omits it. Resolving by norma + clausula can conflate the same
  1314 |   clause across different standard versions; add/use a version-aware index
  1315 |   for imports and upserts.
  1316 | 
  1317 | 
  1318 |   Proposed index addition
  1319 | 
  1320 |      })
  1321 |        .index('by_norma', ['norma'])
  1322 |        .index('by_norma_and_clausula', ['norma', 'clausula'])
  1323 |   +    .index('by_norma_version_and_clausula', ['norma', 'versionNorma', 'clausula'])
  1324 |        .index('by_estado', ['estado']),
  1325 | 
  1326 | 
  1327 | ────────────────────────────────────────────────────────────────────────
  1328 |   major [potential_issue]
  1329 |   → lib/sgc/index.ts:217-218
  1330 | 
  1331 |   Align on a single version summary field.
  1332 | 
  1333 |   DocumentoSgcVersion still requires cambioResumen, but the new write
  1334 |   path only sends resumenCambios. Since the query helpers cast responses
  1335 |   to this type, callers can compile against a field that the API no longer
  1336 |   guarantees and then read undefined at runtime. Keep one canonical
  1337 |   property here, or make both optional until the migration is complete.
  1338 | 
  1339 | 
  1340 | 
  1341 | 
  1342 | 
  1343 |   Also applies to: 496-518
  1344 | 
  1345 | 
  1346 | ────────────────────────────────────────────────────────────────────────
  1347 |   major [potential_issue]
  1348 |   → convex/sgc/documentos.ts:13
  1349 | 
  1350 |   Don't relax these reads without enforcing visibilidad.
  1351 | 
  1352 |   These handlers now expose the full document list, version history, and
  1353 |   download URL to any requireSgcViewer caller, but none of them checks the
  1354 |   document's visibilidad. That turns records marked for narrower audiences
  1355 |   like interna or participantes into viewer-readable/downloadable data
  1356 |   instead of keeping access scoped to the intended audience.
  1357 | 
  1358 | 
  1359 | 
  1360 | 
  1361 | 
  1362 |   Also applies to: 79-79, 93-96
  1363 | 
  1364 | 
  1365 | ────────────────────────────────────────────────────────────────────────
  1366 |   major [potential_issue]
  1367 |   → app/(protected)/dashboard/sgc/documentos/actions.ts:71-95
  1368 | 
  1369 |   Move success redirects outside the try blocks.
  1370 | 
  1371 |   redirect() throws to control navigation, and Next.js documents that it
  1372 |   should be called outside try/catch; these success redirects are caught
  1373 |   and converted into error redirects. (nextjs.org)
  1374 | 
  1375 | 
  1376 |   Proposed shape
  1377 | 
  1378 |   -  try {
  1379 |   +  let id: string
  1380 |   +  try {
  1381 |   -    const id = await upsertDocumentoMaestro({
  1382 |   +    id = String(await upsertDocumentoMaestro({
  1383 |          ...
  1384 |   -    })
  1385 |   -    revalidatePath('/dashboard/sgc/documentos')
  1386 |   -    redirectDocument(String(id), 'success', 'Documento maestro guardado.')
  1387 |   +    }))
  1388 |      } catch (error) {
  1389 |        ...
  1390 |      }
  1391 |   +  revalidatePath('/dashboard/sgc/documentos')
  1392 |   +  redirectDocument(id, 'success', 'Documento maestro guardado.')
  1393 | 
  1394 |   Apply the same pattern to registrarVersionOficialAction and
  1395 |   crearRegistroDerivadoAction.
  1396 | 
  1397 | 
  1398 | 
  1399 | 
  1400 | 
  1401 | 
  1402 | 
  1403 | 
  1404 |   Also applies to: 101-133, 139-157
  1405 | 
  1406 | 
  1407 | ────────────────────────────────────────────────────────────────────────
  1408 |   major [potential_issue]
  1409 |   → app/(protected)/dashboard/sgc/normativa/actions.ts:30-47
  1410 | 
  1411 |   Move the success redirect after the try/catch.
  1412 | 
  1413 |   redirect() throws; when it runs on Line 44, the catch block handles it
  1414 |   and replaces the success navigation with an error redirect. (nextjs.org)
  1415 | 
  1416 | 
  1417 |   Proposed fix
  1418 | 
  1419 |      try {
  1420 |        const documentoId = parseText(formData, 'documento_id')
  1421 |        const requisitoId = parseText(formData, 'requisito_id')
  1422 |        if (!documentoId || !requisitoId) throw new Error('Selecciona documento y requisito.')
  1423 |        await upsertDocumentoRequisito({
  1424 |          ...
  1425 |        })
  1426 |   -    revalidatePath('/dashboard/sgc/normativa')
  1427 |   -    redirect('/dashboard/sgc/normativa?success=Relacion%20documento-requisito%20guardada')
  1428 |      } catch (error) {
  1429 |        redirect(`/dashboard/sgc/normativa?error=${encodeURIComponent(error instanceof Error ? error.message : 'No fue posible guardar la relacion.')}`)
  1430 |      }
  1431 |   +  revalidatePath('/dashboard/sgc/normativa')
  1432 |   +  redirect('/dashboard/sgc/normativa?success=Relacion%20documento-requisito%20guardada')
  1433 | 
  1434 | 
  1435 | ────────────────────────────────────────────────────────────────────────
  1436 |   minor [potential_issue]
  1437 |   → app/(protected)/dashboard/sgc/prototype/page.tsx:200-204
  1438 | 
  1439 |   Map non-error round states explicitly.
  1440 | 
  1441 |   stateClass() currently sends any unknown value to the rose/error
  1442 |   palette, so activa and cerrada in the expedientes variant render as
  1443 |   problem states. That makes the status badges misleading even when the
  1444 |   round is healthy.
  1445 | 
  1446 | 
  1447 |   Proposed fix
  1448 | 
  1449 |    function stateClass(state: string) {
  1450 |      if (state === 'vigente' || state === 'cubierto' || state === 'completo') return 'bg-emerald-100 text-emerald-800'
  1451 |      if (state === 'en_revision' || state === 'parcial' || state === 'en_progreso') return 'bg-amber-100 text-amber-800'
  1452 |   +  if (state === 'activa') return 'bg-sky-100 text-sky-800'
  1453 |   +  if (state === 'cerrada') return 'bg-slate-200 text-slate-700'
  1454 |      if (state === 'obsoleto' || state === 'no_aplica') return 'bg-slate-200 text-slate-700'
  1455 |      return 'bg-rose-100 text-rose-800'
  1456 |    }
  1457 | 
  1458 | 
  1459 | ────────────────────────────────────────────────────────────────────────
  1460 |   major [potential_issue]
  1461 |   → app/(protected)/dashboard/sgc/documentos/actions.ts:100-104
  1462 | 
  1463 |   Validate documento_id before uploading.
  1464 | 
  1465 |   If the form is missing or tampered with, the file is uploaded before the
  1466 |   action discovers the document id is invalid, leaving an orphaned storage
  1467 |   object.
  1468 | 
  1469 | 
  1470 |   Proposed fix
  1471 | 
  1472 |      const documentoId = parseText(formData, 'documento_id')
  1473 |      try {
  1474 |   +    if (!documentoId) throw new Error('Selecciona un documento.')
  1475 |        const file = formData.get('archivo')
  1476 | 
  1477 | 
  1478 | ────────────────────────────────────────────────────────────────────────
  1479 |   minor [potential_issue]
  1480 |   → app/(protected)/dashboard/sgc/prototype/page.tsx:734-744
  1481 | 
  1482 |   Reserve space for the fixed variant switcher.
  1483 | 
  1484 |   The bottom switcher is fixed, but the page never adds matching bottom
  1485 |   padding. On shorter viewports the last cards/buttons end up underneath the
  1486 |   switcher and are harder to read or click.
  1487 | 
  1488 | 
  1489 |   Proposed fix
  1490 | 
  1491 |   -    <div className="grid gap-6">
  1492 |   +    <div className="grid gap-6 pb-24">
  1493 | 
  1494 | 
  1495 | ────────────────────────────────────────────────────────────────────────
  1496 |   minor [potential_issue]
  1497 |   → app/(protected)/dashboard/SidebarNav.tsx:90-94
  1498 | 
  1499 |   Keep a fallback active state for unlisted SGC subroutes.
  1500 | 
  1501 |   Removing the old /dashboard/sgc prefix match means the new
  1502 |   /dashboard/sgc/prototype page in this PR won't highlight any SGC tab.
  1503 |   Add a final SGC fallback after the explicit route checks so new SGC pages
  1504 |   still preserve location context.
  1505 | 
  1506 | 
  1507 |   Proposed fix
  1508 | 
  1509 |   -    if (item.tabKey === '__sgc_home__') return pathname === '/dashboard/sgc'
  1510 |        if (item.tabKey === '__sgc_documentos__') return pathname.startsWith('/dashboard/sgc/documentos')
  1511 |        if (item.tabKey === '__sgc_normativa__') return pathname.startsWith('/dashboard/sgc/normativa')
  1512 |        if (item.tabKey === '__sgc_mapa__') return pathname.startsWith('/dashboard/sgc/mapa')
  1513 |   +    if (item.tabKey === '__sgc_home__') {
  1514 |   +      return pathname === '/dashboard/sgc' || pathname.startsWith('/dashboard/sgc/')
  1515 |   +    }
  1516 | 
  1517 | 
  1518 | ────────────────────────────────────────────────────────────────────────
  1519 |   major [potential_issue]
  1520 |   → convex/sgc/maestro.ts:679-687
  1521 | 
  1522 |   Make non-replacement map imports idempotent.
  1523 | 
  1524 |   When reemplazar is false, re-running the same seed appends duplicate
  1525 |   map relations. Upsert by a stable key such as `(bloque, origenCodigo,
  1526 |   destinoCodigo, tipoRelacion)` or reject duplicates before insert.
  1527 | 
  1528 | 
  1529 | ────────────────────────────────────────────────────────────────────────
  1530 |   major [potential_issue]
  1531 |   → convex/sgc/maestro.ts:565-571
  1532 | 
  1533 |   Resolve requisito map targets or reject them.
  1534 | 
  1535 |   The validator accepts destinoTipo: 'requisito', but both importers
  1536 |   always write requisitoId: null and may still mark the relation as
  1537 |   resolved. That makes requisito map edges non-navigable.
  1538 | 
  1539 | 
  1540 | 
  1541 | 
  1542 | 
  1543 | 
  1544 |   Also applies to: 694-700
  1545 | 
  1546 | 
  1547 | ────────────────────────────────────────────────────────────────────────
  1548 |   minor [potential_issue]
  1549 |   → convex/sgc/maestro.ts:81-83
  1550 | 
  1551 |   Do not return a capped value as the record count.
  1552 | 
  1553 |   take(50) makes registros report 50 for any document with more than
  1554 |   50 records. If this is a count, compute an exact count/aggregate; if it is
  1555 |   a preview, rename the field to avoid misleading consumers.
  1556 | 
  1557 | 
  1558 | ────────────────────────────────────────────────────────────────────────
  1559 |   minor [potential_issue]
  1560 |   → convex/sgc/maestro.ts:361-365
  1561 | 
  1562 |   Reject blank derived-record codes and names.
  1563 | 
  1564 |   Unlike document upsert, this mutation can insert an empty normalized
  1565 |   codigo or blank nombre.
  1566 | 
  1567 | 
  1568 |   Proposed fix
  1569 | 
  1570 |   +    const codigo = normalizeCodigoDocumento(args.codigo)
  1571 |   +    const nombre = args.nombre.trim()
  1572 |   +    if (!codigo || !nombre) throw new Error('Codigo y nombre son obligatorios.')
  1573 |        const id = await ctx.db.insert('registrosSgc', {
  1574 |          documentoId: args.documentoId,
  1575 |          versionBaseId: args.versionBaseId,
  1576 |   -      codigo: normalizeCodigoDocumento(args.codigo),
  1577 |   -      nombre: args.nombre.trim(),
  1578 |   +      codigo,
  1579 |   +      nombre,
  1580 | 
  1581 | 
  1582 | ────────────────────────────────────────────────────────────────────────
  1583 |   major [potential_issue]
  1584 |   → convex/sgc/maestro.ts:550-553
  1585 | 
  1586 |   Do not delete all map relations during a generic seed import.
  1587 | 
  1588 |   importarSeedSgcConfig always wipes mapaSgcRelaciones, unlike the
  1589 |   map-only importer which has reemplazar. This can remove manually curated
  1590 |   relations when importing document/requisito seeds.
  1591 | 
  1592 | 
  1593 |   Proposed fix
  1594 | 
  1595 |   -    const existingRelaciones = await ctx.db.query('mapaSgcRelaciones').collect()
  1596 |   -    for (const relacion of existingRelaciones) {
  1597 |   -      await ctx.db.delete(relacion._id)
  1598 |   -    }
  1599 |   +    // Prefer an explicit `reemplazarMapa` argument, or only delete rows owned by this seed source.
  1600 | 
  1601 | 
  1602 | ────────────────────────────────────────────────────────────────────────
  1603 |   major [potential_issue]
  1604 |   → convex/sgc/maestro.ts:401-424
  1605 | 
  1606 |   Validate both sides before inserting a normativa relation.
  1607 | 
  1608 |   v.id() validates ID shape, not that the document/requisito exists. This
  1609 |   can create dangling documentoRequisitos rows.
  1610 | 
  1611 | 
  1612 |   Proposed fix
  1613 | 
  1614 |        const actor = await requireSgcAdmin(ctx)
  1615 |   +    const [documento, requisito] = await Promise.all([
  1616 |   +      ctx.db.get(args.documentoId),
  1617 |   +      ctx.db.get(args.requisitoId),
  1618 |   +    ])
  1619 |   +    if (!documento) throw new Error('Documento SGC no encontrado.')
  1620 |   +    if (!requisito) throw new Error('Requisito normativo no encontrado.')
  1621 |        const existing = await ctx.db
  1622 | 
  1623 | 
  1624 | ────────────────────────────────────────────────────────────────────────
  1625 |   major [potential_issue]
  1626 |   → convex/sgc/maestro.ts:358-363
  1627 | 
  1628 |   Ensure versionBaseId belongs to the selected document.
  1629 | 
  1630 |   versionBaseId is inserted without checking ownership, so a record for
  1631 |   document A can reference a version from document B.
  1632 | 
  1633 | 
  1634 |   Proposed fix
  1635 | 
  1636 |        const documento = await ctx.db.get(args.documentoId)
  1637 |        if (!documento) throw new Error('Documento SGC no encontrado.')
  1638 |   +    if (args.versionBaseId) {
  1639 |   +      const versionBase = await ctx.db.get(args.versionBaseId)
  1640 |   +      if (!versionBase || versionBase.documentoId !== args.documentoId) {
  1641 |   +        throw new Error('La version base no pertenece al documento SGC seleccionado.')
  1642 |   +      }
  1643 |   +    }
  1644 |        const now = Date.now()
  1645 | 
  1646 | 
  1647 | ────────────────────────────────────────────────────────────────────────
  1648 |   major [potential_issue]
  1649 |   → convex/sgc/maestro.ts:128-140
  1650 | 
  1651 |   Keep unlinked requirements in the “pendiente” filter.
  1652 | 
  1653 |   Line 129 filters relations first, then Line 140 removes rows with no
  1654 |   matching relation. That excludes requirements with zero relations, even
  1655 |   though Line 145 classifies them as pending.
  1656 | 
  1657 | 
  1658 |   Proposed fix
  1659 | 
  1660 |   -        let relaciones = await ctx.db.query('documentoRequisitos').withIndex('by_requisitoId', (q) => q.eq('requisitoId', requisito._id)).collect()
  1661 |   -        if (args.estadoCobertura) relaciones = relaciones.filter((relacion) => relacion.estadoCobertura === args.estadoCobertura)
  1662 |   +        const todasRelaciones = await ctx.db.query('documentoRequisitos').withIndex('by_requisitoId', (q) => q.eq('requisitoId', requisito._id)).collect()
  1663 |   +        const relaciones = args.estadoCobertura
  1664 |   +          ? todasRelaciones.filter((relacion) => relacion.estadoCobertura === args.estadoCobertura)
  1665 |   +          : todasRelaciones
  1666 |            const documentos = await Promise.all(relaciones.map((relacion) => ctx.db.get(relacion.documentoId)))
  1667 |            return {
  1668 |              requisito,
  1669 |              relaciones,
  1670 |   +          matchesEstadoCobertura:
  1671 |   +            !args.estadoCobertura ||
  1672 |   +            relaciones.length > 0 ||
  1673 |   +            (args.estadoCobertura === 'pendiente' && todasRelaciones.length === 0),
  1674 |              documentos: documentos.filter((documento): documento is NonNullable<typeof documento> => documento !== null),
  1675 |            }
  1676 |   @@
  1677 |   -      rows: rows.filter((row) => !args.estadoCobertura || row.relaciones.length > 0),
  1678 |   +      rows: rows.filter((row) => row.matchesEstadoCobertura),
  1679 | 
  1680 | 
  1681 | ────────────────────────────────────────────────────────────────────────
  1682 |   major [potential_issue]
  1683 |   → convex/sgc/maestro.ts:308-311
  1684 | 
  1685 |   Validate and de-duplicate official version numbers.
  1686 | 
  1687 |   A caller can pass 0, a fractional value, or a version number already
  1688 |   used by the document. That breaks controlled-document history.
  1689 | 
  1690 | 
  1691 |   Proposed fix
  1692 | 
  1693 |   +    const version = args.version ?? Math.max(0, ...anteriores.map((item) => item.version ?? 0)) + 1
  1694 |   +    if (!Number.isInteger(version) || version < 1) throw new Error('La version debe ser un entero positivo.')
  1695 |   +    if (anteriores.some((item) => item.version === version)) throw new Error('Ya existe una version con ese numero para este documento.')
  1696 |        const id = await ctx.db.insert('documentoSgcVersiones', {
  1697 |          documentoId: args.documentoId,
  1698 |   -      version: args.version ?? anteriores.length + 1,
  1699 |   +      version,
  1700 | 
  1701 | 
  1702 | ────────────────────────────────────────────────────────────────────────
  1703 |   minor [potential_issue]
  1704 |   → tests/e2e/sgc-cobertura-screenshots.auth.spec.ts:25-28
  1705 | 
  1706 |   Wait for the document table before capturing the center screenshot.
  1707 | 
  1708 |   This step takes 07-centro-documental.png as soon as the heading appears,
  1709 |   so the artifact can be captured before the table/data finishes rendering.
  1710 |   Gate the screenshot on the same ready signal the auth spec uses.
  1711 | 
  1712 | 
  1713 | 
  1714 | 
  1715 | 
  1716 | 
  1717 |   Suggested fix
  1718 | 
  1719 |      await page.goto('/dashboard/sgc/documentos')
  1720 |      await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  1721 |   +  await expect(page.getByRole('table')).toBeVisible()
  1722 |      await page.screenshot({
  1723 |        path: `${screenshotDir}/07-centro-documental.png`,
  1724 | 
  1725 | 
  1726 | ────────────────────────────────────────────────────────────────────────
  1727 |   minor [potential_issue]
  1728 |   → tests/e2e/sgc-fase3-screenshots.auth.spec.ts:13-16
  1729 | 
  1730 |   Move the table wait ahead of the screenshot.
  1731 | 
  1732 |   Right now the screenshot is taken before the document table is confirmed
  1733 |   visible, so 02-matriz-documental-maestra.png can capture a partially
  1734 |   rendered state.
  1735 | 
  1736 | 
  1737 | 
  1738 | 
  1739 | 
  1740 | 
  1741 |   Suggested fix
  1742 | 
  1743 |      await page.goto('/dashboard/sgc/documentos')
  1744 |      await expect(page.getByRole('heading', { name: 'Centro documental' })).toBeVisible()
  1745 |   +  await expect(page.getByRole('table')).toBeVisible()
  1746 |      await page.screenshot({ path: `${screenshotDir}/02-matriz-documental-maestra.png`, fullPage: false })
  1747 |   -  await expect(page.getByRole('table')).toBeVisible()
  1748 | 
  1749 | 
  1750 | ────────────────────────────────────────────────────────────────────────
  1751 |   minor [potential_issue]
  1752 |   → qms_swe.md:5-10
  1753 | 
  1754 |   Replace the agent-local provenance paths.
  1755 | 
  1756 |   /root/agent-files/... ties the report to one machine and won't be useful
  1757 |   to repo readers. Please switch to repo-relative references or a small
  1758 |   provenance table so the source list survives outside this environment.
  1759 | 
  1760 | 
  1761 | ────────────────────────────────────────────────────────────────────────
  1762 |   minor [potential_issue]
  1763 |   → calaire-app_tune.md:106-111
  1764 | 
  1765 |   Gate F-PSEA-03 creation on the pending format decision.
  1766 | 
  1767 |   The recommendation to create the master file and update the checklist/map
  1768 |   conflicts with the later open decision at Lines 238-244 about whether
  1769 |   F-PSEA-03 is standalone, a report, or a section of an existing form.
  1770 |   Please make this conditional so the document doesn't prescribe a structure
  1771 |   before it's chosen.
  1772 | 
  1773 | 
  1774 | ────────────────────────────────────────────────────────────────────────
  1775 |   minor [potential_issue]
  1776 |   → documento-sgc.md:295-305
  1777 | 
  1778 |   Normalize the round-root directory name.
  1779 | 
  1780 |   This tree introduces 02_prueba_piloto_rondas, but the later “Estado
  1781 |   actual” section and the surrounding narrative use 02_despliegue_rondas.
  1782 |   Please keep one canonical path or mark the older one explicitly as
  1783 |   historical to avoid confusing readers.
  1784 | 
  1785 | 
  1786 | ────────────────────────────────────────────────────────────────────────
  1787 |   major [potential_issue]
  1788 |   → logs/plans/260628_1856_plan_sgc-maestro-protv2.md:36-37
  1789 | 
  1790 |   Move expedientes out of the SGC route list.
  1791 | 
  1792 |   This plan still treats expedientes as part of SGC, but the corrected
  1793 |   contract in the rest of this change set makes it a round-dashboard route
  1794 |   (/dashboard/rondas/expedientes) with /dashboard/sgc/expedientes only
  1795 |   as a compatibility redirect. Leaving it here will send future work back to
  1796 |   the old split.
  1797 | 
  1798 | 
  1799 |   Suggested update
  1800 | 
  1801 |   -| 2.2 | Rutas SGC | Implementar | Centro documental, detalle, normativa, expedientes, mapa. |
  1802 |   +| 2.2 | Rutas SGC | Implementar | Centro documental, detalle, normativa, mapa. |
  1803 |   +| 2.3 | Dashboard documental por ronda | Implementar | Expedientes bajo `/dashboard/rondas/expedientes`. |
  1804 | 
  1805 | 
  1806 | ────────────────────────────────────────────────────────────────────────
  1807 |   major [potential_issue]
  1808 |   → app/(protected)/dashboard/sgc/normativa/page.tsx:101-113
  1809 | 
  1810 |   Don't derive the matrix status from relaciones[0].
  1811 | 
  1812 |   A requirement can have several linked documents, and picking the first
  1813 |   relation makes the badge depend on query order instead of the actual
  1814 |   aggregate coverage. Compute an explicit precedence across all relaciones
  1815 |   before rendering the row.
  1816 | 
  1817 | 
  1818 | ────────────────────────────────────────────────────────────────────────
  1819 |   major [potential_issue]
  1820 |   → app/(protected)/dashboard/sgc/mapa/page.tsx:85-89
  1821 | 
  1822 |   Treat externalUrl as untrusted data before linking to it.
  1823 | 
  1824 |   If this field ever contains a javascript:/data: URL, the map renders
  1825 |   it as a clickable stored XSS gadget. Validate schemes on ingestion and
  1826 |   only render an anchor for safe http(s) URLs; otherwise show plain text
  1827 |   instead of '#'.
  1828 | 
  1829 | 
  1830 | ────────────────────────────────────────────────────────────────────────
  1831 |   minor [potential_issue]
  1832 |   → app/(protected)/dashboard/sgc/documentos/[id]/versiones/[versionId]/download/route.ts:17-20
  1833 | 
  1834 |   Verify that the requested version belongs to the requested document.
  1835 | 
  1836 |   Line 18 ignores id, so /documentos/A/versiones/B/download will still
  1837 |   redirect to B even if that version belongs to a different document.
  1838 |   Please fetch or validate by both ids before issuing the redirect so the
  1839 |   nested route contract stays true.
  1840 | 
  1841 | 
  1842 | ────────────────────────────────────────────────────────────────────────
  1843 |   major [potential_issue]
  1844 |   → app/(protected)/dashboard/sgc/documentos/[id]/page.tsx:95-125
  1845 | 
  1846 |   Add programmatic labels to these forms.
  1847 | 
  1848 |   Most controls here are placeholder-only, and the selects/file input have
  1849 |   no accessible name at all. That makes the update/version/registro flows
  1850 |   difficult to complete with assistive tech once fields are focused or
  1851 |   filled. Add associated ` elements (visible or sr-only`) for every
  1852 |   control.
  1853 | 
  1854 | 
  1855 | 
  1856 | 
  1857 | 
  1858 |   Also applies to: 132-155, 161-183
  1859 | 
  1860 | 
  1861 | ────────────────────────────────────────────────────────────────────────
  1862 |   major [potential_issue]
  1863 |   → app/(protected)/dashboard/sgc/documentos/[id]/page.tsx:68-69
  1864 | 
  1865 |   Validate editor-supplied URLs before persisting or rendering them.
  1866 | 
  1867 |   These hrefs are fed from form fields on Lines 119 and 180, so an editor
  1868 |   can store a javascript:/data: URL and turn it into a click-triggered
  1869 |   stored XSS for every viewer. Enforce an http:/https: allowlist in the
  1870 |   server action and render unsafe values as plain text instead of links.
  1871 | 
  1872 | 
  1873 | 
  1874 | 
  1875 | 
  1876 |   Also applies to: 119-120, 180-181, 221-221
</terminal_context>
