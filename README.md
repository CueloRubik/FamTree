# FamTree 4 · Electron-Mac (bloque 1)

Web: Development. Formato .ftree común; admite .famtree anteriores y JSON v1. No hay publicación ni sincronización de árboles.

## Ejecutar
```bash
npm install
npm start
npm run build:mac
```
Intel: build:mac (DMG) o build:mac:dir (.app). Universal: npm run build:mac:universal.
Electron 28.3.3 ejecuta el programa; electron-builder 24.13.3 lo empaqueta. Electron 28 está fuera de soporte de seguridad. Instala la aplicación principal en /Applications/FamTree.app. Finder decide la asociación inicial; puedes elegirla en Obtener información > Abrir con > Cambiar todo. La build local no está firmada ni notarizada.

Los proyectos se guardan localmente. Guardar escribe archivos .ftree; Guardar como usa .ftree y los documentos anteriores conservan su nombre al guardar sobre el original. Los iconos de aplicación y documento se generan en build/ al iniciar o compilar. Las asociaciones son para la aplicación empaquetada.

## Interfaz
Menús Archivo, Edición, Vista y Herramientas, navegación plegable, área de trabajo ampliable, configuración, directorio, cronología, revisión y primeras vistas de lugares, documentos, investigación y estadísticas. Documentos y notas resumen los campos actuales; adjuntos y tareas llegan en el bloque 4.

## Desarrollo
Consulta docs/PLAN-V4.md y docs/FTREE.md. npm test verifica el motor; npm run test:icons verifica las imágenes. CI ejecuta pruebas web y Electron bajo Linux. El empaquetado y asociación nativa requieren pruebas en el sistema correspondiente. Los archivos todavía no están cifrados; conserva copias.
