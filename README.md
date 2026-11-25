# FamTree 2.0

Editor genealógico en español, JavaScript nativo, sin dependencias de ejecución. Desarrollo en esta rama; main conserva las notas.

## Uso
- Abre la página publicada: https://cuelorubik.github.io/FamTree/
- Para desarrollo: python3 -m http.server 8000; abre http://localhost:8000. Node 18+: npm test.
- Proyectos (icono carpeta): crea, abre, renombra, duplica o elimina árboles locales. Cada cambio se guarda en IndexedDB; la última sesión privada se reabre en el mismo perfil. El indicador inferior informa del guardado. El archivo público y el ejemplo son de solo lectura; puedes hacer una copia en Proyectos.
- El tablero utiliza coordenadas independientes: arrastra el fondo, mueve círculos en un proyecto privado y sus ramas se redibujan en tiempo real; usa la rueda o botones para zoom, encuadra todo y vuelve a ordenar automáticamente. Los descendientes crecen hacia arriba. Menús y ficha son ocultables.
- Crea personas y descendientes/progenitores directamente, edita datos, vincula parejas, consulta FamilySearch, busca, filtra ascendencia/descendencia, abre directorio y cronología; deshacer y rehacer también revierten movimientos.
- Exporta .ftree como copia binaria y abre archivos .ftree o JSON de v1 sin reemplazar otros proyectos. Ver docs/FTREE.md y docs/DATA.md para intercambio.

## Privacidad y publicación
Los proyectos están en IndexedDB de ese navegador, no en el servidor. No están cifrados. El navegador puede eliminar sus datos y el código servido por un sitio público puede cambiar: usa copias locales y un perfil de confianza; no almacenes información confidencial en equipos compartidos. No hay sincronización entre dispositivos, autenticación ni colaboración en tiempo real. Las escrituras detectan cambios concurrentes de otra pestaña. Si falla el guardado, exporta una copia y vuelve a abrirla.

El archivo público sigue siendo data/tree.json. Preparar publicación exporta solo fichas de fallecidos marcadas como revisadas, excluye notas, fuentes, coordenadas e IDs privados. Un adulto debe revisar toda la información antes de publicar. No subas archivos privados, datos de vivos ni credenciales a GitHub. GitHub conserva historial. FamilySearch es un enlace externo, no una integración API.

Settings → Pages → Deploy from a branch → Development → /(root). Las comprobaciones de GitHub Actions incluyen tests unitarios y Chromium. No hay GEDCOM ni Excel, fotos, sincronización remota o cifrado en esta versión.
