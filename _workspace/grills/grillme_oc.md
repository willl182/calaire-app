# Grill-me OC: Sesión de decisiones SGC

Fecha: 2026-06-07

## Contexto inicial

Se revisó `calaire_app_sgc_interface.md` y el código del repo. El schema actual contiene entidades para rondas, contaminantes, participantes, fichas de registro y envíos PT. No contiene calendario, cronograma, documentos cargados, quejas, apelaciones, CAPA, notificaciones ni carga persistente de archivos.

También se revisó `Planificacion_R1_PP (1).md`, que contiene una plantilla de planificación identificada como `F-PPSEA-03` con literales `a` a `u`.

## Preguntas y decisiones

1. Alcance inicial del panel SGC.
Decisión: híbrido escalonado.

2. Eje de organización del panel.
Decisión: por ronda.

3. Regla nativo/archivo.
Decisión: transaccional nativo y digitalizable, ajustado luego a no transaccional fuera de app.

4. Formatos digitalizables no transaccionales.
Decisión: fuera de la app de momento.

5. Evidencia puente para formatos transaccionales no nativos.
Decisión: cargar archivos.

6. Almacenamiento físico de archivos.
Decisión: Convex Storage.

7. Versionado de evidencias.
Decisión: versiones vigentes.

8. Estados por formato.
Decisión: cinco estados: `no_aplica`, `pendiente`, `cubierto_nativo`, `cubierto_archivo`, `requiere_revision`.

9. Formatos de la primera versión del panel.
Decisión: solo ronda PT.

10. Nuevos nativos fase 1.
Decisión inicial: F-06, F-11, F-13.

11. Cronograma del plan de ronda.
Decisión: hitos simples.

12. Campos de F-06.
Decisión inicial: plan completo.

13. Fuente del plan completo.
Decisión: usar plantilla existente.

14. Ubicación de plantilla F-06.
Decisión: el usuario aportó `Planificacion_R1_PP (1).md`.

15. Estructura de la plantilla `a` a `u`.
Decisión: bloques editables.

16. Subcampos estructurados de F-06.
Decisión: solo críticos.

17. Evidencias dentro de F-06.
Decisión: adjunto por bloque.

18. Cronograma y recordatorios.
Decisión: control visual.

19. Alcance F-11 envío/recepción.
Decisión: F-11 no existe/aplica porque los ítems se generan in situ.

20. Reemplazo de F-11.
Decisión: solo no aplica.

21. F-08 fase 1.
Decisión: archivo fase 1.

22. Alcance F-13.
Decisión: solo datos app.

23. Tipo de F-13.
Decisión: manual.

24. Métricas de apoyo F-13.
Decisión: mostrar métricas.

25. Versiones/revisiones F-13.
Decisión: una vigente.

26. Momento de F-13.
Decisión inicial: antes de cierre.

27. F-09/F-10/F-14.
Decisión: solo archivos.

28. Estados de nativos existentes.
Decisión: automáticos sin override.

29. Criterio F-05.
Decisión: requiere `claimedAt`.

30. Criterio F-05A.
Decisión: exigir `estado='enviado'`.

31. Alcance F-12.
Decisión: solo `member`.

32. Criterio F-07.
Decisión: códigos únicos para `member`.

33. Acceso panel SGC.
Decisión: solo admins.

34. Ubicación UI.
Decisión: pestaña SGC por ronda.

35. Exportación formal.
Decisión corregida: no basta con mostrar.

35 revisada. Salida documental.
Decisión: PDF imprimible.

36. Versión PDF.
Decisión: congelar al aprobar.

37. Estados internos F-06/F-13.
Decisión: `borrador`, `finalizado`, `reabierto`.

38. Permiso de finalizar/reabrir.
Decisión: cualquier admin.

39. Bloqueo de cierre.
Decisión: todo panel cubierto.

40. Significado de cierre.
Decisión: agregar estado intermedio.

41. Nombre de estado intermedio.
Decisión: `documentacion_pendiente`.

42. Bloqueo de envíos en `documentacion_pendiente`.
Decisión: sí bloquea.

43. Pasar de `activa` a `documentacion_pendiente`.
Decisión: recepción completa.

44. Pasar de `documentacion_pendiente` a `cerrada`.
Decisión: todo SGC cubierto.

45. Reabrir ronda cerrada.
Decisión: vuelve a `documentacion_pendiente`.

46. Vista participante en `documentacion_pendiente`.
Decisión: ver sin editar.

47. Layout panel SGC.
Decisión: tabla checklist.

48. Agrupación tabla.
Decisión: por fase.

49. Metadata de evidencia.
Decisión: solo archivo.

50. Versión automática de evidencia.
Decisión: autoincrementar.

51. Tipos de archivo.
Decisión: comunes SGC: PDF, DOCX, XLSX, CSV, PNG/JPG.

52. Inicialización F-06.
Decisión: textos plantilla.

53. Ubicación plantilla F-06.
Decisión: constante en código.

54. Código oficial del plan.
Decisión inicial: `F-PPSEA-03`.

55. Códigos restantes.
Decisión: provisionales.

56. Documentar decisiones.
Decisión: crear `plan_oc.md` y `grillme_oc.md` en raíz.

57. Códigos provisionales en UI.
Decisión: nota discreta.

58. Confirmación `F-PPSEA-03`.
Decisión: aún provisional.

59. Finalizar con códigos provisionales.
Decisión: final sin marca.

60. Edición de catálogo SGC.
Decisión: en código.

61. Modelo F-06.
Decisión: un documento con bloques.

62. Checklist F-13.
Decisión: fijos en código.

63. Respuestas F-13.
Decisión: checkbox simple.

64. Finalización F-13 con checkbox.
Decisión: parcial permitido.

65. Justificación F-13.
Decisión: no obligatoria.

66. Responsable F-13.
Decisión: solo automático.

67. Responsable F-06.
Decisión: solo automático.

68. Vigencia de evidencia.
Decisión: última vigente.

69. Borrado de evidencia.
Decisión: no borrar.

70. Edición de finalizados.
Decisión: editar directo.

71. Edición directa vs snapshot.
Decisión: snapshot histórico.

72. Incremento de versión de registros.
Decisión: nunca versionar visible.

73. Identificación de snapshots.
Decisión: fecha y usuario.

74. Historial de snapshots en UI.
Decisión: visible colapsable.

75. Bitácora SGC.
Decisión: sí mínima.

76. Bitácora en PDF.
Decisión: resumen mínimo.

77. Resumen de control en PDF.
Decisión: estado y fechas.

78. Evidencias en PDF.
Decisión: listar evidencias.

79. Entrega actual.
Decisión: solo plan ahora.

80. Funcionalidades adicionales SGC fase 1.
Decisión: comunicaciones.

81. Comunicaciones fase 1.
Decisión inicial: todas P-20.

82. Emails P-20.
Decisión corregida: solo plantillas; no notificaciones ni emails.

83. Ubicación de plantillas P-20.
Decisión: Markdown en repo.

84. Ubicación UI P-20.
Decisión: enlaces en SGC.

85. Variables en plantillas P-20.
Decisión: variables explícitas.

## Decisiones finales consolidadas

- La fase 1 entrega un panel SGC por ronda, no un gestor documental general.
- La pestaña `SGC` vive dentro de cada ronda.
- El panel se muestra como tabla/checklist por fase.
- El cierre final de ronda depende de que todo el panel esté cubierto o no aplique.
- Se agrega estado `documentacion_pendiente` para cerrar recepción sin cerrar documentalmente.
- En `documentacion_pendiente`, participantes pueden consultar pero no editar/enviar.
- F-11 queda `no_aplica` porque los ítems se generan in situ.
- F-08/F-09/F-10/F-14 quedan por archivo en fase 1.
- F-13 es manual, con métricas de apoyo, checkbox simple y finalización parcial permitida.
- El plan de ronda se implementa como bloques `a` a `u` con plantilla editable.
- Las evidencias se cargan en Convex Storage, la última queda vigente y no se borran.
- F-06/F-13 generan PDF imprimible.
- F-06/F-13 pueden editarse directamente, preservando snapshots históricos.
- P-20 fase 1 consiste solo en plantillas Markdown con variables explícitas enlazadas desde SGC.
