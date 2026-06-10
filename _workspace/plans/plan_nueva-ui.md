# Alinear UI de calaire-app con el estilo visual de pt_app

El objetivo es que calaire-app se sienta como el **mismo entorno** que pt_app (la app R/Shiny). Actualmente calaire-app tiene un look "SaaS moderno" con fondo claro, nav tipo top-bar, y sin footer institucional. La meta es adoptar la identidad visual institucional descrita en `descripcion_ui.md`.

## User Review Required

> [!IMPORTANT]
> **Tipografía**: El documento pide **Droid Sans** (Google Font). Actualmente se usa **DM Sans**. ¿Confirmo el cambio a Droid Sans, o prefieres mantener DM Sans que es visualmente similar pero más moderna?

> [!IMPORTANT]
> **Sidebar vs Top-bar**: `descripcion_ui.md` describe una **sidebar izquierda** fija para navegación. Actualmente calaire-app usa una **top navigation bar** horizontal. La propuesta es mantener la top-bar actual pero aplicarle el estilo institucional (fondo crema, borde inferior amarillo) en vez de convertirla en sidebar — ya que el layout top-bar es más funcional para la app web y no rompe la estructura existente. Si prefieres migrar a sidebar lateral real, dímelo.

> [!IMPORTANT]
> **Footer**: Actualmente no hay footer. Lo agrego como componente nuevo con las tres columnas (Proyecto, Instituciones, Contacto). ¿El texto del footer es el mismo que en pt_app, o quieres ajustar algún contenido?

> [!IMPORTANT]
> **Páginas excluidas**: El login, denied y not-found quedan como están (confirmado por el usuario para login). ¿Las otras dos (denied, not-found) también se excluyen?

---

## Análisis de brechas

### Estado actual vs. objetivo

| Aspecto | Estado actual | Objetivo (pt_app) |
|---|---|---|
| **Fondo general** | `#F4F5F7` | `#E8EAED` (más gris) |
| **Superficie cards** | `#FFFFFF` blanco puro | `#F5F6F7` gris muy claro |
| **Tipografía** | DM Sans | Droid Sans |
| **Header** | Top-bar blanca, borde bottom 4px | Tarjeta con gradiente crema, logo grande, borde bottom amarillo, border-radius 12px |
| **Navegación** | Top-bar horizontal integrada en header | Sidebar izquierda (o top-bar con estilo institucional) |
| **Cards** | Blancas con borde y sombra suave | Gris claro `#F5F6F7`, borde, border-radius 12px |
| **Tablas thead** | Borde bottom amarillo ✓ | Gradiente crema en thead, letra más grande |
| **Botones** | Gradiente amarillo ✓ | Casi idéntico ✓ |
| **Footer** | No existe | Gris oscuro `#585858`, borde top amarillo, 3 columnas |
| **Inputs focus** | Amarillo ✓ | Idéntico ✓ |
| **Espaciado** | Compacto-medio | Más generoso (1.5-2rem) |
| **Scrollbar** | Amarillo ✓ | Aceptable ✓ |

---

## Proposed Changes

### Capa 1: Design Tokens y Base Global

#### [MODIFY] [globals.css](file:///home/w182/w421/calaire-app/app/globals.css)

Cambios en las CSS custom properties y estilos base:

1. **Variables de color**:
   - `--background`: `#F4F5F7` → `#E8EAED`
   - `--surface`: `#FFFFFF` → `#F5F6F7`
   - `--surface-muted`: `#F5F6F7` → mantener, usarlo como hover
   - Agregar `--pt-primary-subtle: #F5F5F0` (crema, actualmente es `#FFF8E6`)

2. **Tipografía**:
   - Cambiar `--font-sans` de `"DM Sans"` a `"Droid Sans"` (o mantener DM Sans según decisión)
   
3. **`.card`**: 
   - Cambiar `background: var(--surface)` → sigue correcto con el nuevo valor de `--surface`
   
4. **`.header-bar`**: 
   - Agregar gradiente: `linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)`
   - Agregar `padding: 2rem`, `border-radius: 12px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.10)`
   - Mantener `border-bottom: 4px solid var(--pt-primary)`

5. **`.card-accent`**:
   - Actualizar para usar el nuevo `--surface`

6. **Agregar nuevas clases**:
   - `.app-footer` — footer oscuro institucional
   - `.footer-content` — grid de 3 columnas
   - `.footer-section` — con títulos amarillos uppercase

7. **Tablas**: 
   - Agregar estilo para `thead th` con gradiente crema y padding más generoso

---

#### [MODIFY] [layout.tsx](file:///home/w182/w421/calaire-app/app/layout.tsx)

- Agregar `<link>` a Google Fonts para Droid Sans (si se confirma el cambio)
- Sin cambios estructurales

---

### Capa 2: Navegación

#### [MODIFY] [SidebarNav.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/SidebarNav.tsx)

Ajustar el estilo del top-bar para que se sienta institucional:
- Fondo: gradiente crema `linear-gradient(135deg, #F5F6F7 0%, #F5F5F0 100%)`
- Border-bottom: `4px solid var(--pt-primary)` (ya existe pero reforzar)
- Brand label: mantener "CALAIRE APP" pero quitar el badge rojo, usar estilo más sobrio con texto tracking-wide
- Aumentar padding vertical

---

#### [MODIFY] [RondaContextNav.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/rondas/%5Bid%5D/RondaContextNav.tsx)

- Aplicar mismo estilo de fondo crema y border-bottom amarillo
- Alinear visualmente con la top-nav

---

### Capa 3: Header del Dashboard

#### [MODIFY] [page.tsx (dashboard)](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/page.tsx)

El header principal (líneas 902-940):
- Aplicar clase `header-bar` ya actualizada con gradiente y border-radius
- Hacer el logo más grande: `height={64}` o `height={80}` en vez de `height={32}`
- Agregar subtítulo en amarillo oscuro: "Gases Contaminantes Criterio"
- Agregar texto institucional en gris: "Laboratorio CALAIRE | Universidad Nacional de Colombia - Sede Medellín"
- Espaciado más generoso

---

### Capa 4: Footer institucional

#### [NEW] [Footer.tsx](file:///home/w182/w421/calaire-app/app/components/Footer.tsx)

Componente nuevo con:
- Fondo `#585858`, border-top `4px solid #FDB913`
- Grid de 3 columnas: Proyecto, Instituciones, Contacto
- Títulos en amarillo, uppercase, letter-spacing
- Texto en blanco con opacidad 0.8
- Links en `#FFD54F`

---

#### [MODIFY] [dashboard layout.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/layout.tsx)

- Importar y renderizar `<Footer />` al final del layout

---

### Capa 5: Páginas internas (estilo consistente)

#### [MODIFY] [rondas/[id]/page.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/rondas/%5Bid%5D/page.tsx)

- Verificar que `header-bar` aplica el nuevo estilo (gradiente + radius)
- Sin cambios estructurales, el estilo se hereda de globals.css

#### [MODIFY] [rondas/nueva/page.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/rondas/nueva/page.tsx)

- Mismo ajuste: el `card` class ya tiene el nuevo fondo
- Sin cambios estructurales

#### [MODIFY] [participantes/page.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/rondas/%5Bid%5D/participantes/page.tsx)

- Mismo: hereda estilos de globals.css
- Sin cambios estructurales

#### [MODIFY] [resultados/page.tsx](file:///home/w182/w421/calaire-app/app/%28protected%29/dashboard/rondas/%5Bid%5D/resultados/page.tsx)

- Mismo: hereda estilos de globals.css
- Sin cambios estructurales

---

### Capa 6: Páginas de participante

#### Las páginas en `app/(protected)/ronda/[codigo]/` y `app/(protected)/mi-dashboard/`

- Heredan los tokens CSS actualizados automáticamente
- Revisar que el uso de `var(--surface)` y `var(--background)` se vea correcto con los nuevos valores

---

### Resumen de archivos a modificar

| # | Archivo | Tipo | Cambios |
|---|---|---|---|
| 1 | `app/globals.css` | MODIFY | Tokens, header-bar, footer, tablas |
| 2 | `app/layout.tsx` | MODIFY | Google Font link (si aplica) |
| 3 | `app/components/Footer.tsx` | NEW | Componente footer institucional |
| 4 | `app/(protected)/dashboard/SidebarNav.tsx` | MODIFY | Estilo institucional top-bar |
| 5 | `app/(protected)/dashboard/layout.tsx` | MODIFY | Agregar Footer |
| 6 | `app/(protected)/dashboard/page.tsx` | MODIFY | Header con logo grande + textos institucionales |
| 7 | `app/(protected)/dashboard/rondas/[id]/RondaContextNav.tsx` | MODIFY | Alinear estilo crema |

Las demás páginas (ronda detail, participantes, resultados, nueva, etc.) heredan los cambios de globals.css sin necesidad de modificaciones.

---

## Verification Plan

### Visual
- Ejecutar `pnpm dev` y navegar por todas las vistas del dashboard
- Comparar lado a lado con los screenshots de pt_app
- Verificar: fondo gris, header con gradiente, footer oscuro, cards gris claro, tablas con thead crema

### Automated
- `pnpm build` — verificar que compila sin errores
- Revisar en viewport mobile (< 768px) que el responsive no se rompe

### Checklist visual
- [ ] Fondo general es `#E8EAED` y no blanco
- [ ] Cards son `#F5F6F7` y no blancas puras  
- [ ] Header tiene gradiente crema con border-radius 12px
- [ ] Header tiene logo grande y textos institucionales
- [ ] Top-bar tiene fondo institucional
- [ ] Footer oscuro visible en todas las vistas
- [ ] Tablas tienen thead con fondo crema
- [ ] Tipografía es Droid Sans (o DM Sans según decisión)
- [ ] Botones mantienen gradiente amarillo
- [ ] Focus rings siguen siendo amarillo
