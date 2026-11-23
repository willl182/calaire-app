"""Genera los formatos maestros F-PSEA en xlsx usando la plantilla F-PSEA-01."""
import re, os, glob
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.drawing.image import Image

DIR = "docs/01_bloque_general/04_formatos_maestros"
LOGO = "/tmp/claude-1000/-home-w182-w421-calaire-app2/3543c98d-4259-4efb-bd17-77f8bef6e6ba/scratchpad/logo/xl/media/image1.png"
ROWS_BLANK = 30

THIN = Side(style="thin")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HDR_FILL = PatternFill("solid", fgColor="D9D9D9")
BAND_FILL = PatternFill("solid", fgColor="F2F2F2")
A = lambda **k: Alignment(vertical="center", wrap_text=True, **k)


# ---------- lectura de las especificaciones .md ----------
def md_sections(path):
    secs = []
    cur = None
    for line in open(path, encoding="utf-8"):
        h = re.match(r"^#{2,4}\s+(.*)", line)
        if h:
            cur = {"t": h.group(1).strip(), "rows": []}
            secs.append(cur)
            continue
        if cur is not None and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                continue
            cur["rows"].append(cells)
    return secs


def clean(s):
    return re.sub(r"`|\*\*", "", s).strip()


def table(md, heading):
    """Devuelve (encabezados, filas) de la primera seccion cuyo titulo contiene `heading`."""
    for s in md_sections(os.path.join(DIR, md)):
        if heading.lower() in s["t"].lower() and s["rows"]:
            hdr = [clean(c) for c in s["rows"][0]]
            rows = [[clean(c) for c in r] for r in s["rows"][1:]]
            return hdr, rows
    raise KeyError(f"{md} :: {heading}")


def fields(md, *headings):
    """Lista (campo, descripcion) tomada de tablas Campo|[Obligatorio|]Descripcion."""
    out = []
    for h in headings:
        hdr, rows = table(md, h)
        di = len(hdr) - 1
        for r in rows:
            if r and r[0]:
                out.append((r[0], r[di] if len(r) > di else ""))
    return out


# ---------- construccion del libro ----------
def header_block(ws, code, title, ncols):
    ncols = max(ncols, 6)
    last = get_column_letter(ncols)
    cod_col = max(ncols - 1, 3)
    mid = get_column_letter(cod_col - 1)
    cod = get_column_letter(cod_col)
    ws.merge_cells(f"A1:A4")
    ws.merge_cells(f"B1:{mid}2")
    ws.merge_cells(f"B3:{mid}4")
    ws.merge_cells(f"{cod}1:{last}1")
    ws.merge_cells(f"{cod}2:{last}3")
    ws.merge_cells(f"{cod}4:{last}4")
    ws["B1"] = "LABORATORIO DE CALIDAD DEL AIRE"
    ws["B3"] = title.upper()
    ws[f"{cod}1"] = f"Código  {code}"
    ws[f"{cod}2"] = "Versión: 01"
    ws[f"{cod}4"] = "Página 1 de 1"
    for row in ws["A1":f"{last}4"]:
        for c in row:
            c.border = BOX
            c.font = Font(name="Arial", sz=11, b=c.coordinate in ("B1", "B3"))
            c.alignment = A(horizontal="center")
    ws[f"{cod}1"].font = Font(name="Arial", sz=10)
    ws.row_dimensions[1].height = 38
    ws.row_dimensions[3].height = 22
    ws.column_dimensions["A"].width = 20
    if os.path.exists(LOGO):
        img = Image(LOGO)
        img.width, img.height = 130, 65
        ws.add_image(img, "A1")


def write_table(ws, row, cols, nblank=ROWS_BLANK, widths=None):
    for j, c in enumerate(cols, start=1):
        cell = ws.cell(row=row, column=j, value=c)
        cell.font = Font(name="Arial", sz=10, b=True)
        cell.fill = HDR_FILL
        cell.alignment = A(horizontal="center")
        cell.border = BOX
        ws.column_dimensions[get_column_letter(j)].width = (
            widths[j - 1] if widths else min(max(14, len(c) + 4), 40)
        )
    ws.row_dimensions[row].height = 30
    for i in range(row + 1, row + 1 + nblank):
        for j in range(1, len(cols) + 1):
            cell = ws.cell(row=i, column=j)
            cell.border = BOX
            cell.font = Font(name="Arial", sz=10)
            cell.alignment = A()
    return row + 1 + nblank


def write_band(ws, row, text, ncols):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    c = ws.cell(row=row, column=1, value=text)
    c.font = Font(name="Arial", sz=10, b=True)
    c.fill = BAND_FILL
    c.alignment = A(horizontal="left")
    for j in range(1, ncols + 1):
        ws.cell(row=row, column=j).border = BOX
    return row + 1


def write_form(ws, row, pairs, ncols=3, headers=("Campo", "Valor", "Observaciones")):
    for j, h in enumerate(headers, start=1):
        c = ws.cell(row=row, column=j, value=h)
        c.font = Font(name="Arial", sz=10, b=True)
        c.fill = HDR_FILL
        c.alignment = A(horizontal="center")
        c.border = BOX
    row += 1
    for name, _ in pairs:
        c = ws.cell(row=row, column=1, value=name)
        c.font = Font(name="Arial", sz=10)
        c.alignment = A()
        for j in range(1, ncols + 1):
            ws.cell(row=row, column=j).border = BOX
            ws.cell(row=row, column=j).alignment = A()
        row += 1
    ws.column_dimensions["A"].width = 42
    for j in range(2, ncols + 1):
        ws.column_dimensions[get_column_letter(j)].width = 38
    return row


def instructivo(wb, blocks):
    """Hoja de referencia: campo, descripcion, seccion."""
    ws = wb.create_sheet("Instructivo")
    ws.append(["Seccion", "Campo", "Descripcion / criterio"])
    for c in ws[1]:
        c.font = Font(name="Arial", sz=10, b=True)
        c.fill = HDR_FILL
        c.border = BOX
        c.alignment = A(horizontal="center")
    for sec, pairs in blocks:
        for name, desc in pairs:
            ws.append([sec, name, desc])
    for j, w in enumerate([28, 34, 90], start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.border = BOX
            c.font = Font(name="Arial", sz=10)
            c.alignment = A()
    ws.freeze_panes = "A2"
    return ws


def new_book(code, title, ncols, sheet="Formato"):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet
    ws.sheet_view.showGridLines = False
    header_block(ws, code, title, ncols)
    return wb, ws


def finish(wb, ws, filename, ncols):
    ws.freeze_panes = "A7"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    wb.save(os.path.join(DIR, filename))
    print("ok:", filename)


def build_table_format(code, title, filename, md, headings, extra_cols=None):
    pairs = fields(md, *headings)
    cols = [p[0] for p in pairs] + (extra_cols or [])
    wb, ws = new_book(code, title, len(cols))
    write_table(ws, 6, cols)
    instructivo(wb, [(md.split(".md")[0], pairs)])
    finish(wb, ws, filename, len(cols))


# ---------------------------------------------------------------- formatos
def f03():
    md = "F-PSEA-03 Registro de participacion.md"
    build_table_format(
        "F-PSEA-03", "Registro de participacion", "F-PSEA-03 Registro de participacion.xlsx",
        md, ["4.1 Identificacion", "4.2 Participacion", "4.3 Personal", "4.4 Informacion tecnica"],
    )


def f04():
    build_table_format(
        "F-PSEA-04", "Anexo tecnico de equipos e instrumentos",
        "F-PSEA-04 Anexo tecnico de equipos e instrumentos.xlsx",
        "F-PSEA-04 Anexo tecnico de equipos e instrumentos.md", ["4. Campos minimos"],
    )


def f05():
    md = "F-PSEA-05 Ficha basica de ronda EA.md"
    b1 = fields(md, "3. Identificacion de la ronda")
    b2 = fields(md, "4. Alcance tecnico")
    b3 = fields(md, "5. Participantes y equipos")
    hdr6, rows6 = table(md, "6. Planificacion y registros")
    wb, ws = new_book("F-PSEA-05", "Ficha basica de ronda EA", 3)
    r = 6
    for titulo, pares in [("1. Identificacion de la ronda", b1),
                          ("2. Alcance tecnico resumido", b2),
                          ("3. Participantes y equipos", b3)]:
        r = write_band(ws, r, titulo, 3)
        r = write_form(ws, r, pares) + 1
    r = write_band(ws, r, "4. Planificacion y registros asociados", 3)
    r = write_form(ws, r, [(x[0], "") for x in rows6], headers=("Documento", "Estado / enlace", "Observaciones")) + 1
    r = write_band(ws, r, "5. Aprobacion de ficha", 3)
    for j, h in enumerate(["Rol", "Nombre", "Fecha", "Firma / aprobacion"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = Font(name="Arial", sz=10, b=True); c.fill = HDR_FILL; c.border = BOX; c.alignment = A(horizontal="center")
    r += 1
    for rol in ["Coordinacion del PEA", "Responsable tecnico", "Responsable de calidad"]:
        ws.cell(row=r, column=1, value=rol).font = Font(name="Arial", sz=10)
        for j in range(1, 5):
            ws.cell(row=r, column=j).border = BOX
            ws.cell(row=r, column=j).alignment = A()
        r += 1
    ws.column_dimensions["D"].width = 30
    instructivo(wb, [("Identificacion", b1), ("Alcance tecnico", b2), ("Participantes y equipos", b3)])
    finish(wb, ws, "F-PSEA-05 Ficha basica de ronda EA.xlsx", 4)


def f06():
    md = "F-PSEA-06 Planificacion de ronda EA.md"
    wb, ws = new_book("F-PSEA-06", "Planificacion de ronda EA", 6)
    r = 6
    blocks = [
        ("3. Identificacion y control documental", ("Campo", "Dato")),
        ("4. Alcance tecnico de la ronda", ("Aspecto", "Definicion aprobada")),
        ("5. Participantes, contactos y prerrequisitos", None),
        ("6. Recursos criticos y condiciones de operacion", None),
        ("7. Roles y responsabilidades", None),
        ("8. Cronograma operativo de la ronda", None),
        ("9. Criterios operativos del item PT", ("Criterio", "Definicion")),
        ("10. Control estadistico pre-ronda", ("Elemento", "Definicion")),
        ("11. Matriz A-U", None),
        ("12. Aprobacion y control de cambios", None),
    ]
    inst = []
    for heading, _ in blocks:
        hdr, rows = table(md, heading)
        ncols = len(hdr)
        r = write_band(ws, r, heading, max(ncols, 6))
        for j, h in enumerate(hdr, start=1):
            c = ws.cell(row=r, column=j, value=h)
            c.font = Font(name="Arial", sz=10, b=True); c.fill = HDR_FILL; c.border = BOX; c.alignment = A(horizontal="center")
        r += 1
        for row_vals in rows:
            # se conservan las etiquetas de la primera columna; el resto queda para diligenciar
            ws.cell(row=r, column=1, value=row_vals[0])
            for j in range(1, ncols + 1):
                ws.cell(row=r, column=j).border = BOX
                ws.cell(row=r, column=j).alignment = A()
                ws.cell(row=r, column=j).font = Font(name="Arial", sz=10)
            r += 1
        r += 1
        inst.append((heading, [(rw[0], " | ".join(rw[1:])) for rw in rows]))
    ws.column_dimensions["A"].width = 40
    for j in range(2, 7):
        ws.column_dimensions[get_column_letter(j)].width = 30
    instructivo(wb, inst)
    finish(wb, ws, "F-PSEA-06 Planificacion de ronda EA.xlsx", 6)


def f07():
    build_table_format(
        "F-PSEA-07", "Preparacion y control del item",
        "F-PSEA-07 Preparacion y control del item.xlsx",
        "F-PSEA-07 Preparacion y control del item.md", ["4. Campos minimos"],
    )


def f08():
    build_table_format(
        "F-PSEA-08", "Datos reportados por participante",
        "F-PSEA-08 Datos reportados por participante.xlsx",
        "F-PSEA-08 Datos reportados por participante.md", ["Campos minimos"],
    )


def f09():
    build_table_format(
        "F-PSEA-09", "Datos de participantes exportados para analisis PT",
        "F-PSEA-09 Datos de participantes exportados para analisis PT.xlsx",
        "F-PSEA-09 Datos de participantes exportados para analisis PT.md",
        ["3. Campos minimos"],
    )


def f10():
    build_table_format(
        "F-PSEA-10", "Registro de preprocesamiento de datos",
        "F-PSEA-10 Registro de preprocesamiento de datos.xlsx",
        "F-PSEA-10 Registro de preprocesamiento de datos.md", ["Campos minimos del registro"],
    )


def f11():
    md = "F-PSEA-11 Homogeneidad y estabilidad del item.md"
    build_table_format(
        "F-PSEA-11", "Homogeneidad y estabilidad del item",
        "F-PSEA-11 Homogeneidad y estabilidad del item.xlsx", md, ["4. Campos minimos"],
    )


def f11x(letra, titulo, md):
    build_table_format(f"F-PSEA-11{letra}", titulo, f"F-PSEA-11{letra} {titulo}.xlsx", md, ["6. Campos minimos"])


def f12():
    md = "F-PSEA-12 Datos oficiales consolidados para evaluacion de aptitud.md"
    datos = fields(md, "3. Fuente de datos")
    ctrl = fields(md, "5. Campos de control")
    cols = [p[0] for p in datos]
    wb, ws = new_book("F-PSEA-12", "Datos oficiales consolidados para evaluacion de aptitud", len(cols))
    write_table(ws, 6, cols)
    ws2 = wb.create_sheet("Control")
    ws2.sheet_view.showGridLines = False
    header_block(ws2, "F-PSEA-12", "Control de consolidacion", 3)
    write_form(ws2, 6, ctrl)
    instructivo(wb, [("Datos consolidados", datos), ("Campos de control", ctrl)])
    finish(wb, ws, "F-PSEA-12 Datos oficiales consolidados para evaluacion de aptitud.xlsx", len(cols))


def f13():
    md = "F-PSEA-13 Informe final de resultados.md"
    hdr, rows = table(md, "3. Estructura minima")
    insumos = table(md, "4. Insumos obligatorios")[1]
    wb, ws = new_book("F-PSEA-13", "Informe final de resultados", 5)
    r = write_band(ws, 6, "1. Estructura minima del informe", 5)
    for j, h in enumerate(["Seccion", "Contenido esperado", "Estado", "Responsable", "Observaciones"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = Font(name="Arial", sz=10, b=True); c.fill = HDR_FILL; c.border = BOX; c.alignment = A(horizontal="center")
    r += 1
    dv = DataValidation(type="list", formula1='"Pendiente,En elaboracion,Completo"', allow_blank=True)
    ws.add_data_validation(dv)
    for sec, contenido in [(x[0], x[1]) for x in rows]:
        ws.cell(row=r, column=1, value=sec)
        ws.cell(row=r, column=2, value=contenido)
        for j in range(1, 6):
            ws.cell(row=r, column=j).border = BOX
            ws.cell(row=r, column=j).alignment = A()
            ws.cell(row=r, column=j).font = Font(name="Arial", sz=10)
        dv.add(ws.cell(row=r, column=3))
        r += 1
    r += 1
    r = write_band(ws, r, "2. Insumos obligatorios", 5)
    for j, h in enumerate(["Insumo", "Uso en el informe", "Version / referencia", "Verificado por", "Fecha"], start=1):
        c = ws.cell(row=r, column=j, value=h)
        c.font = Font(name="Arial", sz=10, b=True); c.fill = HDR_FILL; c.border = BOX; c.alignment = A(horizontal="center")
    r += 1
    for ins in insumos:
        ws.cell(row=r, column=1, value=ins[0])
        ws.cell(row=r, column=2, value=ins[1] if len(ins) > 1 else "")
        for j in range(1, 6):
            ws.cell(row=r, column=j).border = BOX
            ws.cell(row=r, column=j).alignment = A()
            ws.cell(row=r, column=j).font = Font(name="Arial", sz=10)
        r += 1
    for j, w in enumerate([34, 52, 20, 24, 24], start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    finish(wb, ws, "F-PSEA-13 Informe final de resultados.xlsx", 5)


def f19():
    md = "F-PSEA-19 Acta de inicio de ronda.md"
    datos = fields(md, "1. Datos de la ronda")
    wb, ws = new_book("F-PSEA-19", "Acta de inicio de ronda", 6)
    r = write_band(ws, 6, "1. Datos de la ronda", 6)
    r = write_form(ws, r, datos) + 1
    r = write_band(ws, r, "2. Declaracion de inicio", 6)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
    c = ws.cell(row=r, column=1, value="En la fecha y lugar indicados se declara formalmente iniciada la ronda identificada en esta acta. Los asistentes conocen el calendario, cronograma e instructivo aplicables. El valor asignado se determina por el metodo de referencia descrito a continuacion, con los instrumentos relacionados en esta acta.")
    c.font = Font(name="Arial", sz=10); c.alignment = A()
    ws.row_dimensions[r].height = 42
    r += 2
    r = write_band(ws, r, "3. Metodo de determinacion del valor asignado", 6)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
    c = ws.cell(row=r, column=1, value="El valor asignado (xpt) de cada nivel de concentracion es la media de las mediciones del analizador de referencia de Calaire durante el periodo de medicion establecido, calculada a partir de 3 promedios de una hora. Su incertidumbre expandida (k = 2) combina la incertidumbre del instrumento de referencia y la debida a la falta de homogeneidad del item.")
    c.font = Font(name="Arial", sz=10); c.alignment = A()
    ws.row_dimensions[r].height = 56
    r += 2
    for title, headers, nrows, height in [
        ("4. Instrumentos para metodo de referencia", ["No.", "Instrumento", "Codigo interno", "Marca", "Modelo", "Serial"], 8, None),
        ("5. Firmas", ["No.", "Nombre", "Entidad", "Rol", "Firma", ""], 8, 26),
    ]:
        r = write_band(ws, r, title, 6)
        for j, h in enumerate(headers, start=1):
            c = ws.cell(row=r, column=j, value=h)
            c.font = Font(name="Arial", sz=10, b=True); c.fill = HDR_FILL; c.border = BOX; c.alignment = A(horizontal="center")
        r += 1
        for i in range(1, nrows + 1):
            ws.cell(row=r, column=1, value=i)
            for j in range(1, 7):
                ws.cell(row=r, column=j).border = BOX
                ws.cell(row=r, column=j).alignment = A()
                ws.cell(row=r, column=j).font = Font(name="Arial", sz=10)
            if height:
                ws.row_dimensions[r].height = height
            r += 1
        r += 1
    for j, w in enumerate([8, 34, 28, 24, 24, 24], start=1):
        ws.column_dimensions[get_column_letter(j)].width = w
    finish(wb, ws, "F-PSEA-19 Acta de inicio de ronda.xlsx", 6)


def f20():
    md = "F-PSEA-20 Rotulado anonimo.md"
    hdr, _ = table(md, "4. Registro placeholder")
    wb, ws = new_book("F-PSEA-20", "Rotulado anonimo", len(hdr))
    write_table(ws, 6, hdr)
    finish(wb, ws, "F-PSEA-20 Rotulado anonimo.xlsx", len(hdr))


def f21():
    build_table_format(
        "F-PSEA-21", "Relacion de instrumentos Calaire usados",
        "F-PSEA-21 Relacion de instrumentos Calaire usados.xlsx",
        "F-PSEA-21 Relacion de instrumentos Calaire usados.md", ["4. Campos por instrumento"],
    )


def simple5(code, titulo, md):
    build_table_format(code, titulo, f"{code} {titulo}.xlsx", md, ["5. Campos minimos"])


if __name__ == "__main__":
    f03(); f04(); f05(); f06(); f07(); f08(); f09(); f10(); f11()
    f11x("A", "Datos preprocesados de homogeneidad", "F-PSEA-11A Datos preprocesados de homogeneidad.md")
    f11x("B", "Datos preprocesados de estabilidad", "F-PSEA-11B Datos preprocesados de estabilidad.md")
    f11x("C", "Resultados de homogeneidad", "F-PSEA-11C Resultados de homogeneidad.md")
    f11x("D", "Resultados de estabilidad", "F-PSEA-11D Resultados de estabilidad.md")
    f12(); f13()
    simple5("F-PSEA-14", "Registro caso de queja o NC segun aplique", "F-PSEA-14 Registro caso de queja o NC segun aplique.md")
    simple5("F-PSEA-15", "Registro de apelaciones", "F-PSEA-15 Registro de apelaciones.md")
    simple5("F-PSEA-16", "Matriz de competencia autorizacion", "F-PSEA-16 Matriz de competencia autorizacion.md")
    simple5("F-PSEA-17", "Evaluacion de proveedores criticos", "F-PSEA-17 Evaluacion de proveedores criticos.md")
    simple5("F-PSEA-18", "Comunicacion participantes", "F-PSEA-18 Comunicacion participantes.md")
    f19(); f20(); f21()
