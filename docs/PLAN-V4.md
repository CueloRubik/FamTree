# FamTree 4 · Plan maestro

Tres ramas: Development (web y GitHub Pages), Electron-Mac (Catalina), Electron-Windows (Windows 11). main conserva orientación. El núcleo js/model.mjs, js/ftree.mjs y la lógica de datos deben mantenerse compatibles en las tres. Los archivos .ftree v1 existentes se abren sin migración, al igual que .famtree. Los cambios futuros de esquema necesitan migración explícita, round-trip y pruebas cruzadas; nunca descartar campos nuevos al guardar desde web.

## Bloques
1. Base y separación: plataforma, estructura visual escritorio, navegación, ajustes, iconos app/documento, proyectos locales, eliminación de publicación, compilaciones y regresión.
2. Expedientes y certeza: datos ampliados, eventos, nombres alternativos, parentescos adoptivos/biológicos, fuentes por afirmación, estados de certeza, etiquetas y marcadores; formato binario versionado.
3. Visualización y análisis: árbol orgánico, ascendencia, descendencia, abanico y familia inmediata; parentesco, duplicados/fusión, comparación de proyectos, estadísticas y lugares.
4. Investigación y documentos: biblioteca de adjuntos, fuentes compartidas, transcripciones, tareas e hipótesis, mapas históricos/locales, búsqueda avanzada, GEDCOM y exportación/imprimir PDF.
5. Robustez e integración: cifrado opcional, copias/versiones/recuperación, presentación, personalización final, accesibilidad, rendimiento, pruebas de ida y vuelta y compilaciones de las tres plataformas.

La web mantiene las operaciones básicas de lectura, edición y archivos, sin cargar dependencias Electron. Los módulos de escritorio pueden ser más completos; si la web abre un formato futuro, debe conservar los datos que no muestra o rechazar de forma explícita una versión que no entiende. No hay sincronización de proyectos ni publicación pública. No se promete un plazo sin medir ejecución y pruebas.

Bloque 2 (4.1): expedientes ampliados, fotos, etiquetas, eventos, evidencias y parentescos. Binario v2; lectura v1. Pendiente biblioteca de documentos compartidos (bloque 4).

Bloque 3 (4.2): vistas orgánica, ascendencia, descendencia, abanico y familia inmediata; parentesco por ruta registrada, candidatos a duplicados, fusión revisada y reversible, comparación por ID, estadísticas y agrupación de lugares con acontecimientos. El formato binario sigue siendo v2. Las vistas alternativas no cambian posiciones manuales. Comparación no identifica automáticamente árboles independientes; mapas históricos quedan en bloque 4.

Bloque 4 (4.3): documentos compartidos con adjuntos, transcripciones, tareas e hipótesis, lugares históricos y plano local de coordenadas, búsqueda avanzada, intercambio parcial GEDCOM UTF-8 e informe imprimible/PDF. Binario v3 con lectura v1/v2. El plano no contiene fronteras históricas; GEDCOM es un subconjunto y no sustituye a .ftree. No hay servicios externos ni publicación.

Cartografía base: Natural Earth 1:110m de dominio público, distribuida como trazados SVG locales (blob 04811d72fff2701ec67587e30ad8942675b511e3). No se representan fronteras históricas ni se transmiten coordenadas. Prueba de generación de PDF mediante Chromium.

Bloque 5 (4.4): exportación protegida AES-256-GCM, historial local de versiones (5 por proyecto, 128 MiB global), recuperación independiente, presentación de solo lectura y PDF gráfico, accesibilidad, CRC optimizado y cache de generaciones. Las copias protegidas no cifran IndexedDB. Pruebas nativas de empaquetado separadas de regresión Linux. La compatibilidad Catalina real requiere equipo físico.
