# Workflow: Ejecución de la migración T3

**Propósito**: reglas de ejecución, ritmo de commits/PRs, verificaciones y rollback para la migración estructural a T3.

**Base**: [`PLAN_MIGRACION_T3.md`](PLAN_MIGRACION_T3.md).

---

## 1. Preparación de sesión

Antes de tocar código:

1. Leer `logs/CURRENT_SESSION.md`.
2. Leer [`PLAN_MIGRACION_T3.md`](PLAN_MIGRACION_T3.md) y marcar qué fases ya están completadas.
3. Leer este archivo para recordar el ritmo de trabajo.
4. Asegurarse de tener una rama limpia y actualizada:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/t3-estructura-segura
   ```

---

## 2. Ritmo de trabajo por fase

Cada fase sigue el ciclo **EDVCR**:

| Letra | Paso | Qué hacer |
|---|---|---|
| **E** | Explorar | Leer la fase en el plan. Identificar archivos afectados. Hacer backup mental o físico. |
| **D** | Ejecutar | Correr los comandos/script de la fase. Preferir `git mv` y `sed` sobre ediciones manuales. |
| **V** | Verificar | Correr los comandos de verificación de la fase. Si falla, no seguir. |
| **C** | Commitear | Hacer commit **solo de la fase actual** con mensaje estructurado. |
| **R** | Reportar | Actualizar `logs/CURRENT_SESSION.md` con el estado y cualquier bloqueador. |

---

## 3. Reglas de commit

### Un commit por fase

No mezclar fases en un mismo commit. Ejemplos de mensajes:

```
t3(fase0): andamiaje, deps e inventarios de seguridad

t3(fase1): src/env.js, src/lib/utils.ts y tipos env

t3(fase2): app/ -> src/app/ con copia, puentes y alias nuevo

t3(fase3): lib/ -> src/server/<dominio>/ + src/lib/

t3(fase4): proxy.ts bajo src

t3(fase5): convex/ por dominios, sin renombrar modulos

t3(fase6): process.env.X! -> env.X

t3(fase7): componentes UI primitivos en src/components/ui/

t3(fase8): limpieza, docs y AGENTS.md actualizado
```

### No commitear en rojo

Si `pnpm build` o `pnpm lint` fallan al final de una fase, no se commitea. Se resuelve o se revierte.

---

## 4. Verificación mínima por fase

Cada fase termina con esta secuencia, salvo que el plan indique lo contrario:

```bash
pnpm install        # si se agregaron deps
pnpm build          # obligatorio
pnpm lint           # obligatorio
pnpm test           # si aplica (a partir de Fase 1)
```

Fases 2, 5 y 8 además requieren:

```bash
pnpm test:e2e
```

Fase 5 además requiere:

```bash
pnpm exec convex codegen
pnpm exec convex dev   # al menos arrancar y validar que no crashea
```

---

## 5. Uso de inventarios y diff

Antes de Fase 2 y Fase 5 se generan inventarios. Después de la fase se comparan:

```bash
# Fase 2: verificar que no quedaron imports a @/app/ ni @/lib/ en src/app/
diff logs/plans/imports-antes.txt logs/plans/imports-despues.txt
rg "@/app/" src/ || echo "OK: no hay @/app/ en src/"
rg "@/lib/" src/app/ || echo "OK: no hay @/lib/ en src/app/"

# Fase 5: cambio breaking aceptado; verificar que solo cambió a .index / agent.auth
rg "api\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+" src/ scripts/ tests/ -g "*.ts" -g "*.tsx" --no-filename -o | sort | uniq > logs/plans/convex-api-uso-despues.txt
diff logs/plans/convex-api-uso-antes.txt logs/plans/convex-api-uso-despues.txt || true
rg -P "api\.(rondas|sgc|fichas|pt)\.(?!index\b)[A-Za-z0-9_]+\b|api\.agentAuth\." src/ scripts/ tests/ -g "*.ts" -g "*.tsx" && echo "ADVERTENCIA: quedan paths Convex antiguos" || echo "OK: paths Convex antiguos migrados"
```

Si el `diff` muestra cambios distintos a `api.<dominio>.<fn>` → `api.<dominio>.index.<fn>` o `api.agentAuth.<fn>` → `api.agent.auth.<fn>`, se detiene la fase y se investiga.

---

## 6. Estrategia de rollback

### Si una fase se rompe y no se puede arreglar en < 30 min

```bash
git reset --hard HEAD   # vuelve al commit anterior (fase anterior verificada)
```

### Si ya se hicieron commits posteriores y se descubre un error

```bash
git revert HEAD~N..HEAD --no-commit   # donde N es la cantidad de fases a revertir
# revisar, arreglar conflictos, commitear
```

### Backup de emergencia

Antes de Fase 2 y Fase 5, crear un tag local:

```bash
git tag backup/antes-fase-2
git tag backup/antes-fase-5
```

---

## 7. Trabajo en equipo / handoff

Si otra persona retoma el trabajo:

1. Leer `logs/CURRENT_SESSION.md`.
2. Ver el último commit de la rama: `git log --oneline -5`.
3. Confirmar que el último commit cumplió verificación corriendo `pnpm build && pnpm lint`.
4. Continuar con la siguiente fase del plan.

### Plantilla de update en `logs/CURRENT_SESSION.md`

```markdown
## Migración T3 - Fase X

- [x] Paso X.Y completado
- [ ] Paso X.Z pendiente
- **Bloqueador**: (si hay)
- **Verificación**: `pnpm build` verde / rojo
- **Notas**: (cualquier detalle útil para el siguiente agente)
```

---

## 8. Flujo recomendado de PRs

### Opción A: un PR por fase (recomendado para equipo)

1. Cada fase termina en commit.
2. Se hace push y se abre PR contra `main`.
3. Se espera review verde.
4. Se hace merge y se actualiza `logs/CURRENT_SESSION.md`.

### Opción B: un solo PR al final (aceptable si se trabaja solo)

1. Se ejecutan todas las fases en la rama.
2. Cada fase es un commit separado.
3. Se abre un solo PR grande con la historia completa.
4. El reviewer puede revisar commit por commit.

---

## 9. Comandos de utilidad

### Ver estado de la migración

```bash
git log --oneline --grep="t3(fase"
```

### Verificar que no quedó basura del layout anterior

```bash
ls app/ 2>/dev/null && echo "ADVERTENCIA: app/ todavía existe" || echo "OK: app/ eliminado"
ls lib/ 2>/dev/null && echo "ADVERTENCIA: lib/ todavía existe" || echo "OK: lib/ eliminado"
ls proxy.ts 2>/dev/null && echo "ADVERTENCIA: proxy.ts todavía existe" || echo "OK: proxy.ts eliminado"
```

### Verificar estructura final

```bash
tree -L 3 src/ convex/ --dirsfirst
```

---

## 10. Checklist global de cierre

- [ ] Todas las fases del plan completadas.
- [ ] Cada fase tiene su commit con mensaje `t3(faseX): ...`.
- [ ] `pnpm build` verde en la rama.
- [ ] `pnpm lint` verde en la rama.
- [ ] `pnpm test` verde en la rama.
- [ ] `pnpm test:e2e` verde en la rama.
- [ ] `pnpm exec convex codegen` sin errores.
- [ ] `README.md` actualizado con la nueva estructura.
- [ ] `AGENTS.md` actualizado con las nuevas reglas de paths.
- [ ] `logs/CURRENT_SESSION.md` actualizado.

---

## 11. Auditorías por fase

Registro de verificación posterior al commit de cada fase. No sustituye al `Reportar` del ciclo EDVCR; documenta conformidad y gaps detectados después.

### Fase 0 — Auditoría 2026-06-29

**Commit auditado**: `33fc424` "t3(fase0): andamiaje, deps e inventarios de seguridad".

| Item plan | Estado | Nota |
|---|---|---|
| 0.1 Rama `feature/t3-estructura-segura` | OK | Creada desde `ca5d0b9` (main limpio). |
| 0.2 Deps (`@t3-oss/env-nextjs`, `zod`, `vitest`) | OK | En devDependencies registradas con rango semver. |
| 0.3 Carpetas vacías | OK | Persistidas con `.gitkeep` en `src/server/`, sus subcarpetas, `convex/_lib/`, `convex/fichas/` y `convex/pt/`. |
| 0.4 Inventarios (`imports-antes`, `imports-relativos`, `convex-api-uso-antes`) | OK | 192 / 228 / 120 líneas, commiteados. Segunda revisión corrigió el plan raíz: el nombre esperado es `convex-api-uso-antes.txt`, no `convex-api-uso.txt`. |
| 0.5 Scripts `test` / `test:watch` | OK | Agregados a `package.json`. |
| 0.6 `pnpm build` verde | OK documentado | Documentado en `logs/history/260629_1851_findings.md`. No re-corrido en auditoría (árbol sucio con trabajo de Fase 2/3 sin commitear). |

**Lección para fases siguientes**: cuando el plan pida "crear carpetas vacías", usar `.gitkeep` para que persistan en el commit. Aplica retroactivamente a Fase 0 si se quiere cerrar limpio.

**Acciones pendientes tras auditoría**:
1. Sincronizar `logs/CURRENT_SESSION.md` con el estado real (Fase 0 y 1 commiteadas). **Hecho**.
2. Investigar `src/convex/` untracked — el plan deja `convex/` en raíz, no en `src/`. Posible trabajo de Fase 5 mal ubicado.
3. Decidir si se agregan `.gitkeep` en las carpetas faltantes (cierre limpio de Fase 0) o se dejan para cuando Fase 3/5 cree contenido allí. **Hecho: se agregaron `.gitkeep`.**
4. Confirmar que Fase 5 use `logs/plans/convex-api-uso-antes.txt` como baseline; el nombre incorrecto `convex-api-uso.txt` ya fue corregido en el plan raíz.

### Fase 1 — pendiente de auditoría
