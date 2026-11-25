# Formato binario .ftree v2
FamTree 4.1 abre .ftree y .famtree binarios v1/v2; escribe v2. Los anteriores a 4.1 no leen v2. No se permite exportar v1 si hay datos nuevos. El JSON conserva version:1 y campos opcionales nuevos. Cabecera de 20 bytes sin cambios, versión 1 o 2, flags 0, longitud, CRC32. Todo little endian; cadena = uint32 de longitud + UTF-8.
Cuerpo: título, uint32 personas, uint32 relaciones. Persona v1: id, name, birth, death, place, familysearch, notes, sources (cadenas), uint8 estado (unknown/living/deceased), bit heredado publish, uint8 posición presente, dos float64 si presente. Relación v1: uint8 tipo parent=0/partner=1, uint32 índices origen y destino.
Extensión v2 por persona después de posición: occupation (160), bio (5000), uint8 bookmark, uint32 aliases (máx 32) y cadenas (160), uint32 tags (máx 32) y cadenas (60), uint8 portrait (0 nada, 1 PNG, 2 JPEG, 3 WebP), si presente uint32 longitud y bytes (máx 262144); uint32 events (máx 100): id (80), uint8 type, date (80), place (160), description (1000), uint8 certainty, sources; uint32 claims (máx 100): id (80), uint8 field, value (1000), uint8 certainty, sources. sources: uint32 count (máx 20), cada fuente title (300), reference (1000), quote (2000).
Extensión v2 por relación: uint8 kind, uint8 certainty, sources.
Ordinales desde cero:
- certainty: unknown, probable, confirmed, contradictory.
- kind: unknown, biological, adoptive, step, foster (partner solo unknown).
- event type: birth, death, baptism, marriage, divorce, residence, migration, occupation, burial, other.
- claim field: name, birth, death, place, occupation, relationship, other.
JSON portrait usa data:image/...;base64,...; binario guarda bytes sin base64. Eventos y afirmaciones alternativas no sustituyen automáticamente los datos principales. La certeza es una calificación humana. Límites: 64 MiB, 2000 personas, 6000 relaciones. Convertidor local: node tools/ftree.mjs encode entrada.json salida.ftree o decode entrada.ftree salida.json.

## Versión binaria 3 (FamTree 4.3)
La cabecera admite versiones 1, 2 y 3. La escritura predeterminada es 3; conserva toda la estructura v2 y añade al final tres listas. Las versiones anteriores no leen v3. La exportación a v1/v2 se rechaza si hay investigación ampliada.
- Documentos: uint32 cantidad (máx 200); por registro cadenas id, title, reference, transcript, notes; uint32 referencias a personas + cadenas ID; uint8 tipo adjunto (0 ninguno, 1 PDF, 2 PNG, 3 JPEG, 4 WebP, 5 texto UTF-8), si presente cadena name, uint32 tamaño y bytes. Máx 8 MiB por adjunto, 32 MiB conjunto. No se ejecutan ni se muestran automáticamente adjuntos.
- Tareas: uint32 cantidad (máx 500); cadenas id,title; uint8 kind (task,hypothesis), status (pending,progress,done), certainty (unknown,probable,confirmed,contradictory); cadenas description,due; lista IDs de personas y lista IDs de documentos.
- Lugares: uint32 cantidad (máx 500); cadenas id,name,historical,period,notes; lista IDs de personas; uint8 coordenadas presentes, si presente float64 lat,lon.
En JSON opcional research={documents,tasks,places}; attachment={type,name,data} usa base64 solo en JSON/memoria; el archivo guarda bytes. Se validan IDs, referencias y coordenadas. La fusión y eliminación de personas actualiza referencias. Mantiene el límite total de 64 MiB.
