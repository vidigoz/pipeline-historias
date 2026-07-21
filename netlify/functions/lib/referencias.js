// lib/referencias.js
//
// Historias de referencia ("Top 10 historia") embebidas en el código, en vez
// de leerlas de Notion en cada corrida. Leer esa página por la API de bloques
// sumaba latencia de red variable a una función que ya iba justa de tiempo
// (10s de límite en Netlify Functions plan Personal), y era una causa
// probable del 504 al generar historias. El contenido viene de
// agentes/tophistorias.md — si se actualiza esa fuente en Notion, hay que
// volver a pegar el texto aquí a mano.
//
// Recortado a 4 historias (de las 10 originales): suficiente para calibrar
// tono/patrones, y reduce el tamaño del prompt — otro ajuste para evitar el
// 504 de Netlify al generar.

const HISTORIAS_REFERENCIA = `Es el año 1349. Te sientes el hombre más afortunado de la región porque mientras todos sufren por la Peste Negra, tu negocio florece como nunca. Has cavado ciento doce tumbas este mes, tres veces más que el año anterior, y ya has cobrado por adelantado por otras cuarenta. Has podido contratar a dos ayudantes, aunque uno ya muestra los bultos negros en las axilas. Tu esposa ha cosido veintisiete sudarios esta semana y tu hijo de once años puede cargar cuerpos de adultos sin ayuda. Tienes carne en la mesa tres veces por semana y has comprado una vaca. A tus avanzados 34 años, Dios esta de tu lado.

Es el año 1351. Das gracias porque solo has sufrido quemaduras graves en la mitad del rostro por el sebo hirviendo que usas en el proceso de creación de tus veladores. Tu nueva mezcla de sebo y cera de abeja, aunque difícil de preparar, ha reducido el humo negro que antes oscurecía las paredes y provocaba fiebres nocturnas en los niños, lo que ha aumentado tus encargos. El abad te ha pedido doce cirios para la Pascua, lo que alimentará a tu familia durante un mes y te permitirá abastecer de grano y harinas tu almacén para el invierno. Solo uno de tus cuatro hijos muestra síntomas de la tos negra, y para tu fortuna, es el más débil, el que no puede batir la mezcla de sebo con cera, por lo que su posible pérdida no afectará tu oficio. Tu esposa, embarazada, ha superado el quinto mes, más lejos de lo que logró en sus tres intentos anteriores. A tus avanzados 23 años, aunque los vapores han destruido casi por completo tu sentido del olfato, aún puedes percibir el aroma terroso de la sopa de cebolla con tubérculos silvestres que tu esposa prepara cada noche. Una bendición, sin duda. La vida derrama su abundancia sobre ti.

Es el año 1350. Eres el nuevo verdugo del pueblo de Regensburgo y estás agradecido porque solo has fallado dos decapitaciones este año, necesitando un segundo golpe. El magistrado te ha aumentado la paga a tres monedas por ejecución, permitiéndote comprar botas de cuero para el invierno que se aproxima, y ya te alcanza para desinfectar tu máscara de cuero una vez por semana con vinagre. Los familiares de los ejecutados solo han intentado asesinarte en una ocasión y, a pesar de tu oficio, has hecho dos amigos en la taberna con los que juegas Schachzabel dos veces por semana. Tu esposa, cinco años menor que tú, parece haberse acostumbrado a tu profesión y ya no le dan náuseas por el olor a sangre cuando regresas a casa. A tus avanzados 21 años, tu brazo derecho es tan fuerte que puedes partir leña de un solo golpe. Verdaderamente, has encontrado tu vocación divina.

Es el año 1352. Das gracias porque el conde solo te ha arrojado a los perros en una ocasión este año por contar chistes que no lo hicieron reír. Tu joroba, que en cualquier otro lugar sería motivo de burla, aquí es tu mayor activo, provocando risas que te mantienen alimentado hasta tres veces por semana. Solo has pasado diez días en el calabozo por hacer chistes sobre la condesa, mucho menos que tu predecesor, quien fue colgado por hablar de su enorme nariz. Como los hijos del conde aman tus chistes, te han permitido quedarte con el sombrero y el atuendo de colores del bufón anterior. A tus 27 años, aunque tus rodillas crujen después de cada voltereta y tu voz se quiebra cuando cantas debido a tu avanzada edad, sigues siendo el favorito del conde, con muchos meses de vida por delante.`;

module.exports = { HISTORIAS_REFERENCIA };
