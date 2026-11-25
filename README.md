# FamTree 3.0

Editor genealógico en español para web y macOS, con una interfaz compartida y formato binario propio.

## Web
https://cuelorubik.github.io/FamTree/ (Development, raíz). Desarrollo local: npm run start:web y http://localhost:8000.

## Mac (incluye Catalina Intel)
Con Node.js 18 y npm:
```sh
npm install
npm start
```
Electron 28.3.3 está fijado para compatibilidad con Catalina; es una versión antigua sin mantenimiento de seguridad. El escritorio carga únicamente los recursos locales y bloquea tráfico de red del renderer. FamilySearch se abre en el navegador externo. No se carga la página remota.

Compilar: npm run build:mac (Intel DMG); npm run build:mac:dir (Intel .app); npm run build:mac:universal (Intel + Apple Silicon DMG, requiere herramientas de macOS). La compilación local no está firmada ni notarizada para distribución. Instalar la versión principal en /Applications/FamTree.app.

## Uso
- Nuevo: escribe el nombre del proyecto. Añadir persona: escribe una ficha.
- Selecciona un círculo: edita su ficha, añade padre/madre, hijo/a, pareja, hermano/a (comparte los padres ya registrados) o conecta una persona existente.
- Arrastra el fondo, mueve personas, usa rueda para acercar, Ordenar para restaurar posiciones. Deshacer y rehacer revierten ediciones.
- Personas: filtro y orden. Cronología: nacimientos y fallecimientos. Revisión: fechas, lugares, fuentes y vínculos pendientes.
- Proyectos: abre, renombra, duplica y elimina copias locales.
- Guardar: web descarga .famtree; escritorio escribe el documento seleccionado, o pregunta dónde guardarlo. Guardar como crea otra copia. El proyecto local se guarda automáticamente; el archivo externo se actualiza con Guardar. Si el original cambió externamente, se ofrece guardar con otro nombre. Los JSON antiguos se importan sin sobrescribirlos.
- .famtree es la nueva extensión del mismo binario .ftree. Ambos se abren; no hay conversión obligatoria. Ver docs/FTREE.md.

## Asociación en macOS
La app empaquetada declara los tipos .famtree y .ftree y recibe open-file antes de estar lista. Si una compilación FamTree 3 archivada recibe un archivo, intenta abrirlo en /Applications/FamTree.app (solo si su bundle ID coincide). Si falta, abre el documento localmente. Las carpetas npm start no se registran como apps de Finder; se puede abrir desde su interfaz o pasar el archivo: npm start -- /ruta/arbol.famtree. Si macOS selecciona una versión anterior que no tiene este mecanismo, usar Finder > Obtener información > Abrir con > FamTree de Aplicaciones > Cambiar todo. Launch Services decide la asociación; no se modifica automáticamente la preferencia del usuario.

La aplicación instalada, versiones archivadas y carpetas de desarrollo usan perfiles separados; se intercambian mediante .famtree. El archivo público y los proyectos privados no se sincronizan entre navegador y escritorio.

## Privacidad
Proyectos locales en IndexedDB y metadatos de archivos locales en el perfil de Electron, sin nube ni cifrado. Conserva copias. El archivo público data/tree.json conserva la proyección revisada de fallecidos, sin notas, fuentes ni posiciones. Un adulto revisa antes de publicar. No subas archivos .famtree, .ftree, datos privados ni credenciales a GitHub.

## Pruebas
npm test (36 unitarias); Actions comprueba web y Electron en Linux. El empaquetado y asociación Finder requieren verificación en macOS real. No hay GEDCOM, sincronización remota ni cifrado.
