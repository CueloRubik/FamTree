# FamTree .ftree, especificación binaria 1
La extensión recomendada desde FamTree 3 es `.famtree`; `.ftree` sigue siendo compatible con exactamente los mismos bytes. El archivo privado es una secuencia binaria Little Endian, no contiene un documento JSON. Extensión .ftree; MIME application/octet-stream. No está cifrado ni autenticado: CRC32 detecta corrupción accidental, no manipulaciones deliberadas. Conserva copias fuera del navegador y no subas archivos privados a GitHub.

## Cabecera de 20 bytes
| Offset | Tipo | Significado |
|---|---|---|
| 0 | 8 bytes | 46 54 52 45 45 0D 0A 1A |
| 8 | uint16 | versión 1 |
| 10 | uint16 | flags, 0 |
| 12 | uint32 | longitud del cuerpo |
| 16 | uint32 | CRC32 IEEE del cuerpo |

## Cuerpo
Las cadenas se escriben como uint32 de longitud en bytes y UTF-8 sin terminador. Primero título (máximo 120 unidades UTF-16), uint32 cantidad de personas, uint32 cantidad de relaciones.

Por cada persona, en orden: cadenas id, name, birth, death, place, familysearch, notes, sources; uint8 estado (0 desconocido, 1 vivo, 2 fallecido); uint8 publicación (0/1); uint8 presencia de posición (0/1). Si hay posición, dos float64, x e y, en coordenadas del tablero, no de la pantalla. Una posición negativa es válida. Cada relación: uint8 tipo (0 progenitor→hijo, 1 pareja), uint32 índice de la persona origen, uint32 índice destino. Los índices empiezan en 0. No se admiten bytes sobrantes, identificadores duplicados, referencias ausentes, ciclos parentales, posiciones no finitas ni archivos mayores de 64 MiB. Límites: 2000 personas y 6000 relaciones.

## Conversión y asistencia
Node.js 18 o posterior:
- node tools/ftree.mjs encode privado.json familia.ftree
- node tools/ftree.mjs decode familia.ftree privado.json

El conversor no sobrescribe archivos existentes. El esquema de intercambio JSON anterior se describe en DATA.md; puede incluir un objeto positions con claves de ID y valores {x,y}. La aplicación sigue importando JSON de v1. Los asistentes deben trabajar con datos ficticios o copias privadas revisadas por adultos; no subir datos privados a repositorios. El JSON público de data/tree.json sigue siendo compatible y deliberadamente separado del formato privado.
