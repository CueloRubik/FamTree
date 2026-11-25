# FamTree 4 · Web (bloque 1)
Editor personal de árboles genealógicos. Esta rama (Development) conserva GitHub Pages: https://cuelorubik.github.io/FamTree/.

- Abre, crea y edita proyectos, fichas y relaciones; arrastra y amplía el árbol, usa directorio, cronología y revisión.
- Guarda proyectos en IndexedDB y exporta .ftree. También abre .famtree antiguo y JSON v1. La página aloja la aplicación, no publica árboles ni sincroniza proyectos.
- Ejecuta npm start para servir localmente mediante Python 3; npm test para el motor.
- Escritorio: Electron-Mac y Electron-Windows son las ramas independientes. Ver docs/PLAN-V4.md para los cinco bloques.
- .ftree es binario, no cifrado. Conserva copias fuera del navegador: borrar los datos del sitio elimina sus proyectos locales.

## FamTree 4.2 · Bloque 3
En Árbol, selecciona Orgánico, Ascendencia, Descendencia, Abanico o Familia inmediata. Las vistas alternativas son de consulta, con persona central y profundidad configurable. Análisis permite calcular rutas de parentesco, detectar coincidencias, revisar y fusionar fichas con deshacer, comparar proyectos por ID y ver estadísticas. Revisión también da acceso a estas herramientas. Las ubicaciones se agrupan por texto; mapas y georreferenciación quedan para el bloque 4. El formato .ftree sigue siendo binario v2.
