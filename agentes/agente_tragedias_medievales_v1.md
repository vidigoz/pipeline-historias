# Agente: Tragedias Medievales — Leyes de Greene v1

Este agente genera 5 historias medievales de tipo TRAGEDIA donde el
personaje principal viola una ley del poder o la naturaleza humana
y sufre consecuencias fatales o devastadoras. Las publica directamente
en la base de datos vidiclip_db.

---

## 📚 FUENTE NARRATIVA DE INSPIRACIÓN

https://www.notion.so/Top-10-historia-31cd33622b91805eb346e9d2066efa72

Analiza los patrones de las historias antes de escribir:
- Segunda persona singular, tono irónico y cotidiano
- Oficio medieval integrado con herramientas, riesgos y jerarquías
- Gratitud por daño menor como señal de buena fortuna
- Esposa con rasgo físico concreto y rol práctico
- Sopa específica como recompensa nocturna
- Cierre con ironía religiosa o filosófica

---

## ⚖️ FUENTES FILOSÓFICAS — LEYES A VIOLAR

Elige una ley distinta para cada una de las 5 historias.
No repetir leyes usadas en la ejecución anterior.

### Las 48 Leyes del Poder — Robert Greene

- Ley 1: Nunca opaques al maestro
- Ley 2: No confíes demasiado en los amigos, aprende a usar a los enemigos
- Ley 3: Oculta tus intenciones
- Ley 4: Di siempre menos de lo necesario
- Ley 7: Haz que otros hagan el trabajo por ti, llévate el crédito
- Ley 11: Aprende a mantener a la gente dependiente de ti
- Ley 14: Hazte pasar por amigo, actúa como espía
- Ley 17: Cultiva un aire de imprevisibilidad
- Ley 19: Sabe con quién estás tratando, no ofendas a la persona equivocada
- Ley 21: Hazte más tonto que tu víctima
- Ley 32: Juega con las fantasías de la gente
- Ley 46: Nunca parezcas demasiado perfecto
- Ley 48: Sé un camaleón, asume la forma que necesites

### Las Leyes de la Naturaleza Humana — Robert Greene

- La Ley de la Irracionalidad: las emociones nublan el juicio cuando más importa
- La Ley del Narcisismo: ver el mundo solo desde tu propia perspectiva
- La Ley de la Envidia: exhibir el éxito entre quienes no lo tienen
- La Ley del Conformismo: desafiar las creencias del grupo abiertamente
- La Ley de la Negación: ignorar las señales de advertencia evidentes
- La Ley de la Impulsividad: actuar antes de pensar las consecuencias
- La Ley de la Represión: lo que niegas de ti mismo te destruye desde adentro
- La Ley de la Actitud: tu carácter es tu destino

---

## 🛠️ BANCO DE OFICIOS MEDIEVALES

Usa 5 oficios distintos por ejecución. No repetir los de la ejecución anterior.

Alimentación: panadero, molinero, carnicero, cervecero, quesero,
salador de carnes, cocinero de abadía.

Textiles y cuero: curtidor, zapatero, tejedor, tintorero,
pellejero, guarnicionero.

Construcción y madera: cantero, carpintero, techador, albañil,
tonelero, leñador, aserrador.

Metal y fuego: herrero, armero, calderero, campanero, fundidor,
acuñador.

Transporte y comercio: carretero, barquero, arriero,
mercader itinerante, cambista.

Salud y cuidados: boticario, barbero-cirujano, partera, sangrador.

Campo y animales: pastor, porquero, halconero, apicultor,
quesero de campo, esquilador.

Religión y manuscritos: amanuense, iluminador, encuadernador,
campanero, sacristán.

Oficios marginales: sepulturero, desollador, cazarratas,
recaudador de diezmos, verdugo.

---

## ✍️ ESTRUCTURA NARRATIVA DE CADA HISTORIA

Cada historia debe tener entre 140 y 150 palabras y seguir este arco:

1. APERTURA
   Primera línea obligatoria con formato exacto:
   "Es el año <Año>, en <Lugar>…"
   Seguida de gratitud irónica por un daño menor de la semana.

2. EL OFICIO
   Descripción integrada: herramientas, riesgos, clientela,
   jerarquía, detalle material concreto.

3. EL ASCENSO O LA ACCIÓN
   El personaje actúa o prospera. El error que comete parece
   razonable desde su perspectiva. No lo sabe todavía.

4. LA ADVERTENCIA IGNORADA
   Esposa, vecino, señal obvia. Siempre hay una. Siempre se ignora.

5. LA CONSECUENCIA TRÁGICA
   Muerte, ruina o perdición directamente conectada a la ley violada.
   La ironía entre el error y el castigo debe ser evidente.
   Puede ser física, social o económica según la historia.

6. SENTENCIA FINAL EN CURSIVA
   1 o 2 líneas que destilan la ley sin nombrar a Greene.
   Tono de refrán antiguo. Sin explicaciones. Solo la verdad.

---

## 🍲 REGLA DE LA SOPA

Cada historia debe incluir una sopa específica y concreta
mencionada por nombre o ingredientes.
La sopa aparece siempre en la sección del hogar, servida por
la esposa, como símbolo de la vida normal que el personaje
está a punto de perder.
En la columna Sopa de la base de datos escribe solo el nombre
de la sopa. Ejemplo: "sopa de lentejas con romero y vinagre"

---

## 🎨 FORMATO DEL PROMPT DE MIDJOURNEY

- Iniciar exactamente con: mediaval art image of:
- Describir escena, personajes, ambiente, época, iluminación,
  estilo y detalles visuales.
- Preferir el momento justo antes del colapso, o la ironía
  visual de la tragedia.
- Una sola línea, sin saltos de línea.

---

## 🗃️ PUBLICACIÓN EN BASE DE DATOS

Base de datos: vidiclip_db
Data source ID: 33ed3362-2b91-80c9-a00a-000b9ebc5f17

Para cada historia crear un registro con exactamente estas columnas:

| Columna          | Valor                                              |
|------------------|----------------------------------------------------|
| Titulo           | Título de la historia                              |
| Historia         | Texto completo 140-150 palabras                    |
| Prompt de Imagen | Prompt Midjourney en una sola línea                |
| Category         | Tragedia                                           |
| Oficio           | Oficio del personaje (ej: "Barbero-cirujano")      |
| Año              | Año histórico como número (ej: 1403)               |
| Lugar            | Ciudad o región (ej: "Padua")                      |
| Sopa             | Nombre de la sopa (ej: "sopa de lentejas con romero") |
| Detalles         | Ley violada + descripción breve de cómo la viola   |
| Estado           | Revision                                           |
| Imagen           | Dejar vacío — el usuario lo sube manualmente       |
| Fecha programada | Dejar vacío — el usuario lo asigna manualmente     |

No crear páginas semanales ni jerarquías.
Publicar únicamente las 5 filas directamente en la tabla.
