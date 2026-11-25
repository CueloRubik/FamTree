# FamTree 4 · Web (bloque 1)
Editor personal de árboles genealógicos. Esta rama (Development) conserva GitHub Pages: https://cuelorubik.github.io/FamTree/.

- Abre, crea y edita proyectos, fichas y relaciones; arrastra y amplía el árbol, usa directorio, cronología y revisión.
- Guarda proyectos en IndexedDB y exporta .ftree. También abre .famtree antiguo y JSON v1. La página aloja la aplicación, no publica árboles ni sincroniza proyectos.
- Ejecuta npm start para servir localmente mediante Python 3; npm test para el motor.
- Escritorio: Electron-Mac y Electron-Windows son las ramas independientes. Ver docs/PLAN-V4.md para los cinco bloques.
- .ftree es binario, no cifrado. Conserva copias fuera del navegador: borrar los datos del sitio elimina sus proyectos locales.

## FamTree 4.2 · Bloque 3
En Árbol, selecciona Orgánico, Ascendencia, Descendencia, Abanico o Familia inmediata. Las vistas alternativas son de consulta, con persona central y profundidad configurable. Análisis permite calcular rutas de parentesco, detectar coincidencias, revisar y fusionar fichas con deshacer, comparar proyectos por ID y ver estadísticas. Revisión también da acceso a estas herramientas. Las ubicaciones se agrupan por texto; mapas y georreferenciación quedan para el bloque 4. El formato .ftree sigue siendo binario v2.

## FamTree 4.3 · Bloque 4
En Revisión abre Documentos e investigación, Búsqueda avanzada o GEDCOM y PDF. En escritorio las secciones Documentos, Investigación y Lugares también presentan sus registros. Adjuntos PDF, PNG, JPEG, WebP y TXT (8 MiB individual, 32 MiB conjunto), referencias a varias personas, transcripciones, tareas e hipótesis con fuentes, coordenadas locales, búsqueda combinada. Importación GEDCOM UTF-8 5.5/5.5.1/7.0, exportación parcial 7.0; no es una copia completa y no infiere padres adicionales. Informe genealógico imprimible. .ftree v3 guarda todos los datos; abre v1/v2 pero versiones antiguas no leen v3. Actualiza todas las plataformas.

Mapa: costas de Natural Earth 1:110m (dominio público, https://www.naturalearthdata.com/about/terms-of-use/), empaquetadas localmente. No incluye calles ni fronteras históricas. El PDF de escritorio se crea con printToPDF; la web usa la función de impresión del navegador.
