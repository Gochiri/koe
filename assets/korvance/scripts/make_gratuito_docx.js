const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, LevelFormat, convertInchesToTwip,
} = require('docx');
const fs = require('fs');

const ACCENT = 'B85206';
const INK = '1A1713';
const DIM = '4A423A';
const BOX_FILL = 'F5F1EA';
const FONT = 'Arial';

// ── helpers ──────────────────────────────────────────────
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 140, line: 288 },
  alignment: opts.align,
  children: [new TextRun({
    text, font: FONT, size: opts.size ?? 21,
    color: opts.color ?? INK, bold: opts.bold, italics: opts.italics,
  })],
});

// párrafo con partes de formato mixto: rich([['texto', {bold:true}], ...])
const rich = (parts, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 140, line: 288 },
  alignment: opts.align,
  children: parts.map(([text, o = {}]) => new TextRun({
    text, font: FONT, size: o.size ?? opts.size ?? 21,
    color: o.color ?? opts.color ?? INK, bold: o.bold, italics: o.italics,
  })),
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text, font: FONT, size: 34, bold: true, color: INK })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 420, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 6, color: ACCENT } },
  children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: ACCENT })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 300, after: 110 },
  children: [new TextRun({ text, font: FONT, size: 22, bold: true, color: INK })],
});

// fórmula destacada en caja
const box = (text) => new Paragraph({
  spacing: { before: 140, after: 140, line: 288 },
  alignment: AlignmentType.CENTER,
  shading: { type: ShadingType.CLEAR, fill: BOX_FILL, color: 'auto' },
  border: {
    left: { style: BorderStyle.SINGLE, size: 18, space: 10, color: ACCENT },
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  },
  children: [new TextRun({ text, font: FONT, size: 23, bold: true, color: INK })],
});

const nota = (text) => new Paragraph({
  spacing: { after: 200, line: 288 },
  indent: { left: convertInchesToTwip(0.2) },
  children: [new TextRun({ text, font: FONT, size: 19, italics: true, color: DIM })],
});

const bullet = (parts) => new Paragraph({
  numbering: { reference: 'vinetas', level: 0 },
  spacing: { after: 110, line: 288 },
  children: parts.map(([text, o = {}]) => new TextRun({
    text, font: FONT, size: 21, color: INK, bold: o.bold, italics: o.italics,
  })),
});

const regla = () => new Paragraph({
  spacing: { before: 260, after: 260 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, space: 2, color: 'D8D0C3' } },
  children: [new TextRun({ text: '', font: FONT, size: 2 })],
});

// ── documento ────────────────────────────────────────────
const doc = new Document({
  creator: 'Germán Borrello — Korvance',
  title: 'Automatización mínima: qué hacer antes de contratarle a nadie',
  description: 'Cuatro arreglos y la cuenta para medir la fuga, sin contratar a nadie.',
  numbering: {
    config: [{
      reference: 'vinetas',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.18) } } },
      }],
    }],
  },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1300, left: 1400, right: 1400 } } },
    children: [
      h1('Automatización mínima'),
      p('Qué hacer antes de contratarle a nadie', { size: 24, color: DIM, after: 320 }),

      p('Te llega esto porque hablamos y te dije que hoy no te conviene pagarme. Lo sostengo: cobrar por un diagnóstico que termina en una recomendación que no te cierra es una manera prolija de perderte el tiempo a los dos.'),
      p('Pero el problema que me contaste existe igual. Así que va lo que yo haría en tu lugar, sin contratar a nadie y sin comprar software. Son cuatro arreglos y una cuenta. La cuenta primero, porque sin ella los cuatro arreglos son corazonadas.'),

      h2('Primero: medí la fuga'),
      p('No se puede decidir qué arreglar sin saber cuánto cuesta lo que se está perdiendo. La cuenta tiene dos mitades y se hace en una hoja de papel.'),

      h3('Mitad uno — lo que se pierde en ventas'),
      p('Necesitás cuatro números, y los cuatro los sabés o los podés estimar:'),
      bullet([['C', { bold: true }], [' — cuántas consultas nuevas te entran por mes, entre todos los canales.']]),
      bullet([['F', { bold: true }], [' — qué parte se pierde por el camino: contestadas tarde, o nunca vueltas a contactar. Un número, y si dudás, poné el bajo.']]),
      bullet([['P', { bold: true }], [' — de las que sí atendés bien, cuántas terminan comprando.']]),
      bullet([['T', { bold: true }], [' — cuánto te deja la primera venta de un cliente nuevo.']]),
      box('Fuga comercial por mes  =  C × F × P × T'),
      nota('Ejemplo: 25 consultas, se pierde el 20 % (5), de las que atendés bien cierra el 20 %, ticket de US$ 350. → 5 × 0,20 × 350 = US$ 350 por mes.'),

      h3('Mitad dos — lo que se pierde en horas'),
      bullet([['H', { bold: true }], [' — cuántas horas por semana se van, entre todos, en tareas que se repiten: pasar datos, armar presupuestos desde cero, contestar lo mismo, cargar facturas.']]),
      bullet([['V', { bold: true }], [' — cuánto cuesta esa hora. Si no lo tenés, sueldo mensual con cargas dividido 170.']]),
      box('Costo de las horas por mes  =  H × 4,3 × V'),
      nota('Ejemplo: 6 horas por semana a US$ 5 la hora → 6 × 4,3 × 5 = US$ 129 por mes.'),

      rich([['Tu fuga son las dos mitades sumadas.', { bold: true }], [' En el ejemplo, US$ 479 por mes; en seis meses, unos US$ 2.900.']], { after: 200 }),

      p('Dos advertencias, para que el número te sirva y no te engañe.'),
      rich([['La primera: ', {}], ['esto es facturación en juego, no ganancia, y no es lo que vas a recuperar', { bold: true }], [' — es el tamaño del agujero, no el tamaño del arreglo.']]),
      rich([['La segunda: ', {}], ['usá siempre el número más bajo que te parezca creíble.', { bold: true }], [' Un número inflado te hace gastar de más.']], { after: 200 }),

      h2('Los cuatro arreglos'),
      p('Cada uno se hace con lo que ya tenés. Ninguno necesita que contrates nada.'),

      h3('1. Si se te enfrían las consultas'),
      rich([['La regla es una sola: ', {}], ['ninguna consulta se queda sin un segundo mensaje.', { bold: true }], [' No hace falta contestar en cinco minutos; hace falta no dejar de contestar.']]),
      p('Cómo: una hoja con tres columnas —quién consultó, cuándo, cuándo le escribiste por última vez— y una alarma en el celular a la misma hora todos los días hábiles. Cuando suena, abrís la hoja y le escribís a todo el que tenga más de 24 horas sin respuesta. Diez minutos.'),
      rich([['El segundo mensaje no repite el primero. En vez de ', {}], ['“¿pudiste verlo?”', { italics: true }], [', algo que agregue: un dato, una pregunta concreta sobre su caso, un plazo real.']]),

      h3('2. Si el trabajo se cae entre personas'),
      p('Casi siempre pasa lo mismo: el cliente le habla a uno, la información queda en el teléfono de ese uno, y el resto se enteran cuando el cliente se queja.'),
      rich([['Cómo: ', {}], ['un solo lugar por cliente', { bold: true }], [' —un grupo de WhatsApp, un hilo, una carpeta— y una regla dura: ', {}], ['el que cerró la venta escribe primero ahí.', { bold: true }], [' Lo que él sabe y nadie más sabe, escrito, antes de que arranque el trabajo. Cinco minutos por cliente que evitan la mitad de los malentendidos.']]),

      h3('3. Si contestás siempre lo mismo'),
      p('Cómo: durante una semana, anotá cada pregunta que te repiten. Al final vas a tener entre cinco y ocho, no cincuenta. Escribí la respuesta de cada una, bien, una sola vez, y guardalas en las respuestas rápidas de WhatsApp Business o en las notas del teléfono.'),
      p('No es un bot. Es dejar de redactar de cero algo que ya contestaste doscientas veces.'),

      h3('4. Si los datos y los reportes te comen el día'),
      rich([['Cómo: ', {}], ['una sola planilla, una sola persona, un día fijo.', { bold: true }], [' El problema casi nunca es la carga en sí: es que la hacen tres personas en tres lugares distintos y después hay que cruzarlas. Elegí una planilla, decidí quién la carga, y ponele un día y una hora en la semana.']]),

      h2('Lo que yo no haría todavía'),
      p('Esto importa tanto como lo de arriba, porque es donde se va la plata sin que se note:'),
      bullet([['No compres un CRM todavía.', { bold: true }], [' Un CRM que nadie carga es más caro que la planilla que sí se carga. Primero que el proceso funcione a mano dos meses.']]),
      bullet([['No pongas un bot de IA a atender.', { bold: true }], [' Si todavía no tenés escritas las cinco preguntas que te repiten, el bot no tiene qué contestar y va a inventar. El inventario va antes que el bot, siempre.']]),
      bullet([['No automatices el paso que más te molesta.', { bold: true }], [' Automatizá el que más veces se repite. Casi nunca son el mismo, y esa confusión es la causa más común de una automatización que quedó a medio hacer.']]),
      bullet([['No pagues una integración para algo que hacés una vez por mes.', { bold: true }], [' Doce veces al año a mano es más barato que cualquier cosa que haya que mantener.']]),

      h2('Cuándo sí conviene pagarle a alguien'),
      p('Con el número que sacaste arriba, el criterio es este:'),
      rich([['Si tu fuga en seis meses no supera con holgura lo que cuesta arreglarla, no lo pagues.', { bold: true }], [' Arreglar el tramo de entrada y seguimiento arranca en US$ 1.500. O sea: si tu fuga a seis meses no llega cómodamente a ese número, los cuatro arreglos de arriba son todo lo que necesitás por ahora.']]),
      rich([['Y hay una segunda condición, que es la que más se ignora: ', {}], ['el proceso tiene que estar funcionando a mano antes de automatizarlo.', { bold: true }], [' Automatizar un proceso que no funciona lo único que hace es que falle más rápido y en más lugares a la vez.']]),
      p('Cuando las dos cosas se cumplan —la fuga es grande y el proceso ya camina— ahí sí tiene sentido que alguien lo automatice. Puedo ser yo o puede ser otro; lo que no tiene sentido es hacerlo antes.'),

      regla(),
      p('Germán Borrello — Korvance', { size: 19, color: DIM, after: 40 }),
      p('Implementación de sistemas de automatización · Buenos Aires', { size: 19, color: DIM }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = '/tmp/claude-0/-home-user-koe/2d10d8e8-69ce-5397-9887-ba74bb52f9e3/scratchpad/kit/automatizacion-minima.docx';
  fs.writeFileSync(out, buf);
  console.log('escrito', out, buf.length, 'bytes');
});
