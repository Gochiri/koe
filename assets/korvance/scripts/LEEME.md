# Generadores

Los tres archivos de `assets/korvance/` no se editan a mano: se regeneran desde acá.

| Script | Genera | Cómo |
| --- | --- | --- |
| `make_planilla.py` | `../planilla-sprint.xlsx` | `pip install openpyxl && python make_planilla.py` |
| `make_gratuito_docx.js` | `../automatizacion-minima.docx` | `npm install docx && node make_gratuito_docx.js` |
| `build_kit_html.py` | la versión web del kit | `pip install markdown && python build_kit_html.py` |

**Ojo con las rutas.** Los tres tienen rutas absolutas del entorno donde se escribieron
(`/tmp/claude-0/...`). Antes de correrlos en local hay que apuntarlos a este repo:
la salida a `assets/korvance/`, y en el caso de `build_kit_html.py`, la entrada a
`vault/korvance/`.

`kit_template.html` es la plantilla que usa `build_kit_html.py` — el marco, los estilos
y el menú lateral. El contenido sale de los `.md` de `vault/korvance/`.

## Verificación

La planilla tiene 1.823 fórmulas. La prueba de que quedó bien armada: cargar el ejemplo
de la hoja de números (100 consultas · 20 % · 25 % · US$200 · 12 h · US$9) y que el
**TOTAL MENSUAL dé US$1.464** y el total × 6, unos US$8.786.

LibreOffice —que es lo que se usa normalmente para recalcular un `.xlsx` y verificar que
no haya errores de fórmula— estaba roto en el entorno donde se generó. La verificación se
hizo con el paquete `formulas` de Python. Si tenés LibreOffice en local, vale correrlo.
