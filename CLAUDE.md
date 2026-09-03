@AGENTS.md

# Contexto del proyecto

Repo de **Germán Borrello** (Buenos Aires). Contiene dos cosas que conviene no confundir:

1. **La app** (`app/`, `lib/`, `components/`, `drizzle/`) — dashboard personal en Next.js 16. Ver `README.md` para el stack y el setup, y `.impeccable.md` para el criterio de diseño de la UI (mono, oscuro, sin color de acento).
2. **El material de negocio** (`vault/`, `assets/`, `docs/`) — el kit de venta de Korvance y el plan de la marca personal. No es código: son documentos que se usan tal como están.

Lo de Eden **no vive acá**: vive en Eden (workspace `6040eb87-2a22-4c91-8a8f-b33ea6723c0a`), y se lee por MCP. Este repo no lo espeja a propósito.

Para trabajar este repo en local con los mismos conectores MCP y las mismas skills, ver `docs/SETUP-LOCAL.md`.

---

## Los dos frentes de negocio, y por qué no se mezclan

Están separados desde agosto de 2026 y mezclarlos es el error más caro que se puede cometer acá.

| | **Canal de YouTube** (marca personal) | **Korvance / GHL Team Latam** (agencia) |
| --- | --- | --- |
| A quién le habla | profesional 35-55 saturado, que ya sabe qué hacer y no se mueve | dueño de negocio de servicios que factura +US$10k/mes con la operación desbordada |
| Motor permitido | diagnóstico, sin cifras de resultado | resultado medible, horas y plata, ROI |
| Qué gobierna | `[MIS REGLAS]` en Eden | la hoja de números (`vault/korvance/00-hoja-numeros.md`) |
| Estado | 72 suscriptores, tercera pieza del registro nuevo publicada | oferta lista, sprint de ventas corriendo |

**Error de un lado:** aplicar el registro del canal (sin números, sin ROI) a una conversación de venta de la agencia, y quedarse sin vender.
**Error del otro:** meter hype, escasez o promesas de resultado en una pieza del canal.

---

## Reglas duras, que no se negocian

**No inventar biografía.** Si una pieza necesita una escena y la escena no está en `[MI BANCO DE HISTORIAS]` (Eden), se dice y se para. La evidencia puede ser ajena —una cita, un estudio, la historia de un tercero— pero **el pensamiento no**, y la ficción sobre su propia vida está prohibida.

**El período 2017–2021 no se narra ni se insinúa.** Estado: sin decidir. Ninguna pieza lo caracteriza; se dice "unos años después" y nada más. Los hechos viven en una sola nota sellada en Eden y no se copian a ningún lado.

**Nada de prueba social inventada.** No hay ni un caso de éxito documentado todavía. Está prohibido fabricar casos, cifras de resultados, testimonios o capturas. Cuando falta prueba, se resuelve con la garantía, el mecanismo nombrado o la especificidad técnica — nunca con un ejemplo inventado presentado como real.

**Sin escasez ni urgencia falsas.** Todo enunciado tiene que sobrevivir la pregunta *"¿esto es literalmente cierto?"*.

**Español rioplatense** (vos, tenés, querés) en todo lo que se le muestre a él o a un cliente. Sin emojis, sin tono de infoproducto.

---

## Trabajando con Eden por MCP

**Para saber qué hay en un board, solo sirve `eden_read_board`.** `eden_search_workspace_items` no es confiable: falla con URLs y devuelve resultados sin relación.

**En español, la búsqueda semántica falla.** `eden_find_workspace_items` con una frase en castellano devuelve ruido en inglés. Se usa `depth: "deep"` con **una sola palabra clave** en español.

**Ningún id se escribe sin haberlo leído en la misma sesión.** Los ids de memoria dan 404 y se pierde tiempo.

**Sacar de un board ≠ borrar.** Sacar borra la referencia y es reversible; borrar destruye el archivo y solo lo recupera la papelera de la app. Ya se destruyeron tres notas así. Para mover algo: **primero agregar al destino, después sacar del origen.**

**El editor abierto pisa las escrituras del MCP.** Si una nota está abierta en la app mientras el MCP la actualiza, la pestaña guarda su copia vieja encima. Antes de editar una nota por MCP, que esté cerrada; después de editar, cerrar y reabrir.

**Créditos.** El plan tiene límite mensual. Son gratis: `get_note_markdown`, crear/actualizar/renombrar notas, `search_workspace_items`, `list_tags`, `list_skills`. Se cobran: `read_board`, `read_card`, `analyze_creator`, `search_social_content`, `update_item_tags`, `connect_items`, `find_workspace_items`. `eden_search_creators` devuelve 402 en este plan: descubrimiento de creadores no está disponible.

---

## Qué hay en `vault/korvance/` — el kit de venta

Diez documentos, en orden de uso. **`00-hoja-numeros.md` manda sobre todos los demás:** si otra pieza dice algo distinto sobre plata, plazos, pagos, garantía o condiciones, la pieza está mal y se corrige contra la hoja.

| Archivo | Cuándo se abre |
| --- | --- |
| `00-hoja-numeros.md` | siempre que se toque un número |
| `01-canales.md` | el domingo (lista tibia) y cada mañana (rutina) |
| `02-prospeccion.md` | al escribir el primer mensaje y los tres toques |
| `03-venta.md` | cuando alguien contesta: de la respuesta al pago |
| `04-objeciones.md` | durante cualquier conversación |
| `05-sesion.md` | la sesión pagada de 90 minutos |
| `06-entregable.md` | el Mapa de Fugas que recibe el cliente |
| `07-puente.md` | del diagnóstico a la implementación |
| `08-gratuito.md` | lo que se le manda al que no califica |
| `09-verificacion.md` | qué quedó por confirmar y el plan del domingo |

La oferta, en una línea: **consultoría de descubrimiento de US$249**, 90 minutos, que entrega el Mapa de Fugas y una recomendación de nivel; después, implementación desde US$1.500 (Nivel 1), US$3.500 (Nivel 2) o setup más cuota mensual (Nivel 3).

En `assets/korvance/`: la landing (`landing.html`, el custom code que corre en GoHighLevel), la planilla del sprint (`planilla-sprint.xlsx`), el documento gratuito (`automatizacion-minima.docx`) y en `scripts/` los generadores de cada uno.

---

## El plan de la marca personal

`docs/plan-marca-personal.md` — 2.100 líneas, veinticuatro anexos, en orden cronológico. Es el registro de las decisiones y de por qué se tomaron, para no relitigarlas. Los que más se consultan:

- **Anexo 2** — los números de la agencia y de dónde salen los precios
- **Anexo 12** — qué se toma y qué se deja de SOEE, y la distinción canal/agencia
- **Anexo 20** — el cambio de registro: nombrar el mecanismo con vocabulario del oficio propio
- **Anexo 22** — el barrido de mercado y la regla de las dos puertas (búsqueda vs recomendación)
- **Anexo 24** — el rediseño del workspace de Eden y la regla de la prueba ajena

---

## Cómo trabajar acá

**Antes de proponer construir algo, preguntar si hace falta.** El patrón documentado de este proyecto es optimizar antes de explotar: se rediseña el sistema en vez de usarlo. Hay un sprint de ventas corriendo con una regla dura — **cero construcción** — y la métrica del mes son conversaciones comerciales, no mejoras. Si aparece "una idea mejor", la pregunta que corresponde es *¿cuántas veces vendiste la anterior?*

**Un segundo artefacto del mismo marco no se guarda.** Si un video, documento o creador nuevo repite un marco que ya está filtrado en el plan, se dice y no se guarda nada.

**La vara para material ajeno:** no *¿está bueno?* sino **¿qué hace que ninguno de los anteriores ya haga?** Si la respuesta es nada, se dice y se descarta.
