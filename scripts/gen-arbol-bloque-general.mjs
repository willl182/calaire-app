// Genera src/lib/sgc/arbolBloqueGeneral.ts desde docs/01_bloque_general.
//
// En el repo solo se versionan los .md del bloque general; los .docx/.xlsx viven
// en una copia local completa. Use --fuente para sumar esas carpetas:
//
//   node scripts/gen-arbol-bloque-general.mjs --fuente ../calaire-ea/docs/qms/01_bloque_general
//   node scripts/gen-arbol-bloque-general.mjs --check   (falla si el archivo esta desactualizado)
//
// Los formatos de un mismo documento se unen entre todas las fuentes.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SALIDA = join(ROOT, 'src/lib/sgc/arbolBloqueGeneral.ts')
const CODIGO_PSEA = /^(?:DG|P|I|F)-PSEA-/

const args = process.argv.slice(2)
const check = args.includes('--check')
const fuentes = [join(ROOT, 'docs/01_bloque_general')]
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--fuente') fuentes.push(resolve(args[++i] ?? ''))
}
for (const fuente of fuentes) {
  if (!existsSync(fuente)) throw new Error(`Fuente no encontrada: ${fuente}`)
}

const comparar = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** Agrega los documentos PSEA de `dir` al mapa nombre -> { formatos, carpeta }. */
async function leerItems(dir, items) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    if (!CODIGO_PSEA.test(entrada.name)) continue
    if (entrada.isDirectory()) {
      items.set(entrada.name, { formatos: new Set(['carpeta']), carpeta: true })
      continue
    }
    if (!entrada.isFile()) continue
    const ext = extname(entrada.name)
    if (!ext) continue
    const nombre = entrada.name.slice(0, -ext.length)
    const item = items.get(nombre) ?? { formatos: new Set(), carpeta: false }
    if (!item.carpeta) item.formatos.add(ext.slice(1).toLowerCase())
    items.set(nombre, item)
  }
}

const carpetas = new Map()
const raiz = new Map()
for (const fuente of fuentes) {
  await leerItems(fuente, raiz)
  for (const entrada of await readdir(fuente, { withFileTypes: true })) {
    if (!entrada.isDirectory() || !/^\d{2}_/.test(entrada.name)) continue
    const items = carpetas.get(entrada.name) ?? new Map()
    await leerItems(join(fuente, entrada.name), items)
    carpetas.set(entrada.name, items)
  }
}

const serializar = (items) => [...items.entries()]
  .sort(([a], [b]) => comparar(a, b))
  .map(([nombre, item]) => ({ nombre, formatos: [...item.formatos].sort(comparar), carpeta: item.carpeta }))

const bloqueGeneralCarpetas = [...carpetas.entries()]
  .sort(([a], [b]) => comparar(a, b))
  .map(([nombre, items]) => ({ nombre, items: serializar(items) }))

const contenido = `// Generado desde docs/01_bloque_general con scripts/gen-arbol-bloque-general.mjs. No editar a mano.
export type ItemBloqueGeneral = {
  nombre: string
  formatos: string[]
  carpeta: boolean
}

export type CarpetaBloqueGeneral = {
  nombre: string
  items: ItemBloqueGeneral[]
}

export const bloqueGeneralCarpetas: CarpetaBloqueGeneral[] = ${JSON.stringify(bloqueGeneralCarpetas, null, 2)}

export const bloqueGeneralRaiz: ItemBloqueGeneral[] = ${JSON.stringify(serializar(raiz), null, 2)}
`

if (check) {
  const actual = existsSync(SALIDA) ? await readFile(SALIDA, 'utf8') : ''
  if (actual !== contenido) {
    console.error('arbolBloqueGeneral.ts esta desactualizado. Ejecute pnpm sgc:gen-arbol.')
    process.exit(1)
  }
  console.log('arbolBloqueGeneral.ts al dia.')
} else {
  await writeFile(SALIDA, contenido)
  const total = bloqueGeneralCarpetas.reduce((suma, carpeta) => suma + carpeta.items.length, 0)
  console.log(`ok: ${bloqueGeneralCarpetas.length} carpetas, ${total} documentos (${fuentes.length} fuente(s)).`)
}
