# FamTree 4 · Electron-Windows (bloque 1)

Web: Development. Formato .ftree común; admite .famtree anteriores y JSON v1. No hay publicación ni sincronización de árboles.

## Ejecutar
```powershell
npm.cmd install
npm.cmd start
npm.cmd run build:win
```
Windows 11 x64, Node moderno. Electron 45.5.0 y electron-builder 26.18.0, estables al 24 de noviembre de 2026. build:win genera el instalador NSIS y build:win:dir la carpeta ejecutable. El instalador configura .ftree y .famtree con un icono de documento distinto al de la aplicación. Windows decide las asociaciones predeterminadas.

Los proyectos se guardan localmente. Guardar escribe archivos .ftree; Guardar como usa .ftree y los documentos anteriores conservan su nombre al guardar sobre el original. Los iconos de aplicación y documento se generan en build/ al iniciar o compilar. Las asociaciones son para la aplicación empaquetada.

## Interfaz
Menús Archivo, Edición, Vista y Herramientas, navegación plegable, área de trabajo ampliable, configuración, directorio, cronología, revisión y primeras vistas de lugares, documentos, investigación y estadísticas. Documentos y notas resumen los campos actuales; adjuntos y tareas llegan en el bloque 4.

## Desarrollo
Consulta docs/PLAN-V4.md y docs/FTREE.md. npm test verifica el motor; npm run test:icons verifica las imágenes. CI ejecuta pruebas web y Electron bajo Linux. El empaquetado y asociación nativa requieren pruebas en el sistema correspondiente. Los archivos todavía no están cifrados; conserva copias.

## FamTree 4.2 · Bloque 3
En Árbol, selecciona Orgánico, Ascendencia, Descendencia, Abanico o Familia inmediata. Las vistas alternativas son de consulta, con persona central y profundidad configurable. Análisis permite calcular rutas de parentesco, detectar coincidencias, revisar y fusionar fichas con deshacer, comparar proyectos por ID y ver estadísticas. Revisión también da acceso a estas herramientas. Las ubicaciones se agrupan por texto; mapas y georreferenciación quedan para el bloque 4. El formato .ftree sigue siendo binario v2.

## FamTree 4.3 · Bloque 4
Documentos compartidos, adjuntos, transcripciones, tareas e hipótesis, lugares históricos con plano local, búsqueda avanzada, GEDCOM parcial y PDF nativo. .ftree v3 abre v1/v2; las versiones antiguas no abren v3. Actualiza las tres plataformas. Adjuntos 8 MiB, total 32 MiB. No incluye mapas históricos reales ni GEDCOM completo.
